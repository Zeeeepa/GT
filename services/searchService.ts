
import type { SearchParams, SearchResult, NpmPackage, NpmPackageDetail, FileNode, TrendingDateRange, SearchGithubRepo, SearchGithubCodeItem } from '../types';
import { searchNpmPackagesEnhanced } from './npmEnhancedSearch';

const GITHUB_API_BASE_URL = 'https://api.github.com/search';
const NPM_API_BASE_URL = 'https://registry.npmjs.org';
const JSDELIVR_API_BASE_URL = 'https://data.jsdelivr.com/v1/packages/npm';

// --- GitHub Service ---

export const searchGithub = async (
  params: SearchParams,
  onProgress?: (foundCount: number, scannedCount: number) => void
): Promise<SearchResult[]> => {
  const { query, startDate, endDate, limit, sort, searchType, githubToken, trendingDateRange, language, isChineseFilter } = params;
  const isTrending = searchType === 'trending';
  const isChineseTrendingSearch = isTrending && !!isChineseFilter;

  if (!query.trim() && !isTrending) {
    return [];
  }

  const buildQueryParts = (isTrending: boolean): string[] => {
    const qParts: string[] = [];
    if (query.trim()) {
      qParts.push(query.trim());
    }

    if (isTrending) {
      const date = new Date();
      switch (trendingDateRange) {
        case 'day': date.setDate(date.getDate() - 1); break;
        case 'month': date.setMonth(date.getMonth() - 1); break;
        case 'week':
        default: date.setDate(date.getDate() - 7); break;
      }
      const dateString = date.toISOString().split('T')[0];
      qParts.push(`created:>${dateString}`);
    } else {
      const dateQualifier = searchType === 'users' ? 'created' : 'created';
      if (startDate && endDate) {
        qParts.push(`${dateQualifier}:${startDate}..${endDate}`);
      } else if (startDate) {
        qParts.push(`${dateQualifier}:>=${startDate}`);
      } else if (endDate) {
        qParts.push(`${dateQualifier}:<=${endDate}`);
      }
    }

    if (['repositories', 'trending', 'code'].includes(searchType) && language?.trim()) {
      qParts.push(`language:"${language.trim()}"`);
    }
    return qParts;
  };
  
  let allFoundResults: SearchResult[] = [];
  let totalScanned = 0;
  let page = 1;
  const perPage = 100; // Fetch 100 at a time, it's the max.

  while (allFoundResults.length < limit) {
    const q = buildQueryParts(isTrending).join(' ');
    
    const queryParams = new URLSearchParams({
      q,
      order: 'desc',
      per_page: perPage.toString(),
      page: page.toString(),
    });
    
    // For repo-size, we sort client-side after fetching all data. The API gets a default sort.
    const effectiveSort = isTrending ? 'stars' : (sort === 'repo-size' ? '' : sort);
    if (effectiveSort) {
      queryParams.set('sort', effectiveSort);
    }

    const headers: HeadersInit = {
      'Accept': searchType === 'code' ? 'application/vnd.github.v3.text-match+json' : 'application/vnd.github.v3+json',
    };
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    try {
      const endpoint = isTrending ? 'repositories' : searchType;
      const response = await fetch(`${GITHUB_API_BASE_URL}/${endpoint}?${queryParams}`, { headers });

      if (!response.ok) {
        if (response.status === 422) { // Unprocessable Entity, e.g., page > 10 for search
            console.warn("Reached end of searchable results from GitHub API.");
            break;
        }
        const errorData = await response.json();
        const message = errorData.errors?.[0]?.message || errorData.message || `GitHub API error: ${response.status}`;
        throw new Error(message);
      }

      const data = await response.json();
      let itemsOnPage = data.items as SearchResult[];
      
      if (itemsOnPage.length === 0) {
        break; // No more results from API
      }
      
      totalScanned += itemsOnPage.length;

      if (isChineseTrendingSearch) {
        const chineseReposOnPage = await filterReposForChineseContent(itemsOnPage as SearchGithubRepo[], githubToken);
        allFoundResults.push(...chineseReposOnPage);
      } else {
        allFoundResults.push(...itemsOnPage);
      }

      if (onProgress) {
        onProgress(allFoundResults.length, totalScanned);
      }

      // For non-filtering searches, we can break as soon as we have enough.
      // For filtering searches, we must continue until the limit is met or pages run out.
      if (!isChineseTrendingSearch && searchType !== 'code' && allFoundResults.length >= limit) {
        break;
      }

      const linkHeader = response.headers.get('Link');
      if (!linkHeader || !linkHeader.includes('rel="next"')) {
        break; // No more pages
      }
      
      page++;
      
      // GitHub Search API has a hard limit of 1000 results (10 pages of 100).
      if (page > 10) {
          console.warn("Reached GitHub Search API's 1000 result limit (10 pages).");
          break;
      }

    } catch (error: unknown) {
      if (error instanceof Error) {
          console.error(`Failed to fetch ${searchType}:`, error);
          throw new Error(`Failed to fetch page ${page} of ${searchType}: ${error.message}`);
      }
      console.error('An unexpected error occurred:', error);
      throw new Error('An unexpected error occurred while fetching from GitHub.');
    }
  }

  return allFoundResults.slice(0, limit);
};

