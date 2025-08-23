/**
 * Enhanced NPM Search Service - Browser Compatible
 * Provides comprehensive NPM package search with better sorting and more data
 * Uses multiple API endpoints and strategies to overcome limitations
 */

import { NpmPackage, SearchParams } from '../types';

interface EnhancedSearchOptions {
    query: string;
    limit?: number;
    sort?: string;
    includeUnpopular?: boolean;
}

interface NpmRegistryPackage {
    name: string;
    version: string;
    description?: string;
    keywords?: string[];
    author?: { name?: string; email?: string } | string;
    license?: string;
    homepage?: string;
    repository?: { url?: string } | string;
    dist?: {
        unpackedSize?: number;
        fileCount?: number;
    };
    time?: {
        created?: string;
        modified?: string;
        [version: string]: string | undefined;
    };
    dependencies?: Record<string, string>;
    maintainers?: Array<{ name?: string; email?: string }>;
}

class EnhancedNpmSearch {
    private readonly NPM_SEARCH_API = 'https://registry.npmjs.org/-/v1/search';
    private readonly NPM_REGISTRY_API = 'https://registry.npmjs.org';
    private readonly JSDELIVR_API = 'https://data.jsdelivr.com/v1/packages/npm';
    
    /**
     * Enhanced search that combines multiple strategies for better results
     */
    async searchPackages(options: EnhancedSearchOptions): Promise<{ packages: NpmPackage[], total: number }> {
        const { query, limit = 100, sort, includeUnpopular = false } = options;
        
        console.log(`🔍 Enhanced NPM search for "${query}" with sort: ${sort}`);
        
        try {
            // Strategy 1: Get more results by using multiple search approaches
            const allPackages = await this.getComprehensiveResults(query, limit, includeUnpopular);
            
            // Strategy 2: Enrich packages with detailed information
            const enrichedPackages = await this.enrichPackagesInBatches(allPackages, sort);
            
            // Strategy 3: Apply proper sorting
            const sortedPackages = this.sortPackages(enrichedPackages, sort);
            
            // Strategy 4: Return requested amount
            const finalPackages = sortedPackages.slice(0, limit);
            
            console.log(`✅ Enhanced search completed: ${finalPackages.length} packages`);
            
            return {
                packages: finalPackages,
                total: allPackages.length
            };
            
        } catch (error) {
            console.error('Enhanced search failed:', error);
            throw error;
        }
    }
    
    /**
     * Get comprehensive results using multiple search strategies
     */
    private async getComprehensiveResults(query: string, limit: number, includeUnpopular: boolean): Promise<NpmPackage[]> {
        const allPackages: NpmPackage[] = [];
        const seenPackages = new Set<string>();
        
        // Strategy 1: Standard search with larger size
        const standardResults = await this.searchStandard(query, Math.min(250, limit * 2));
        for (const pkg of standardResults) {
            if (!seenPackages.has(pkg.name)) {
                allPackages.push(pkg);
                seenPackages.add(pkg.name);
            }
        }
        
        // Strategy 2: Search with different text variations if we need more results
        if (allPackages.length < limit && query.length > 3) {
            const variations = this.generateSearchVariations(query);
            
            for (const variation of variations) {
                if (allPackages.length >= limit * 2) break;
                
                try {
                    const variationResults = await this.searchStandard(variation, 50);
                    for (const pkg of variationResults) {
                        if (!seenPackages.has(pkg.name)) {
                            allPackages.push(pkg);
                            seenPackages.add(pkg.name);
                        }
                    }
                } catch (error) {
                    console.warn(`Search variation "${variation}" failed:`, error);
                }
                
                // Small delay between requests
                await this.delay(100);
            }
        }
        
        console.log(`📦 Collected ${allPackages.length} unique packages`);
        return allPackages;
    }
    
    /**
     * Generate search variations to find more packages
     */
    private generateSearchVariations(query: string): string[] {
        const variations: string[] = [];
        
        // Add partial matches
        if (query.length > 4) {
            variations.push(query.substring(0, query.length - 1));
        }
        
        // Add common prefixes/suffixes
        const commonPrefixes = ['@types/', 'node-', 'js-', 'ts-'];
        const commonSuffixes = ['-js', '-ts', '-node', '-lib', '-utils', '-core'];
        
        for (const prefix of commonPrefixes) {
            if (!query.startsWith(prefix)) {
                variations.push(prefix + query);
            }
        }
        
        for (const suffix of commonSuffixes) {
            if (!query.endsWith(suffix)) {
                variations.push(query + suffix);
            }
        }
        
        return variations.slice(0, 3); // Limit variations to avoid too many requests
    }
    
