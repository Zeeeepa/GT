
import React, { useState, useEffect } from 'react';
import type { SearchParams, SearchProvider, SearchType, SortOption, GithubSearchType, TrendingDateRange } from '../../types';
import { CogIcon } from '../shared/icons/CogIcon';
import { SearchIcon } from '../shared/icons/SearchIcon';
import LoadingSpinner from '../shared/LoadingSpinner';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface SearchBarProps {
  onSearch: (params: Omit<SearchParams, 'provider' | 'githubToken'>) => void;
  isLoading: boolean;
  provider: SearchProvider;
  onSettingsClick: () => void;
  useEnhancedScraper?: boolean;
  setUseEnhancedScraper?: (enabled: boolean) => void;
}

const GITHUB_SORT_OPTIONS: Record<GithubSearchType, { value: SortOption, label: string }[]> = {
    repositories: [
        { value: 'stars', label: 'Stars' },
        { value: 'forks', label: 'Forks' },
        { value: 'updated', label: 'Recently Updated' },
    ],
    trending: [
        { value: 'stars', label: 'Stars (This Week)'},
    ],
    code: [
        { value: '', label: 'Best Match' },
        { value: 'indexed', label: 'Recently Indexed' },
        { value: 'repo-size', label: 'Largest Codebases' },
    ],
    users: [
        { value: '', label: 'Best Match' },
        { value: 'followers', label: 'Followers' },
        { value: 'repositories', label: 'Repositories' },
        { value: 'joined', label: 'Recently Joined' },
    ],
};

const NPM_SORT_OPTIONS: { value: SortOption, label: string }[] = [
    { value: '', label: 'Best Match' },
    { value: 'newest-updated', label: 'Newest Updated' },
    { value: 'package-size', label: 'Biggest Files' },
];

const GITHUB_SEARCH_TYPES: {label: string, value: GithubSearchType}[] = [
    { label: 'Repositories', value: 'repositories'},
    { label: 'Trending', value: 'trending'},
    { label: 'Code', value: 'code'},
    { label: 'Users', value: 'users'},
];