const containsChinese = (text: string | null): boolean => {
    if (!text) return false;
    // This regex covers most CJK Unified Ideographs.
    return /[\u4e00-\u9fff]/.test(text);
};

async function getReadmeContent(owner: string, repoName: string, token: string | null): Promise<string> {
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3.raw',
    };
    if (token) {
        headers['Authorization'] = `token ${token}`;
    }
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}/readme`, { headers });
        if (!response.ok) {
            // README might not exist or be private, which is fine for filtering.
            return ""; 
        }
        return await response.text();
    } catch (error) {
        console.warn(`Could not fetch README for ${owner}/${repoName}`, error);
        return ""; // Fail gracefully
    }
}

/**
 * Performs a code search within a specific repository for common Chinese characters.
 * This is an efficient way to check for Chinese content in code files (including comments)
 * without fetching file contents.
 */
async function checkCodeForChinese(repoFullName: string, token: string | null): Promise<boolean> {
    // A set of very common Chinese characters. Searching for any of these is likely 
    // to find a file if any Chinese text exists in the codebase.
    const commonChars = ['的', '是', '不', '我', '一', '在', '人', '有']; 
    const query = `${commonChars.join(' OR ')} repo:${repoFullName}`;

    const headers: HeadersInit = { 'Accept': 'application/vnd.github.v3+json' };
    if (token) {
        headers['Authorization'] = `token ${token}`;
    }
    // We only need to know if results exist, so we ask for 1 result to be efficient.
    const queryParams = new URLSearchParams({ q: query, per_page: '1' });

    try {
        const response = await fetch(`https://api.github.com/search/code?${queryParams}`, { headers });
        if (!response.ok) {
            // Log non-critical errors (like rate limits) and continue.
            console.warn(`Code search failed for ${repoFullName} with status: ${response.status}`);
            return false;
        }
        const data = await response.json();
        return data.total_count > 0;
    } catch (error) {
        console.error(`Error during code search for ${repoFullName}:`, error);
        return false;
    }
}

/**
 * Filters a list of repositories to find those containing Chinese content.
 * It checks the repository name, description, README file, and now also searches
 * through the code files for Chinese characters.
 */
export async function filterReposForChineseContent(repos: SearchGithubRepo[], token: string | null): Promise<SearchGithubRepo[]> {
    const results = await Promise.allSettled(
        repos.map(async (repo) => {
            // First, check the cheapest sources: name and description.
            if (containsChinese(repo.name) || containsChinese(repo.description)) {
                return repo;
            }

            // If not found, run the more expensive API calls (README fetch and code search) in parallel.
            const [readmeContent, hasChineseInCode] = await Promise.all([
                getReadmeContent(repo.owner.login, repo.name, token),
                checkCodeForChinese(repo.full_name, token),
            ]);
            
            if (containsChinese(readmeContent) || hasChineseInCode) {
                return repo;
            }

            return null; // This repo does not contain Chinese content.
        })
    );

    const filteredRepos: SearchGithubRepo[] = [];
    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
            filteredRepos.push(result.value);
        } else if (result.status === 'rejected') {
            // This can happen if the inner Promise.all rejects.
            console.warn('Error while filtering repo for Chinese content:', result.reason);
        }
    });

    return filteredRepos;
}