    /**
     * Standard NPM search
     */
    private async searchStandard(query: string, size: number): Promise<NpmPackage[]> {
        const url = `${this.NPM_SEARCH_API}?text=${encodeURIComponent(query)}&size=${size}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`NPM search failed: ${response.status}`);
        }
        
        const data = await response.json();
        return data.objects.map((item: any) => this.transformSearchResult(item));
    }
    
    /**
     * Transform NPM search result to our format
     */
    private transformSearchResult(item: any): NpmPackage {
        const pkg = item.package;
        const packageDate = pkg.date || new Date().toISOString();
        
        return {
            name: pkg.name,
            version: pkg.version,
            description: pkg.description || '',
            publisher: {
                username: pkg.publisher?.username || 'unknown',
                email: pkg.publisher?.email || ''
            },
            date: packageDate,
            license: pkg.license || '',
            homepage: pkg.links?.homepage || '',
            repository: pkg.links?.repository || '',
            keywords: pkg.keywords || [],
            downloads: item.downloads || { weekly: 0, monthly: 0 },
            dependents: item.dependents || '0',
            updated: packageDate,
            score: item.score || { detail: { quality: 0, popularity: 0, maintenance: 0 } },
            unpackedSize: 0, // Will be enriched
            fileCount: 0, // Will be enriched
            dependencies: {}
        };
    }
    
    /**
     * Enrich packages with detailed information in batches
     */
    private async enrichPackagesInBatches(packages: NpmPackage[], sort?: string): Promise<NpmPackage[]> {
        // For size sorting, we need to enrich more packages to get accurate size data
        const enrichCount = sort === 'package-size' ? Math.min(packages.length, 100) : Math.min(packages.length, 20);
        
        console.log(`🔧 Enriching ${enrichCount} packages with detailed information...`);
        
        const batchSize = 10; // Process in batches to avoid overwhelming the API
        const enrichedPackages: NpmPackage[] = [];
        
        for (let i = 0; i < enrichCount; i += batchSize) {
            const batch = packages.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (pkg) => {
                try {
                    return await this.enrichPackage(pkg);
                } catch (error) {
                    console.warn(`Failed to enrich ${pkg.name}:`, error);
                    return pkg; // Return original package if enrichment fails
                }
            });
            
            const enrichedBatch = await Promise.all(batchPromises);
            enrichedPackages.push(...enrichedBatch);
            
            // Small delay between batches
            if (i + batchSize < enrichCount) {
                await this.delay(200);
            }
        }
        
        // Add remaining packages without enrichment
        enrichedPackages.push(...packages.slice(enrichCount));
        
        console.log(`✅ Enriched ${enrichCount} packages`);
        return enrichedPackages;
    }
    
    /**
     * Enrich a single package with detailed information
     */
    private async enrichPackage(pkg: NpmPackage): Promise<NpmPackage> {
        try {
            // Get package details from NPM registry
            const registryUrl = `${this.NPM_REGISTRY_API}/${encodeURIComponent(pkg.name)}/latest`;
            const response = await fetch(registryUrl);
            
            if (!response.ok) {
                return pkg; // Return original if registry call fails
            }
            
            const data: NpmRegistryPackage = await response.json();
            
            // Try to get size information from jsDelivr
            let sizeInfo = { unpackedSize: 0, fileCount: 0 };
            try {
                const jsdelivrUrl = `${this.JSDELIVR_API}/${encodeURIComponent(pkg.name)}@${data.version}`;
                const jsdelivrResponse = await fetch(jsdelivrUrl);
                if (jsdelivrResponse.ok) {
                    const jsdelivrData = await jsdelivrResponse.json();
                    if (jsdelivrData.files) {
                        sizeInfo.fileCount = jsdelivrData.files.length;
                        // Estimate size from file count (rough approximation)
                        sizeInfo.unpackedSize = jsdelivrData.files.length * 1000; // 1KB per file average
                    }
                }
            } catch (error) {
                // jsDelivr failed, use registry data if available
                if (data.dist) {
                    sizeInfo.unpackedSize = data.dist.unpackedSize || 0;
                    sizeInfo.fileCount = data.dist.fileCount || 0;
                }
            }
            
            return {
                ...pkg,
                description: data.description || pkg.description,
                license: data.license || pkg.license,
                homepage: data.homepage || pkg.homepage,
                repository: typeof data.repository === 'string' ? data.repository : data.repository?.url || pkg.repository,
                keywords: data.keywords || pkg.keywords,
                dependencies: data.dependencies || {},
                unpackedSize: sizeInfo.unpackedSize,
                fileCount: sizeInfo.fileCount,
                updated: data.time?.modified || data.time?.created || pkg.updated
            };
            
        } catch (error) {
            console.warn(`Enrichment failed for ${pkg.name}:`, error);
            return pkg;
        }
    }
    
    /**
     * Sort packages by specified criteria
     */
    private sortPackages(packages: NpmPackage[], sort?: string): NpmPackage[] {
        if (!sort || sort === '') {
            return packages; // Keep original order (relevance)
        }
        
        const sortedPackages = [...packages];
        
        switch (sort) {
            case 'package-size':
                return sortedPackages.sort((a, b) => (b.unpackedSize || 0) - (a.unpackedSize || 0));
                
            case 'newest-updated':
                return sortedPackages.sort((a, b) => {
                    const dateA = new Date(a.updated || a.date).getTime();
                    const dateB = new Date(b.updated || b.date).getTime();
                    return dateB - dateA;
                });
                
            default:
                return sortedPackages;
        }
    }
    
    /**
     * Utility function to add delays between requests
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const enhancedNpmSearch = new EnhancedNpmSearch();

/**
 * Enhanced NPM search function that can be used as a drop-in replacement
 */
export async function searchNpmPackagesEnhanced(params: SearchParams): Promise<{ packages: NpmPackage[], total: number }> {
    const options: EnhancedSearchOptions = {
        query: params.query.trim(),
        limit: params.limit || 100,
        sort: params.sort,
        includeUnpopular: true
    };
    
    return await enhancedNpmSearch.searchPackages(options);
}
