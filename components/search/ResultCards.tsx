
import React from 'react';
import { SearchGithubRepo, SearchGithubCodeItem, SearchGithubUser, NpmPackage, GroupedCodeResult } from '../../types';
import { StarIcon } from '../shared/icons/StarIcon';
import { RepoForkedIcon } from '../shared/icons/RepoForkedIcon';
import { IssueOpenedIcon } from '../shared/icons/IssueOpenedIcon';
import { CodeIcon } from '../shared/icons/CodeIcon';
import { UserGroupIcon } from '../shared/icons/UserGroupIcon';
import { CubeIcon } from '../shared/icons/CubeIcon';
import {
    QualityScoreIcon,
    PopularityIcon,
    MaintenanceIcon,
    DownloadIcon,
    LicenseIcon,
    DependentsIcon,
    PackageSizeIcon
} from '../shared/icons/PackageStatusIcons';

// Utility functions for formatting
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatNumber = (num: string | number): string => {
    const n = typeof num === 'string' ? parseInt(num) : num;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
};

const timeAgo = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Handle future dates or invalid calculations
    if (seconds < 0) return 'Recently';

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

const languageColor = (language: string | null) => {
    switch (language) {
      case 'TypeScript': return 'bg-blue-500';
      case 'JavaScript': return 'bg-yellow-500';
      case 'Python': return 'bg-green-500';
      case 'Java': return 'bg-red-500';
      case 'HTML': return 'bg-orange-500';
      case 'CSS': return 'bg-purple-500';
      case 'Go': return 'bg-cyan-500';
      case 'Rust': return 'bg-amber-700';
      default: return 'bg-gray-500';
    }
};

export const RepoCard: React.FC<{repo: SearchGithubRepo}> = ({ repo }) => (
    <div className="bg-secondary border border-border-color rounded-lg p-4 flex flex-col h-full hover:border-accent transition-colors duration-200">
        <div className="flex-grow">
            <div className="flex items-start gap-3">
                <img src={repo.owner.avatar_url} alt={repo.owner.login} className="w-8 h-8 rounded-full" />
                <div className="min-w-0">
                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-accent font-semibold hover:underline truncate block" title={repo.full_name}>
                        {repo.full_name}
                    </a>
                </div>
            </div>
            <p className="text-sm text-text-secondary mt-2 text-ellipsis overflow-hidden h-10">{repo.description}</p>
        </div>
        <div className="mt-4 pt-3 border-t border-border-color/50 flex items-center justify-between text-xs text-text-secondary">
            <div className="flex items-center space-x-3">
                <span className="flex items-center" title={`${repo.stargazers_count} stars`}><StarIcon className="w-4 h-4 mr-1 text-yellow-400" />{formatNumber(repo.stargazers_count)}</span>
                <span className="flex items-center" title={`${repo.forks_count} forks`}><RepoForkedIcon className="w-4 h-4 mr-1" />{formatNumber(repo.forks_count)}</span>
            </div>
            {repo.language && (
                <div className="flex items-center">
                    <span className={`w-2.5 h-2.5 rounded-full ${languageColor(repo.language)}`}></span>
                    <span className="ml-1.5">{repo.language}</span>
                </div>
            )}
        </div>
        <div className="text-xs text-text-secondary mt-2">Updated {timeAgo(repo.updated_at)}</div>
    </div>
);

const HighlightedText: React.FC<{ text: string; indices: [number, number][] }> = ({ text, indices }) => {
    if (!indices || indices.length === 0) {
      return <>{text}</>;
    }
  
    const sortedIndices = [...indices].sort((a, b) => a[0] - b[0]);
  
    let lastIndex = 0;
    const parts: (string | JSX.Element)[] = [];
  
    sortedIndices.forEach(([start, end], i) => {
      // Add the text before the highlight
      if (start > lastIndex) {
        parts.push(text.substring(lastIndex, start));
      }
      // Add the highlighted text
      parts.push(
        <mark key={i} className="bg-accent/30 text-accent font-bold rounded px-0.5 mx-px py-px">
          {text.substring(start, end)}
        </mark>
      );
      lastIndex = end;
    });
  
    // Add the remaining text after the last highlight
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
  
    return <>{parts}</>;
};