export const getRepoDetails = async (fullName: string, token: string | null): Promise<SearchGithubRepo> => {
    const headers: HeadersInit = { 'Accept': 'application/vnd.github.v3+json' };
    if (token) {
        headers['Authorization'] = `token ${token}`;
    }
    try {
        const response = await fetch(`https://api.github.com/repos/${fullName}`, { headers });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to fetch repo details for ${fullName}: ${response.status}`);
        }
        return await response.json() as SearchGithubRepo;
    } catch (error) {
        console.error(`Error fetching details for repo ${fullName}:`, error);
        throw error;
    }
};


// --- NPM Service ---

export const searchNpmPackages = async (params: SearchParams): Promise<{ packages: NpmPackage[], total: number }> => {
    const { query, limit, startDate, endDate, sort } = params;
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    // NPM API limit is 250
    // For sorting, fetch more results to get a better sample for sorting
    const baseFetchSize = Math.min(limit, 250);
    const fetchSize = sort && sort !== '' ? Math.min(baseFetchSize * 3, 250) : baseFetchSize;

    const queryParams = new URLSearchParams({
        text: trimmedQuery,
        size: Math.round(fetchSize).toString(),
    });

    try {
        const response = await fetch(`${NPM_API_BASE_URL}/-/v1/search?${queryParams}`);
        if (!response.ok) {
            let errorMessage = `NPM Registry API error: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage += ` - ${errorData.error}`;
                }
            } catch {
                // Ignore JSON parsing errors for error response
            }
            throw new Error(errorMessage);
        }
        const data = await response.json();
        const packages = data.objects.map((item: any) => {
            // Ensure we have a valid date, fallback to current date if needed
            const packageDate = item.package.date || new Date().toISOString();

            return {
                name: item.package.name,
                version: item.package.version,
                description: item.package.description,
                publisher: item.package.publisher,
                date: packageDate, // This is the package publication date
                license: item.package.license,
                homepage: item.package.links?.homepage,
                repository: item.package.links?.repository,
                keywords: item.package.keywords || [],
                downloads: item.downloads,
                dependents: item.dependents,
                updated: packageDate, // Use package.date as the updated time (most accurate)
                score: item.score,
            };
        }) as NpmPackage[];

        // Enrich packages with additional details (unpackedSize, fileCount)
        // If sorting, enrich more packages to get accurate data for sorting
        let enrichCount = Math.min(10, packages.length); // Default enrichment

        if (sort === 'package-size') {
            // For size sorting, enrich all fetched packages to get accurate size data
            enrichCount = packages.length;
        } else if (sort === 'newest-updated') {
            // For date sorting, we already have date info, so standard enrichment is fine
            enrichCount = Math.min(20, packages.length);
        }

        const enrichedPackages = await Promise.all(
            packages.slice(0, enrichCount).map(async (pkg) => {
                try {
                    return await enrichNpmPackageWithDetails(pkg);
                } catch (error) {
                    console.warn(`Failed to enrich package ${pkg.name}:`, error);
                    return pkg;
                }
            })
        );

        // Combine enriched and remaining packages
        let allPackages = [
            ...enrichedPackages,
            ...packages.slice(enrichedPackages.length)
        ];

        // Apply date filtering if specified
        if (startDate || endDate) {
            allPackages = allPackages.filter(pkg => {
                const pkgDate = new Date(pkg.updated || pkg.date);
                if (startDate && pkgDate < new Date(startDate)) return false;
                if (endDate && pkgDate > new Date(endDate)) return false;
                return true;
            });
        }

        // Apply sorting if specified
        if (sort && sort !== '') {
            allPackages = sortNpmPackages(allPackages, sort);
        }

        // Limit results to the originally requested amount after sorting
        const finalPackages = allPackages.slice(0, limit);

        return {
            packages: finalPackages,
            total: data.total || allPackages.length
        };
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Failed to search NPM packages:', error);
            throw new Error(`Failed to search NPM packages: ${error.message}`);
        }
        throw new Error('An unexpected error occurred while searching NPM.');
    }
};

/**
 * Enhanced NPM search using multiple strategies for comprehensive results
 * Use this when you need access to more packages with proper sorting
 */
export const searchNpmPackagesWithScraper = async (params: SearchParams): Promise<{ packages: NpmPackage[], total: number }> => {
    try {
        console.log('Using enhanced NPM search for comprehensive results');

        const result = await searchNpmPackagesEnhanced(params);

        return {
            packages: result.packages,
            total: result.total
        };

    } catch (error) {
        console.warn('Enhanced search failed, falling back to standard API:', error);
        // Fallback to regular API search
        return await searchNpmPackages(params);
    }
};

const sortNpmPackages = (packages: NpmPackage[], sortOption: string): NpmPackage[] => {
    const sortedPackages = [...packages];

    switch (sortOption) {
        case 'newest-updated':
            return sortedPackages.sort((a, b) => {
                const dateA = new Date(a.updated || a.date).getTime();
                const dateB = new Date(b.updated || b.date).getTime();
                return dateB - dateA; // Newest first
            });

        case 'package-size':
            return sortedPackages.sort((a, b) => {
                const sizeA = a.unpackedSize || 0;
                const sizeB = b.unpackedSize || 0;
                return sizeB - sizeA; // Biggest first
            });

        default:
            return sortedPackages; // Return original order (best match from NPM API)
    }
};

