import React, { useState, useCallback } from 'react';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import SettingsModal from '../projects/SettingsModal';
import NpmDetailModal from './NpmDetailModal';
import { searchGithub, searchNpmPackages, getRepoDetails } from '../../services/searchService';
import { SearchParams, SearchResult, SearchProvider, SearchType, NpmPackage, SearchGithubCodeItem, GroupedCodeResult, SearchGithubRepo } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';

interface SearchViewProps {
    githubToken: string;
    setGithubToken: (token: string) => void;
}

const SearchView: React.FC<SearchViewProps> = ({ githubToken, setGithubToken }) => {
    const [results, setResults] = useState<(SearchResult | GroupedCodeResult)[]>([]);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [activeSearchType, setActiveSearchType] = useState<SearchType>('repositories');
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const [currentSort, setCurrentSort] = useState<string>('');

    const [selectedPackage, setSelectedPackage] = useState<NpmPackage | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [provider, setProvider] = useState<SearchProvider>('github');
    const [useEnhancedScraper, setUseEnhancedScraper] = useState(false);

    const handleSearch = useCallback(async (params: Omit<SearchParams, 'provider' | 'githubToken'>) => {
        setLoadingMessage('Initializing search...');
        setError(null);
        setResults([]);
        setHasSearched(true);
        setActiveSearchType(params.searchType);
        setCurrentSort(params.sort);

        const fullParams: SearchParams = { ...params, provider, githubToken };

        try {
            let searchResults: SearchResult[];
            if (provider === 'github') {
                const onProgress = (foundCount: number, scannedCount: number) => {
                    if (fullParams.isChineseFilter && fullParams.searchType === 'trending') {
                        setLoadingMessage(`Scanning for Chinese content... Found ${foundCount} / Scanned ${scannedCount}`);
                    } else {
                        setLoadingMessage(`Fetching results... ${foundCount} / ${fullParams.limit}`);
                    }
                };
                searchResults = await searchGithub(fullParams, onProgress);

                if (params.searchType === 'code') {
                    setLoadingMessage('Grouping results...');
                    await new Promise(resolve => setTimeout(resolve, 0)); // Allow UI to update

                    const codeItems = searchResults as SearchGithubCodeItem[];
                    const grouped = codeItems.reduce((acc, item) => {
                        const repoName = item.repository.full_name;
                        if (!acc[repoName]) {
                            acc[repoName] = { repository: item.repository, files: [], total_matches: 0 };
                        }
                        acc[repoName].files.push(item);
                        acc[repoName].total_matches += item.text_matches?.length || 0;
                        return acc;
                    }, {} as Record<string, GroupedCodeResult>);
                    
                    let finalGroupedResults = Object.values(grouped);

                    if (params.sort === 'repo-size') {
                        setLoadingMessage(`Fetching repository sizes for ${finalGroupedResults.length} repos...`);
                        const repoDetailsMap = new Map<string, SearchGithubRepo>();
                        await Promise.all(finalGroupedResults.map(async (group) => {
                            try {
                                const details = await getRepoDetails(group.repository.full_name, githubToken);
                                repoDetailsMap.set(group.repository.full_name, details);
                            } catch (e) {
                                console.warn(`Could not fetch details for ${group.repository.full_name}`, e);
                            }
                        }));
                        
                        finalGroupedResults.forEach(group => {
                            const details = repoDetailsMap.get(group.repository.full_name);
                            if (details) {
                                group.repository.size = details.size;
                            }
                        });
                        finalGroupedResults.sort((a, b) => (b.repository.size || 0) - (a.repository.size || 0));
                    } else {
                        // Default sort: by total matches
                        finalGroupedResults.sort((a, b) => b.total_matches - a.total_matches);
                    }
                    
                    setResults(finalGroupedResults);
                } else {
                    setResults(searchResults);
                }

            } else { // npm
                if (useEnhancedScraper) {
                    setLoadingMessage('Using enhanced scraper for comprehensive results...');
                    try {
                        const { searchNpmPackagesWithScraper } = await import('../../services/searchService');
                        const npmResults = await searchNpmPackagesWithScraper(fullParams);
                        setResults(npmResults.packages);
                        setTotalCount(npmResults.total);
                    } catch (error) {
                        console.warn('Enhanced scraper failed, falling back to API:', error);
                        setLoadingMessage('Enhanced scraper unavailable, using API...');
                        const npmResults = await searchNpmPackages(fullParams);
                        setResults(npmResults.packages);
                        setTotalCount(npmResults.total);
                    }
                } else {
                    if (fullParams.sort && fullParams.sort !== '' as any) {
                        setLoadingMessage(`Searching and sorting by ${fullParams.sort === 'package-size' ? 'biggest files' : 'newest updated'}...`);
                    } else {
                        setLoadingMessage('Searching...');
                    }
                    const npmResults = await searchNpmPackages(fullParams);
                    setResults(npmResults.packages);
                    setTotalCount(npmResults.total);
                }
            }
        } catch (err) {
            let errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            if (typeof errorMessage === 'string' && errorMessage.includes('API rate limit exceeded')) {
                errorMessage = 'GitHub API rate limit exceeded. Please add a Personal Access Token via the settings icon (⚙️) for a higher limit.';
            } else if (typeof errorMessage === 'string' && errorMessage.includes('403')) {
                errorMessage = 'GitHub API access forbidden. Please check your token permissions. ' + errorMessage;
            }
            setError(errorMessage);
            setResults([]);
        } finally {
            setLoadingMessage(null);
        }
    }, [provider, githubToken, useEnhancedScraper]);

    const renderResults = () => {
        if (loadingMessage) {
            return (
                <div className="flex flex-col items-center justify-center h-full py-20">
                    <LoadingSpinner />
                    <p className="mt-4 text-lg text-text-secondary">{loadingMessage}</p>
                </div>
            );
        }
        if (error) {
            return <div className="text-center py-20 text-danger bg-danger/10 p-4 rounded-md">{error}</div>;
        }

        return <SearchResults
            results={results}
            searchType={activeSearchType}
            hasSearched={hasSearched}
            onPackageSelect={setSelectedPackage}
            totalCount={totalCount}
            sortOption={currentSort}
        />;
    };

    return (
        <div className="flex flex-col h-full bg-primary">
            <header className="flex-shrink-0 p-6 border-b border-border-color bg-secondary">
                 <div className="flex flex-col items-center mb-4 space-y-3">
                    <div className="inline-flex rounded-md shadow-sm bg-tertiary p-1">
                        <button
                            type="button"
                            onClick={() => setProvider('github')}
                            className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${provider === 'github' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-border-color'}`}
                        >
                            GitHub
                        </button>
                        <button
                            type="button"
                            onClick={() => setProvider('npm')}
                            className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${provider === 'npm' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-border-color'}`}
                        >
                            NPM
                        </button>
                    </div>

                    {/* Enhanced Scraper Toggle for NPM */}
                    {provider === 'npm' && (
                        <div className="flex items-center space-x-2">
                            <label className="flex items-center space-x-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={useEnhancedScraper}
                                    onChange={(e) => setUseEnhancedScraper(e.target.checked)}
                                    className="rounded border-border-color text-danger focus:ring-danger"
                                />
                                <span className="text-text-secondary">Enhanced Scraper</span>
                                <span className="text-xs text-text-secondary/70 bg-tertiary px-2 py-1 rounded">
                                    Access ALL packages
                                </span>
                            </label>
                        </div>
                    )}
                </div>
                <SearchBar onSearch={handleSearch} isLoading={!!loadingMessage} provider={provider} onSettingsClick={() => setIsSettingsModalOpen(true)} />
            </header>
            <main className="flex-1 p-6 overflow-y-auto">
                {!hasSearched && (
                     <div className="flex flex-col items-center justify-center h-full text-center p-8">
                       <h2 className="text-2xl font-bold text-text-primary">Universal Code Search</h2>
                       <p className="text-text-secondary mt-2 max-w-2xl">
                           Search for repositories, code, and users on GitHub, or find packages on NPM.
                           Use the filters above to refine your search.
                       </p>
                     </div>
                )}
                {hasSearched && renderResults()}
            </main>
            {selectedPackage && (
                <NpmDetailModal
                    packageName={selectedPackage.name}
                    version={selectedPackage.version}
                    onClose={() => setSelectedPackage(null)}
                />
            )}
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                onSave={(token) => { setGithubToken(token); setIsSettingsModalOpen(false); }}
                currentToken={githubToken}
            />
        </div>
    );
};

export default SearchView;