export const CodeResultGroupCard: React.FC<{group: GroupedCodeResult}> = ({ group }) => {
  const { repository, files, total_matches } = group;

  return (
    <div className="bg-secondary border border-border-color rounded-lg">
      <header className="p-3 border-b border-border-color flex justify-between items-center bg-tertiary/50">
        <div className="flex items-center gap-3 min-w-0">
            <img src={repository.owner.avatar_url} alt={repository.owner.login} className="w-6 h-6 rounded-full shrink-0" />
            <a href={repository.html_url} target="_blank" rel="noopener noreferrer" className="text-accent font-semibold hover:underline truncate" title={repository.full_name}>
                {repository.full_name}
            </a>
        </div>
        <div className="text-sm text-text-secondary shrink-0 ml-4">
            {total_matches} {total_matches > 1 ? 'matches' : 'match'} in {files.length} {files.length > 1 ? 'files' : 'file'}
        </div>
      </header>
      <div className="p-4 space-y-4">
        {files.map(file => (
          <div key={file.html_url}>
            <a href={file.html_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-text-primary hover:underline hover:text-accent truncate block" title={file.path}>
                {file.path}
            </a>
            <div className="mt-2 pl-4 border-l-2 border-border-color space-y-2 font-mono">
                {file.text_matches?.map((match, index) => (
                    <div key={index} className="text-xs bg-primary p-2 rounded-md overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-words"><code>
                           <HighlightedText text={match.fragment} indices={match.matches.map(m => m.indices)} />
                        </code></pre>
                    </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


export const CodeCard: React.FC<{item: SearchGithubCodeItem}> = ({ item }) => (
    <a href={item.html_url} target="_blank" rel="noopener noreferrer" className="block bg-secondary border border-border-color rounded-lg p-4 hover:border-accent transition-colors duration-200">
        <div className="font-mono text-sm text-accent truncate" title={item.path}>{item.path}</div>
        <div className="text-xs text-text-secondary mt-1 flex items-center gap-2">
            <CodeIcon className="w-4 h-4" />
            <span title={item.repository.full_name}>{item.repository.full_name}</span>
        </div>
    </a>
);

export const UserCard: React.FC<{user: SearchGithubUser}> = ({ user }) => (
    <a href={user.html_url} target="_blank" rel="noopener noreferrer" className="block bg-secondary border border-border-color rounded-lg p-4 text-center hover:border-accent transition-colors duration-200">
        <img src={user.avatar_url} alt={user.login} className="w-20 h-20 rounded-full mx-auto" />
        <h4 className="mt-3 font-semibold text-text-primary">{user.login}</h4>
    </a>
);


export const NpmPackageCard: React.FC<{pkg: NpmPackage; onSelect: () => void;}> = ({ pkg, onSelect }) => {
    // Helper functions to safely get values and avoid N/A
    const getDownloadCount = () => pkg.downloads?.weekly || 0;
    const getDependentsCount = () => parseInt(pkg.dependents || '0');
    const getQualityScore = () => pkg.score?.detail?.quality || 0;
    const getPopularityScore = () => pkg.score?.detail?.popularity || 0;
    const getMaintenanceScore = () => pkg.score?.detail?.maintenance || 0;
    const getPackageSize = () => pkg.unpackedSize || 0;
    const getFileCount = () => pkg.fileCount || 0;
    const getLicense = () => pkg.license || '';

    return (
        <button
            type="button"
            onClick={onSelect}
            className="bg-secondary border border-border-color rounded-lg p-3 flex flex-col justify-between hover:border-danger transition-all duration-300 h-full shadow-lg text-left w-full"
            style={{
                background: 'radial-gradient(circle at 20% 20%, rgba(248, 81, 73, 0.15), rgb(22, 27, 34) 80%)',
                borderColor: 'rgb(248, 81, 73)'
            }}
        >
            {/* Header with package name and colored status indicators */}
            <div>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2 group min-w-0 pr-2">
                        <CubeIcon className="w-5 h-5 text-danger shrink-0" />
                        <h3 className="font-semibold text-sm text-danger group-hover:underline truncate" title={pkg.name}>
                            {pkg.name}
                        </h3>
                    </div>
                    {/* Quality indicators in top right */}
                    <div className="flex items-center space-x-1 shrink-0">
                        <QualityScoreIcon score={getQualityScore()} className="w-3 h-3" />
                        <PopularityIcon score={getPopularityScore()} className="w-3 h-3" />
                        <MaintenanceIcon score={getMaintenanceScore()} className="w-3 h-3" />
                    </div>
                </div>

                <p className="text-xs text-text-secondary mb-2 break-words h-8 overflow-hidden">
                    {pkg.description || 'No description available'}
                </p>

                {/* Colored status row */}
                <div className="flex items-center justify-between mb-2 text-xs">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1" title={`${formatNumber(getDownloadCount())} weekly downloads`}>
                            <DownloadIcon count={getDownloadCount()} className="w-3 h-3" />
                            <span className="text-text-secondary">{formatNumber(getDownloadCount())}</span>
                        </div>
                        <div className="flex items-center space-x-1" title={`${getDependentsCount()} dependents`}>
                            <DependentsIcon count={getDependentsCount()} className="w-3 h-3" />
                            <span className="text-text-secondary">{formatNumber(getDependentsCount())}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">
                        <LicenseIcon license={getLicense()} className="w-3 h-3" />
                        <span className="text-text-secondary text-xs">{getLicense() || 'Unknown'}</span>
                    </div>
                </div>
            </div>

            {/* Bottom section with package details */}
            <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                        <PackageSizeIcon size={getPackageSize()} className="w-3 h-3" />
                        <span className="text-text-secondary">
                            {getPackageSize() > 0 ? formatBytes(getPackageSize()) : 'Unknown size'}
                        </span>
                    </div>
                    <span className="text-text-secondary">
                        {getFileCount() > 0 ? `${getFileCount()} files` : 'Unknown files'}
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-text-secondary">v{pkg.version}</span>
                    <span className="text-text-secondary">{timeAgo(pkg.updated || pkg.date)}</span>
                </div>
            </div>
        </button>
    );
};