export const enrichNpmPackageWithDetails = async (pkg: NpmPackage): Promise<NpmPackage> => {
    try {
        const response = await fetch(`${NPM_API_BASE_URL}/${pkg.name}/latest`);
        if (!response.ok) return pkg; // Return original package if details fetch fails

        const data = await response.json();

        // Try to get a more accurate timestamp from the package metadata
        // The package.date from search API is usually the most accurate
        let updatedTime = pkg.updated || pkg.date;

        // If we have version-specific data, use that
        if (data._id && data._id.includes('@')) {
            // This is version-specific data, so the date should be accurate
            updatedTime = pkg.date; // Use the original publication date
        }

        return {
            ...pkg,
            unpackedSize: data.dist?.unpackedSize || 0,
            fileCount: data.dist?.fileCount || 0,
            dependencies: data.dependencies,
            license: pkg.license || data.license,
            homepage: pkg.homepage || data.homepage,
            updated: updatedTime, // Keep the most accurate timestamp
        };
    } catch (error) {
        console.warn(`Failed to fetch details for ${pkg.name}:`, error);
        return pkg; // Return original package on error
    }
};

export const getNpmPackageDetails = async (packageName: string): Promise<NpmPackageDetail> => {
    try {
        const response = await fetch(`${NPM_API_BASE_URL}/${packageName}/latest`);
        if (!response.ok) throw new Error(`NPM package not found: ${response.status}`);
        const data = await response.json();
        return {
            name: data.name,
            version: data.version,
            description: data.description || 'No description available',
            publisher: {
                username: data.maintainers?.[0]?.name || data.author?.name || 'Unknown',
                email: data.maintainers?.[0]?.email || data.author?.email || 'Unknown'
            },
            date: data.time?.modified || data.time?.created || new Date().toISOString(),
            license: data.license || 'Unknown',
            unpackedSize: data.dist?.unpackedSize || 0,
            fileCount: data.dist?.fileCount || 0,
            homepage: data.homepage || '',
            dependencies: data.dependencies || {},
        };
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Failed to get NPM package details:', error);
            throw new Error(`Failed to get NPM package details: ${error.message}`);
        }
        throw new Error('An unexpected error occurred while fetching NPM package details.');
    }
};

export const getNpmFileTree = async(packageName: string, version: string): Promise<FileNode[]> => {
    try {
        const response = await fetch(`${JSDELIVR_API_BASE_URL}/${packageName}@${version}`);
        if(!response.ok) throw new Error(`Could not fetch file tree from jsDelivr: ${response.status}`);
        const data = await response.json();
        return data.files as FileNode[];
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Failed to get NPM file tree:', error);
            throw new Error(`Failed to get NPM file tree: ${error.message}`);
        }
        throw new Error('An unexpected error occurred while fetching NPM file tree.');
    }
}

export const getNpmDependencyTree = async (packageName: string): Promise<Record<string, FileNode[]>> => {
    try {
        // Get package metadata to find dependencies
        const packageMeta = await fetch(`${NPM_API_BASE_URL}/${packageName}/latest`);
        if (!packageMeta.ok) throw new Error(`Package not found: ${packageMeta.status}`);

        const data = await packageMeta.json();
        const dependencies = data.dependencies || {};
        const dependencyNames = Object.keys(dependencies);

        if (dependencyNames.length === 0) {
            return {};
        }

        // Fetch file trees for each dependency (limit to first 5 to avoid too many requests)
        const dependencyTrees: Record<string, FileNode[]> = {};
        const limitedDeps = dependencyNames.slice(0, 5);

        await Promise.all(
            limitedDeps.map(async (depName) => {
                try {
                    // Get the latest version first
                    const packageResponse = await fetch(`${JSDELIVR_API_BASE_URL}/${depName}`);
                    if (packageResponse.ok) {
                        const packageData = await packageResponse.json();
                        const latestVersion = packageData.tags?.latest;
                        if (latestVersion) {
                            const treeResponse = await fetch(`${JSDELIVR_API_BASE_URL}/${depName}@${latestVersion}`);
                            if (treeResponse.ok) {
                                const treeData = await treeResponse.json();
                                dependencyTrees[depName] = treeData.files || [];
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to fetch tree for dependency ${depName}:`, error);
                    dependencyTrees[depName] = [];
                }
            })
        );

        return dependencyTrees;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Failed to get NPM dependency tree:', error);
            throw new Error(`Failed to get NPM dependency tree: ${error.message}`);
        }
        throw new Error('An unexpected error occurred while fetching NPM dependency tree.');
    }
}