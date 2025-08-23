
import React, { useState, useRef, useEffect } from 'react';
import { ProjectRepository, ProjectList } from '../../types';
import { toRgba } from '../../utils/colorUtils';
import { StarIcon } from '../shared/icons/StarIcon';
import { RepoForkedIcon } from '../shared/icons/RepoForkedIcon';
import { IssueOpenedIcon } from '../shared/icons/IssueOpenedIcon';
import { TrashIcon } from '../shared/icons/TrashIcon';
import { LockIcon } from '../shared/icons/LockIcon';
import { DotsVerticalIcon } from '../shared/icons/DotsVerticalIcon';
import { PlusIcon } from '../shared/icons/PlusIcon';
import { CheckIcon } from '../shared/icons/CheckIcon';
import { SyncIcon } from '../shared/icons/SyncIcon';
import { ExclamationIcon } from '../shared/icons/ExclamationIcon';
import { InformationCircleIcon } from '../shared/icons/InformationCircleIcon';
import { CubeIcon } from '../shared/icons/CubeIcon';
import { ChatIcon } from '../shared/icons/ChatIcon';

interface ProjectCardProps {
  repo: ProjectRepository;
  allLists: ProjectList[];
  repoListMembership: string[]; // Array of list IDs
  onDelete: (repo: ProjectRepository) => void;
  onAddToList: (repo: ProjectRepository, listId: string) => void;
  onRemoveFromList: (repo: ProjectRepository, listId: string) => void;
  activeListColor?: string;
  isSyncEnabled: boolean;
  onToggleSync: (repoFullName: string, isEnabled: boolean) => void;
  syncNotification?: { status: 'success' | 'error' | 'info'; message: string };
  commitsBehind?: number;
  onChat?: (repo: ProjectRepository) => void;
  onInfo?: (repo: ProjectRepository) => void;
  isCodegenLinked?: boolean;
  notificationCount?: number;
  onClearNotifications?: (repo: ProjectRepository) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  repo, 
  allLists, 
  repoListMembership, 
  onDelete, 
  onAddToList, 
  onRemoveFromList, 
  activeListColor,
  isSyncEnabled,
  onToggleSync,
  syncNotification,
  commitsBehind,
  onChat,
  onInfo,
  isCodegenLinked
  , notificationCount
  , onClearNotifications
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const repoLists = allLists.filter(list => repoListMembership.includes(list.id));
  
  const displayColor = activeListColor || (repoLists.length > 0 ? repoLists[0].color : undefined);

