import React from 'react';
import { CodegenRepository } from '../../types';
import { GithubIcon } from '../shared/icons/GithubIcon';

interface RepositoryListItemProps {
  repo: CodegenRepository;
  onGenerateCommands: (repoId: number) => void;
  isGenerating: boolean;
}

const RepositoryListItem: React.FC<RepositoryListItemProps> = ({ repo, onGenerateCommands, isGenerating }) => {
    
    const languageColorStyle = (language: string | null) => {
        switch (language?.toLowerCase()) {
            case 'typescript': return { backgroundColor: '#3178c6' };
            case 'javascript': return { backgroundColor: '#f1e05a' };
            case 'python': return { backgroundColor: '#3572A5' };
            case 'java': return { backgroundColor: '#b07219' };
            case 'html': return { backgroundColor: '#e34c26' };
            case 'css': return { backgroundColor: '#563d7c' };
            case 'go': return { backgroundColor: '#00ADD8' };
            case 'rust': return { backgroundColor: '#dea584' };
            default: return { backgroundColor: '#8B949E' };
        }
    };

  return (
    <div className="flex items-center justify-between bg-tertiary p-3 rounded-md">
        <div className="flex-1 min-w-0">
            <a href={`https://github.com/${repo.full_name}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-text-primary font-semibold truncate hover:text-accent hover:underline">
                <GithubIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{repo.full_name}</span>
            </a>
            <div className="flex items-center gap-4 text-xs text-text-secondary mt-1">
                {repo.language && (
                    <div className="flex items-center">
                        <span className={`w-2.5 h-2.5 rounded-full mr-1.5`} style={languageColorStyle(repo.language)}></span>
                        {repo.language}
                    </div>
                )}
                <span>Setup: <span className={`font-medium ${repo.setup_status === 'COMPLETE' ? 'text-success' : 'text-text-secondary'}`}>{repo.setup_status}</span></span>
            </div>
        </div>
        <button
            onClick={() => onGenerateCommands(repo.id)}
            disabled={isGenerating}
            className="ml-4 px-3 py-1.5 bg-accent/20 text-accent text-xs font-semibold rounded-md hover:bg-accent/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Generate Commands
        </button>
    </div>
  );
};

export default RepositoryListItem;