const SearchTypeButton: React.FC<{label: string; isActive: boolean; onClick: () => void}> = ({ label, isActive, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
            isActive
                ? 'bg-accent/20 text-accent shadow'
                : 'text-text-secondary hover:bg-tertiary'
        }`}
    >
        {label}
    </button>
);


export const SearchBar: React.FC<SearchBarProps> = ({
    onSearch,
    isLoading,
    provider,
    onSettingsClick,
    useEnhancedScraper = false,
    setUseEnhancedScraper
}) => {
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(200);
  const [searchType, setSearchType] = useState<SearchType>('repositories');
  const [sort, setSort] = useState<SortOption>('stars');
  const [trendingDateRange, setTrendingDateRange] = useState<TrendingDateRange>('week');
  const [language, setLanguage] = useState('');
  const [isChineseFilter, setIsChineseFilter] = useState(false);
  const [repoSearchHistory, setRepoSearchHistory] = useLocalStorage<string[]>('repoSearchHistory', []);

  useEffect(() => {
    if (provider === 'github') {
        setSearchType('repositories');
        setSort('stars');
        setQuery('');
        setLanguage('');
        setTrendingDateRange('week');
        setIsChineseFilter(false);
    } else {
        setSearchType('packages');
        setSort('');
        setQuery('');
        setLanguage('');
    }
  }, [provider]);

  const handleSearchTypeChange = (type: GithubSearchType) => {
      setSearchType(type);
      setSort(GITHUB_SORT_OPTIONS[type][0].value);
      setLanguage('');
      setTrendingDateRange('week');
      setIsChineseFilter(false);
  };

  const doSearch = (searchQuery: string) => {
      if (isLoading) return;
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery || searchType === 'trending') {
          const params = { query: trimmedQuery, startDate, endDate, limit, sort, searchType, trendingDateRange, language, isChineseFilter };
          onSearch(params);
          
          if (provider === 'github' && (searchType === 'repositories' || searchType === 'trending') && trimmedQuery) {
            setRepoSearchHistory(prev => {
              const newHistory = [trimmedQuery, ...prev.filter(q => q.toLowerCase() !== trimmedQuery.toLowerCase())];
              return newHistory.slice(0, 5); // Keep last 5
            });
          }
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };
  
  const handleHistoryClick = (q: string) => {
    setQuery(q);
    doSearch(q);
  };

  const isGithub = provider === 'github';
  const currentSortOptions = isGithub
    ? (GITHUB_SORT_OPTIONS[searchType as GithubSearchType] || [])
    : NPM_SORT_OPTIONS;
  const showLanguageFilter = isGithub && ['repositories', 'trending', 'code'].includes(searchType);
  const showHistory = isGithub && (searchType === 'repositories' || searchType === 'trending') && repoSearchHistory.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
        {isGithub && (
            <div className="flex items-center justify-center flex-wrap gap-2 bg-primary p-1 rounded-lg">
                {GITHUB_SEARCH_TYPES.map(type => (
                    <SearchTypeButton key={type.value} label={type.label} isActive={searchType === type.value} onClick={() => handleSearchTypeChange(type.value)} />
                ))}
            </div>
        )}

      <div className="relative">
          <label htmlFor="query" className="sr-only">Search Pattern</label>
           {isGithub && searchType === 'code' ? (
                <textarea
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for code... e.g., 'import React' path:src extension:tsx"
                    rows={3}
                    className="w-full bg-primary border border-border-color rounded-lg shadow-sm px-4 py-3 text-text-primary focus:ring-2 focus:ring-accent focus:border-accent transition font-mono pr-12 resize-y"
                />
            ) : (
                <input
                    type="text" id="query" value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                        isGithub 
                            ? searchType === 'trending' ? 'Search trending repos (e.g., "ai")... or leave blank' : `Search ${searchType}...`
                            : `Search packages on NPM...`
                    }
                    className="w-full bg-primary border border-border-color rounded-lg shadow-sm px-4 py-3 text-text-primary focus:ring-2 focus:ring-accent focus:border-accent transition pr-12"
                />
            )}
          <button type="submit" disabled={isLoading} className="absolute top-3 right-4 text-text-secondary hover:text-text-primary disabled:text-gray-600 disabled:cursor-not-allowed">
            {isLoading ? <LoadingSpinner /> : <SearchIcon className="h-5 w-5" />}
          </button>
      </div>
      
      {showHistory && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-text-secondary">
          <span className="font-medium">Recent:</span>
          {repoSearchHistory.map(q => (
            <button key={q} type="button" onClick={() => handleHistoryClick(q)} className="bg-tertiary px-2 py-1 rounded-md text-text-primary hover:bg-border-color hover:text-accent transition-colors">
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        {isGithub && searchType === 'trending' ? (
             <>
                <div className="w-40">
                    <label htmlFor="trendingDateRange" className="block text-xs font-medium text-text-secondary mb-1">Trending Since</label>
                    <select id="trendingDateRange" value={trendingDateRange} onChange={(e) => setTrendingDateRange(e.target.value as TrendingDateRange)}
                        className="w-full appearance-none bg-primary border border-border-color rounded-md px-2 py-1 text-xs text-text-primary focus:ring-1 focus:ring-accent transition">
                        <option value="day">Past Day</option>
                        <option value="week">Past Week</option>
                        <option value="month">Past Month</option>
                    </select>
                </div>
                <div className="flex items-center pb-1">
                    <input
                        type="checkbox"
                        id="chinese-filter"
                        checked={isChineseFilter}
                        onChange={(e) => setIsChineseFilter(e.target.checked)}
                        className="h-4 w-4 bg-primary border-border-color rounded text-accent focus:ring-accent focus:ring-offset-secondary focus:ring-offset-2"
                    />
                    <label htmlFor="chinese-filter" className="ml-2 text-xs font-medium text-text-primary">
                        Chinese Content
                    </label>
                </div>
             </>
        ) : (
            <>
                <div>
                    <label htmlFor="startDate" className="block text-xs font-medium text-text-secondary mb-1">After</label>
                    <div className="relative">
                        <input
                            type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                            className="bg-primary border border-border-color rounded-md pl-2 pr-7 py-1 text-xs text-text-primary focus:ring-1 focus:ring-accent transition [color-scheme:dark]"
                        />
                         {startDate && (
                            <button type="button" onClick={() => setStartDate('')} className="absolute inset-y-0 right-0 flex items-center pr-1.5 text-text-secondary hover:text-text-primary" aria-label="Clear start date">
                               <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            </button>
                         )}
                    </div>
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-xs font-medium text-text-secondary mb-1">Before</label>
                    <div className="relative">
                        <input
                            type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                            className="bg-primary border border-border-color rounded-md pl-2 pr-7 py-1 text-xs text-text-primary focus:ring-1 focus:ring-accent transition [color-scheme:dark]"
                        />
                        {endDate && (
                            <button type="button" onClick={() => setEndDate('')} className="absolute inset-y-0 right-0 flex items-center pr-1.5 text-text-secondary hover:text-text-primary" aria-label="Clear end date">
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            </button>
                         )}
                    </div>
                </div>
            </>
        )}
        
        {showLanguageFilter && (
            <div className="w-40">
                <label htmlFor="language" className="block text-xs font-medium text-text-secondary mb-1">Language</label>
                <input
                    type="text" id="language" value={language} onChange={(e) => setLanguage(e.target.value)}
                    placeholder="e.g. typescript"
                    className="w-full bg-primary border border-border-color rounded-md px-2 py-1 text-xs text-text-primary focus:ring-1 focus:ring-accent transition"
                />
            </div>
        )}

        <div className="w-40">
            <label htmlFor="sort" className="block text-xs font-medium text-text-secondary mb-1">Sort By</label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as SortOption)}
                className="w-full appearance-none bg-primary border border-border-color rounded-md px-2 py-1 text-xs text-text-primary focus:ring-1 focus:ring-accent transition disabled:cursor-not-allowed disabled:opacity-50" disabled={isGithub && searchType === 'trending'}>
                {currentSortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
        <div className="flex-grow"></div>
        <div className="w-24">
            <label htmlFor="limit" className="block text-xs font-medium text-text-secondary mb-1">Results</label>
            <input
                type="number" id="limit" value={limit} min="1" max="1000" onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full bg-primary border border-border-color rounded-md px-2 py-1 text-xs text-text-primary focus:ring-1 focus:ring-accent transition"
            />
        </div>
        {isGithub && (
            <button type="button" onClick={onSettingsClick} className="p-2 bg-primary border border-border-color rounded-md text-text-secondary hover:text-text-primary hover:border-accent transition" title="GitHub Token Settings">
                <CogIcon className="w-5 h-5"/>
            </button>
        )}
      </div>
       <p className="text-xs text-text-secondary text-center !mt-2">
            {isGithub && searchType === 'trending' && 'Trending searches are sorted by stars. '}
            {isGithub && 'Language filter available for repos, code & trending searches.'}
       </p>
    </form>
  );
};