  const cardStyle = displayColor && !isDragging ? {
    background: `radial-gradient(circle at 20% 20%, ${toRgba(displayColor, 0.2)}, #161B22 80%)`,
    borderColor: displayColor,
  } : {};
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", repo.full_name);
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
    setMenuOpen(false);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };


  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`bg-secondary border border-border-color rounded-lg p-2.5 flex flex-col justify-between hover:border-accent transition-all duration-300 h-full cursor-grab ${isDragging ? 'opacity-50 scale-95 shadow-2xl ring-2 ring-accent' : 'shadow-lg'}`}
      style={cardStyle}
    >
      <div>
        <div className="flex justify-between items-start mb-1">
            <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 group min-w-0 pr-2">
                {repo.private && <LockIcon className="w-3.5 h-3.5 text-text-secondary shrink-0" />}
                <h3 className="font-semibold text-sm text-accent group-hover:underline truncate" title={repo.full_name}>
                  {repo.name}
                </h3>
                {isCodegenLinked && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
                    <CubeIcon className="w-3 h-3" /> Codegen
                  </span>
                )}
                {isSyncEnabled && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/30">
                    <SyncIcon className="w-3 h-3" /> Sync
                  </span>
                )}
            </a>
            <div className="relative shrink-0" ref={menuRef}>
                <button onClick={() => { const next = !menuOpen; setMenuOpen(next); if (next && onClearNotifications) onClearNotifications(repo); }} className="p-1 rounded-full hover:bg-tertiary text-text-secondary hover:text-text-primary" aria-label="Project options">
                    <DotsVerticalIcon className="w-5 h-5" />
                </button>
                {typeof notificationCount === 'number' && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-danger text-white text-[10px]">
                    {notificationCount}
                  </span>
                )}
                {menuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-tertiary border border-border-color rounded-md shadow-2xl z-20">
                        <div className="p-1 max-h-52 overflow-y-auto">
                            <p className="px-2 py-1.5 text-xs font-semibold text-text-secondary">Add to list</p>
                            {allLists.map(list => {
                                const isAssigned = repoListMembership.includes(list.id);
                                return (
                                    <button
                                        key={list.id}
                                        onClick={() => {
                                            if (isAssigned) {
                                                onRemoveFromList(repo, list.id);
                                            } else {
                                                onAddToList(repo, list.id);
                                            }
                                        }}
                                        className="w-full text-left flex items-center justify-between px-2 py-1.5 text-sm text-text-primary rounded-md hover:bg-accent/20"
                                    >
                                        <div className="flex items-center truncate">
                                          <span style={{ backgroundColor: list.color }} className="w-3 h-3 rounded-full mr-2 shrink-0 border border-black/20"></span>
                                          <span className="truncate">{list.name}</span>
                                        </div>
                                        {isAssigned && <CheckIcon className="w-4 h-4 text-accent" />}
                                    </button>
                                );
                            })}
                            {allLists.length === 0 && (
                                <p className="px-2 py-1.5 text-xs text-text-secondary">No lists created yet.</p>
                            )}
                        </div>
                        {repo.fork && (
                          <>
                            <div className="border-t border-border-color my-1"></div>
                            <div className="p-1">
                              <label className="w-full text-left flex items-center justify-between px-2 py-1.5 text-sm text-text-primary rounded-md hover:bg-accent/20 cursor-pointer">
                                <span className="flex items-center gap-2">
                                  <SyncIcon className="w-4 h-4" />
                                  Auto-sync Fork
                                </span>
                                <input
                                  type="checkbox"
                                  checked={isSyncEnabled}
                                  onChange={(e) => onToggleSync(repo.full_name, e.target.checked)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-4 w-4 bg-primary border-border-color rounded text-accent focus:ring-accent focus:ring-offset-secondary focus:ring-offset-2"
                                />
                              </label>
                            </div>
                          </>
                        )}
                        <div className="border-t border-border-color my-1"></div>
                        <div className="p-1">
                            <button
                                onClick={() => {
                                  onDelete(repo);
                                  setMenuOpen(false);
                                }}
                                className="w-full text-left flex items-center px-2 py-1.5 text-sm text-danger rounded-md hover:bg-danger/20"
                            >
                                <TrashIcon className="w-4 h-4 mr-2" />
                                Delete Repository
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
        <p className="text-xs text-text-secondary mb-1.5 break-words h-8 overflow-hidden">{repo.description || 'No description available.'}</p>
      </div>

      <div className="mt-auto pt-1.5 border-t border-border-color/50">
        <div className="flex items-center justify-between text-xs text-text-secondary">
            <div className="flex items-center space-x-3">
                <span className="flex items-center" title={`${repo.stargazers_count} stars`}>
                    <StarIcon className="w-3.5 h-3.5 mr-1 text-yellow-400" />
                    {repo.stargazers_count}
                </span>
                <span className="flex items-center" title={`${repo.forks_count} forks`}>
                    <RepoForkedIcon className="w-3.5 h-3.5 mr-1" />
                    {repo.forks_count}
                </span>
                <span className="flex items-center" title={`${repo.open_issues_count} open issues`}>
                    <IssueOpenedIcon className="w-3.5 h-3.5 mr-1" />
                    {repo.open_issues_count}
                </span>
            </div>
            {repo.language && (
                <div className="flex items-center">
                    <span className={`w-2.5 h-2.5 rounded-full ${languageColor(repo.language)}`}></span>
                    <span className="ml-1.5">{repo.language}</span>
                </div>
            )}
            <div className="flex items-center gap-2 ml-2">
              <button
                className="p-1 rounded hover:bg-tertiary text-text-secondary hover:text-text-primary"
                title="Chat about this project"
                onClick={(e) => { e.preventDefault(); onChat && onChat(repo); }}
              >
                <ChatIcon className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-tertiary text-text-secondary hover:text-text-primary"
                title="Analyze project (Info)"
                onClick={(e) => { e.preventDefault(); onInfo && onInfo(repo); }}
              >
                <InformationCircleIcon className="w-4 h-4" />
              </button>
            </div>
        </div>
        {typeof commitsBehind === 'number' && commitsBehind > 0 && (
          <div className="mt-1.5 text-[11px] text-yellow-400">{commitsBehind} commits behind</div>
        )}
        {repoLists.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {repoLists.map(list => (
              <span 
                key={list.id} 
                className="text-[11px] text-text-primary px-1.5 py-0.5 rounded-full flex items-center"
                style={{ backgroundColor: toRgba(list.color, 0.3) }}
              >
                 <span style={{ backgroundColor: list.color }} className="w-2 h-2 rounded-full mr-1.5 border border-black/20"></span>
                {list.name}
              </span>
            ))}
          </div>
        )}
        {syncNotification && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
                {syncNotification.status === 'success' && <CheckIcon className="w-4 h-4 text-success shrink-0" />}
                {syncNotification.status === 'error' && <ExclamationIcon className="w-4 h-4 text-danger shrink-0" />}
                {syncNotification.status === 'info' && <InformationCircleIcon className="w-4 h-4 text-text-secondary shrink-0" />}
                <span className={
                    syncNotification.status === 'success' ? 'text-success' :
                    syncNotification.status === 'error' ? 'text-danger' : 'text-text-secondary'
                }>
                    {syncNotification.message}
                </span>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
