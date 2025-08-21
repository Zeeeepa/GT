
import React from 'react';
import { SearchResult, SearchType, SearchGithubRepo, SearchGithubCodeItem, SearchGithubUser, NpmPackage, GroupedCodeResult } from '../../types';
import { RepoCard, UserCard, NpmPackageCard, CodeResultGroupCard } from './ResultCards';
import { SearchIcon } from '../shared/icons/SearchIcon';

interface SearchResultsProps {
    results: (SearchResult | GroupedCodeResult)[];
    searchType: SearchType;
    hasSearched: boolean;
    onPackageSelect: (pkg: NpmPackage) => void;
    totalCount?: number | null;
    sortOption?: string;
}

const NoResults: React.FC<{title: string, message: string}> = ({ title, message }) => (
    <div className="text-center py-20">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-secondary">
            <SearchIcon className="h-8 w-8 text-text-secondary" />
        </div>
        <h3 className="mt-4 text-xl font-medium text-text-primary">{title}</h3>
        <p className="mt-1 text-md text-text-secondary">{message}</p>
    </div>
);

export const SearchResults: React.FC<SearchResultsProps> = ({ results, searchType, hasSearched, onPackageSelect, totalCount, sortOption }) => {
    if (hasSearched && results.length === 0) {
        return <NoResults title="No Results Found" message="Try adjusting your search filters or query for better results." />;
    }

    // Helper function to format large numbers
    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    if (searchType === 'repositories' || searchType === 'trending') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {(results as SearchGithubRepo[]).map((repo) => <RepoCard key={repo.id} repo={repo} />)}
            </div>
        );
    }

    if (searchType === 'code') {
        const groupedResults = results as GroupedCodeResult[];
        return (
            <div className="space-y-4 max-w-5xl mx-auto">
                 {groupedResults.map(group => (
                    <CodeResultGroupCard key={group.repository.full_name} group={group} />
                 ))}
            </div>
        );
    }
    
    if (searchType === 'users') {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {(results as SearchGithubUser[]).map((user) => <UserCard key={user.id} user={user} />)}
            </div>
        );
    }

    if (searchType === 'packages') {
        // Helper function to get sort label
        const getSortLabel = (sort: string) => {
            switch (sort) {
                case 'newest-updated': return 'Newest Updated';
                case 'package-size': return 'Biggest Files';
                default: return 'Best Match';
            }
        };

        return (
            <div className="space-y-4">
                {totalCount && (
                    <div className="flex items-center justify-between bg-secondary/50 border border-border-color rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-danger rounded-full"></div>
                            <span className="text-sm font-medium text-text-primary">
                                Found {formatNumber(totalCount)} packages
                            </span>
                            {sortOption && sortOption !== '' && (
                                <span className="text-xs text-text-secondary">
                                    • Sorted by {getSortLabel(sortOption)} (from expanded sample)
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-text-secondary">
                            Showing {results.length} results
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {(results as NpmPackage[]).map((pkg) => <NpmPackageCard key={pkg.name} pkg={pkg} onSelect={() => onPackageSelect(pkg)} />)}
                </div>
            </div>
        );
    }
    
    return null;
};