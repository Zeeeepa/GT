
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProjectRepository, ProjectList, ProjectView } from '../../types';
import { 
  fetchRepositories, 
  deleteRepository,
  syncFork,
  GithubApiError,
} from '../../services/projectGithubService';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import ProjectCard from './ProjectCard';
import ConfirmationModal from '../shared/ConfirmationModal';
import LoadingSpinner from '../shared/LoadingSpinner';
import Sidebar from './Sidebar';
import ManageListsModal from './ManageListsModal';
import { EyeIcon } from '../shared/icons/EyeIcon';
import { EyeSlashIcon } from '../shared/icons/EyeSlashIcon';
import SettingsModal from './SettingsModal';

interface ProjectsViewProps {
    githubToken: string;
    setGithubToken: (token: string) => void;
}

export default function ProjectsView({ githubToken, setGithubToken }: ProjectsViewProps) {
  const [allRepositories, setAllRepositories] = useState<ProjectRepository[]>([]);
  const [repositoriesToDisplay, setRepositoriesToDisplay] = useState<ProjectRepository[]>([]);
  
  const [lists, setLists] = useLocalStorage<ProjectList[]>('projectLists', []);
  const [repoListMembership, setRepoListMembership] = useLocalStorage<Record<string, string[]>>('repoListMembership', {});
  
  const [view, setView] = useState<ProjectView>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  
  const [repoToDelete, setRepoToDelete] = useState<ProjectRepository | null>(null);
  const [listToDelete, setListToDelete] = useState<ProjectList | null>(null);

  const [isManageListsModalOpen, setIsManageListsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [draggedOverListId, setDraggedOverListId] = useState<string | null>(null);

  const [tokenInput, setTokenInput] = useState('');
  const [isTokenVisible, setIsTokenVisible] = useState(false);

  const [syncSettings, setSyncSettings] = useLocalStorage<Record<string, boolean>>('repoSyncSettings', {});
  const [syncNotifications, setSyncNotifications] = useState<Record<string, { status: 'success' | 'error' | 'info'; message: string }>>({});

  // Sidebar resizing logic
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage('sidebarCollapsed', false);
  const [sidebarWidth, setSidebarWidth] = useLocalStorage('sidebarWidth', 280);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX - (sidebarRef.current?.getBoundingClientRect().left ?? 0);
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing, setSidebarWidth]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', handleResizeEnd);

    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [handleResize, handleResizeEnd]);


  useEffect(() => {
    const initializeApp = async () => {
      // Try to load token from `api.json` if one isn't already set in local storage.
      // The `githubToken` state from `useLocalStorage` will be an empty string on first load.
      if (!githubToken) {
        try {
          const response = await fetch('/api.json');
          if (response.ok) {
            const data = await response.json();
            if (data && data.github_token) {
              // This will set the token and trigger the data fetching effect.
              setGithubToken(data.github_token);
            }
          }
        } catch (error) {
          console.info("api.json not found. App will await token in Settings.");
        }
      }
      
      // Only load from repos.json if localStorage is uninitialized.
      if (localStorage.getItem('projectLists') === null) {
          try {
              const response = await fetch('/repos.json');
              if (response.ok) {
                  const data = await response.json();
                  if (data.lists && data.repoListMembership) {
                      setLists(data.lists);
                      setRepoListMembership(data.repoListMembership);
                  }
              }
          } catch (error) {
              console.info("repos.json not found or not configured. Starting with empty lists.");
          }
      }
    };
    
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInitialData = useCallback(async (token: string) => {
    setLoading('Fetching your GitHub repositories...');
    setPageError(null);
    try {
      const fetchedRepos = await fetchRepositories(token);
      setAllRepositories(fetchedRepos);
      setView({ type: 'all' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      if (err instanceof GithubApiError && (err.status === 401 || err.status === 403)) {
         setPageError('Configuration error: Your GitHub token is invalid, has expired, or lacks necessary permissions. Please check your token and its permissions.');
      } else {
        setPageError(errorMessage);
      }
    } finally {
      setLoading(null);
    }
  }, [setAllRepositories, setPageError, setLoading, setView]);
  
  useEffect(() => {
    if (githubToken) {
      fetchInitialData(githubToken);
    } else {
        setAllRepositories([]);
        setLoading(null);
    }
  }, [githubToken, fetchInitialData]);

  useEffect(() => {
    setPageError(null);

    let baseRepos: ProjectRepository[] = [];

    if (view.type === 'all') {
        baseRepos = allRepositories;
    } else if (view.type === 'list') {
        const repoFullNamesInList = Object.entries(repoListMembership)
            .filter(([, listIds]) => listIds.includes(view.list.id))
            .map(([repoFullName]) => repoFullName);
        baseRepos = allRepositories.filter(repo => repoFullNamesInList.includes(repo.full_name));
    }

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        const filteredRepos = baseRepos.filter(repo =>
            repo.name.toLowerCase().includes(lowercasedQuery) ||
            (repo.description && repo.description.toLowerCase().includes(lowercasedQuery)) ||
            repo.full_name.toLowerCase().includes(lowercasedQuery)
        );
        setRepositoriesToDisplay(filteredRepos);
    } else {
        setRepositoriesToDisplay(baseRepos);
    }
  }, [view, allRepositories, repoListMembership, searchQuery]);

  const handleToggleSync = useCallback((repoFullName: string, isEnabled: boolean) => {
      setSyncSettings(prev => {
        const newSettings = { ...prev };
        if (isEnabled) {
          newSettings[repoFullName] = true;
        } else {
          delete newSettings[repoFullName];
        }
        return newSettings;
      });
      setSyncNotifications(currentNotifications => {
          const newNotifications = {...currentNotifications};
          delete newNotifications[repoFullName];
          return newNotifications;
      });
  }, [setSyncSettings, setSyncNotifications]);

  useEffect(() => {
    if (!githubToken || allRepositories.length === 0) return;

    const syncAllEnabledForks = async () => {
      const reposToSync = allRepositories.filter(repo => repo.fork && syncSettings[repo.full_name]);
      
      if (reposToSync.length === 0) return;
      console.log(`[${new Date().toLocaleTimeString()}] Starting periodic sync for ${reposToSync.length} repositories.`);

      for (const repo of reposToSync) {
        try {
          await syncFork(repo.owner.login, repo.name, repo.default_branch, githubToken);
          setSyncNotifications(prev => ({
            ...prev,
            [repo.full_name]: { status: 'success', message: 'Synced with upstream.' }
          }));
        } catch (err) {
          if (err instanceof GithubApiError) {
            let notification: { status: 'info' | 'error', message: string } | null = null;
            if (err.status === 409) {
              if (err.message.toLowerCase().includes('conflict')) {
                notification = { status: 'error', message: 'Merge conflict!' };
              } else {
                notification = { status: 'info', message: 'Already up-to-date.' };
              }
            } else if (err.status === 422) {
                notification = { status: 'info', message: 'Fork is ahead.' };
            } else {
              notification = { status: 'error', message: 'Sync failed.' };
              console.error(`Error syncing ${repo.full_name}:`, err);
            }
            if (notification) {
                setSyncNotifications(prev => ({ ...prev, [repo.full_name]: notification! }));
            }
          } else {
            setSyncNotifications(prev => ({
              ...prev,
              [repo.full_name]: { status: 'error', message: 'Unknown sync error.' }
            }));
            console.error(`Unknown error syncing ${repo.full_name}:`, err);
          }
        }
      }
    };

    syncAllEnabledForks();
    const intervalId = setInterval(syncAllEnabledForks, 3600 * 1000); // every hour

    return () => clearInterval(intervalId);
  }, [allRepositories, syncSettings, githubToken]);

  const handleCreateList = (listName: string, color: string) => {
    if (!listName) return;
    const newList: ProjectList = { id: crypto.randomUUID(), name: listName.trim(), color };
    const sortedLists = [...lists, newList].sort((a,b) => a.name.localeCompare(b.name));
    setLists(sortedLists);
  };

  const handleEditList = (listId: string, newName: string, newColor: string) => {
    setLists(prev => 
        prev.map(list => 
            list.id === listId ? { ...list, name: newName, color: newColor } : list
        ).sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const handleDeleteListRequest = (list: ProjectList) => {
    setListToDelete(list);
    setIsManageListsModalOpen(false);
  };

  const confirmDeleteList = () => {
    if (!listToDelete) return;
    const listId = listToDelete.id;

    setLists(prev => prev.filter(l => l.id !== listId));
    
    const newMembership = { ...repoListMembership };
    Object.keys(newMembership).forEach(repoFullName => {
        newMembership[repoFullName] = newMembership[repoFullName].filter(id => id !== listId);
        if (newMembership[repoFullName].length === 0) {
            delete newMembership[repoFullName];
        }
    });
    setRepoListMembership(newMembership);

    setView({ type: 'all' });
    setListToDelete(null);
  };

  const handleAddRepoToList = useCallback((repo: ProjectRepository, listId: string) => {
    setRepoListMembership(prev => {
        const currentLists = prev[repo.full_name] || [];
        if (currentLists.includes(listId)) return prev;
        return { ...prev, [repo.full_name]: [...currentLists, listId] };
    });
  }, [setRepoListMembership]);
  
  const handleRemoveRepoFromList = (repo: ProjectRepository, listId: string) => {
    setRepoListMembership(prev => {
      const newRepoMembership = { ...prev };
      const currentLists = newRepoMembership[repo.full_name] || [];
      const updatedLists = currentLists.filter(id => id !== listId);
      
      if (updatedLists.length === 0) {
          delete newRepoMembership[repo.full_name];
      } else {
          newRepoMembership[repo.full_name] = updatedLists;
      }
      return newRepoMembership;
    });
  };

  const handleDeleteRepoRequest = (repo: ProjectRepository) => setRepoToDelete(repo);

  const confirmDeleteRepo = async () => {
    if (!repoToDelete || !githubToken) return;
    setLoading(`Deleting ${repoToDelete.full_name}...`);
    try {
      await deleteRepository(repoToDelete.owner.login, repoToDelete.name, githubToken);
      setAllRepositories(prev => prev.filter(r => r.id !== repoToDelete.id));
    } catch (err) {
      setPageError(err instanceof Error ? err.message : `Failed to delete ${repoToDelete.name}.`);
    } finally {
      setRepoToDelete(null);
      setLoading(null);
    }
  };
  
  const handleDrop = (e: React.DragEvent, listId: string) => {
    e.preventDefault();
    const repoFullName = e.dataTransfer.getData("text/plain");
    const repo = allRepositories.find(r => r.full_name === repoFullName);
    if (repo) {
      handleAddRepoToList(repo, listId);
    }
    setDraggedOverListId(null);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, listId: string) => {
    e.preventDefault();
    setDraggedOverListId(listId);
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOverListId(null);
  }
  
  const handleSaveToken = () => {
    if (tokenInput.trim()) {
        setGithubToken(tokenInput.trim());
        setTokenInput('');
    }
  };

  const handleImportData = (data: { lists: ProjectList[], repoListMembership: Record<string, string[]>, syncSettings?: Record<string, boolean> }) => {
    if (data && Array.isArray(data.lists) && typeof data.repoListMembership === 'object' && data.repoListMembership !== null) {
      setLists(data.lists);
      setRepoListMembership(data.repoListMembership);
      if (data.syncSettings && typeof data.syncSettings === 'object' && data.syncSettings !== null) {
        setSyncSettings(data.syncSettings);
      }
    } else {
      alert('Error: Invalid import file format. The file must contain at least "lists" and "repoListMembership" properties.');
    }
  };

  const handleSaveSettings = (newToken: string) => {
    setGithubToken(newToken);
  };

  const renderContent = () => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
              <LoadingSpinner />
              <p className="mt-4 text-lg">{loading}</p>
            </div>
        );
    }
    
    if (pageError) {
        return <div className="bg-danger/20 border border-danger text-danger p-4 rounded-md">{pageError}</div>;
    }
    
    if (!githubToken) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome to GitHub Project Catalog</h2>
                <p className="text-text-secondary mt-2 max-w-2xl mb-8">
                    To get started, please provide a GitHub Personal Access Token. It will be stored securely in your browser's local storage.
                </p>

                <div className="w-full max-w-md bg-secondary border border-border-color p-6 rounded-lg">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="github-token" className="block text-sm font-medium text-text-primary text-left mb-2">
                                GitHub Personal Access Token
                            </label>
                            <div className="relative">
                                <input
                                    id="github-token"
                                    type={isTokenVisible ? 'text' : 'password'}
                                    value={tokenInput}
                                    onChange={(e) => setTokenInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()}
                                    className="w-full bg-primary border border-border-color rounded-md pl-4 pr-10 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                                    placeholder="ghp_... or github_pat_..."
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsTokenVisible(!isTokenVisible)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-text-secondary hover:text-text-primary"
                                    aria-label={isTokenVisible ? "Hide token" : "Show token"}
                                >
                                    {isTokenVisible ? (
                                        <EyeSlashIcon className="h-5 w-5" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleSaveToken}
                            disabled={!tokenInput.trim()}
                            className="w-full inline-flex justify-center items-center px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent/80 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            Save and Continue
                        </button>
                    </div>
                </div>
                
                <div className="text-left bg-secondary border border-border-color rounded-lg p-6 mt-8 max-w-2xl w-full">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">How to Create a Token</h3>
                    <p className="text-sm text-text-secondary mb-4">
                        You can create a token in your GitHub account settings. The token requires permissions to read your repositories. For deleting repositories, it also needs administration access.
                    </p>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-text-primary flex items-center gap-2">Classic Token <span className="text-xs font-normal text-text-secondary">(ghp_...)</span></h4>
                            <p className="text-sm text-text-secondary mt-1 pl-2 border-l-2 border-border-color ml-1">Grant the full <code className="text-xs bg-primary p-1 rounded font-mono">repo</code> scope.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-text-primary flex items-center gap-2">Fine-Grained Token <span className="text-xs font-normal text-text-secondary">(github_pat_...)</span></h4>
                            <div className="text-sm text-text-secondary mt-1 pl-2 border-l-2 border-border-color ml-1">
                              <p className="mb-2">Assign the following repository permissions:</p>
                              <ul className="space-y-1.5">
                                  <li className="flex items-center gap-2"><strong>Contents:</strong> <span className="bg-success/10 text-success px-2 py-0.5 rounded-full text-xs font-medium">Read-only</span></li>
                                  <li className="flex items-center gap-2"><strong>Metadata:</strong> <span className="bg-success/10 text-success px-2 py-0.5 rounded-full text-xs font-medium">Read-only</span></li>
                                  <li className="flex items-center gap-2"><strong>Administration:</strong> <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full text-xs font-medium">Read &amp; Write</span> (for deleting)</li>
                              </ul>
                            </div>
                        </div>
                    </div>
                     <p className="text-sm text-text-secondary mt-6">
                        Alternatively, you can provide the token via an <code className="text-xs bg-primary p-1 rounded font-mono">api.json</code> file. 
                        <a 
                            href="https://github.com/google/labs-prototyping-platforms-samples/tree/main/demos/react-github-project-catalog#setup"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-accent hover:underline"
                        >
                            View setup instructions.
                        </a>
                    </p>
                </div>
            </div>
        );
    }

    if (repositoriesToDisplay.length === 0 && !pageError) {
       let message = "";
       if (searchQuery) {
           message = `No projects found matching "${searchQuery}".`;
           if (view.type === 'list') {
               message += ` in the list "${view.list.name}".`;
           }
       } else if (allRepositories.length > 0) {
           message = view.type === 'all' ? "We couldn't find any repositories for your account." : `The list "${view.list.name}" is currently empty. Drag and drop projects here to add them.`;
       } else {
           message = "We couldn't find any repositories for your account. You might need to create one on GitHub first.";
       }

       return (
         <div className="flex flex-col items-center justify-center h-full text-center p-8">
           <h2 className="text-2xl font-bold text-text-primary">No Projects Found</h2>
           <p className="text-text-secondary mt-2 max-w-md">{message}</p>
         </div>
       );
    }


    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {repositoriesToDisplay.map(repo => (
                <ProjectCard 
                    key={repo.id}
                    repo={repo}
                    allLists={lists}
                    repoListMembership={repoListMembership[repo.full_name] || []}
                    onDelete={handleDeleteRepoRequest}
                    onAddToList={handleAddRepoToList}
                    onRemoveFromList={handleRemoveRepoFromList}
                    activeListColor={view.type === 'list' ? view.list.color : undefined}
                    isSyncEnabled={!!syncSettings[repo.full_name]}
                    onToggleSync={handleToggleSync}
                    syncNotification={syncNotifications[repo.full_name]}
                />
            ))}
            </div>
        </>
    );
  };
  
  const listsWithCounts = lists.map(list => ({
    ...list,
    item_count: Object.values(repoListMembership).filter(listIds => listIds.includes(list.id)).length
  }));

  return (
    <div className="h-full w-full flex bg-primary text-text-primary overflow-hidden">
      {githubToken && (
        <Sidebar
          ref={sidebarRef}
          lists={listsWithCounts}
          activeView={view}
          onSelectView={setView}
          onOpenManageListsModal={() => setIsManageListsModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(prev => !prev)}
          width={sidebarWidth}
          onResizeStart={handleResizeStart}
          isResizing={isResizing}
          draggedOverListId={draggedOverListId}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className={`flex-1 p-6 overflow-y-auto ${!githubToken ? 'flex items-center justify-center' : ''}`}>
          {renderContent()}
        </main>
      </div>

      {repoToDelete && (
        <ConfirmationModal
          isOpen={!!repoToDelete}
          onClose={() => setRepoToDelete(null)}
          onConfirm={confirmDeleteRepo}
          title="Confirm Repository Deletion"
          message={`Are you sure you want to permanently delete the repository "${repoToDelete.full_name}"? This action cannot be undone.`}
          confirmText="Delete Repository"
          confirmButtonClass='bg-danger text-white hover:bg-danger/80'
        />
      )}
      {listToDelete && (
        <ConfirmationModal
          isOpen={!!listToDelete}
          onClose={() => {
            setListToDelete(null);
            setIsManageListsModalOpen(true);
          }}
          onConfirm={confirmDeleteList}
          title="Confirm List Deletion"
          message={`Are you sure you want to permanently delete the list "${listToDelete.name}"? All project associations with this list will be removed.`}
          confirmText="Delete List"
          confirmButtonClass='bg-danger text-white hover:bg-danger/80'
        />
      )}
      <ManageListsModal
        isOpen={isManageListsModalOpen}
        onClose={() => setIsManageListsModalOpen(false)}
        lists={lists}
        repoListMembership={repoListMembership}
        syncSettings={syncSettings}
        onCreateList={handleCreateList}
        onEditList={handleEditList}
        onConfirmDelete={handleDeleteListRequest}
        onImportData={handleImportData}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveSettings}
        currentToken={githubToken}
      />
    </div>
  );
}