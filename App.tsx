import React, { useState } from 'react';
import ProjectsView from './components/projects/ProjectsView';
import SearchView from './components/search/SearchView';
import AgentsView from './components/agents/AgentsView';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AgentRunSelectionProvider } from './components/agents/contexts/AgentRunSelectionContext';
import { DialogProvider } from './components/agents/contexts/DialogContext';
import { Toaster } from 'react-hot-toast';


type Mode = 'projects' | 'search' | 'agents';

const App = () => {
  const [mode, setMode] = useState<Mode>('agents');
  const [githubToken, setGithubToken] = useLocalStorage<string>('githubToken', '');
  // Codegen credentials are now managed within the Agents tab's components and utils,
  // but we keep them here in case other parts of the app need them in the future.
  const [codegenOrgId, setCodegenOrgId] = useLocalStorage<string>('codegenOrgId', '');
  const [codegenToken, setCodegenToken] = useLocalStorage<string>('codegenToken', '');

  return (
    <div className="h-screen w-screen flex flex-col bg-primary text-text-primary overflow-hidden">
       <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#21262D', // tertiary
            color: '#C9D1D9', // text-primary
            border: `1px solid #30363D`, // border-color
          },
        }}
      />
      <header className="flex-shrink-0 bg-secondary border-b border-border-color z-30">
        <div className="flex items-center justify-center px-4">
            <nav className="flex space-x-2" aria-label="Tabs">
                <TabButton name="Projects" isActive={mode === 'projects'} onClick={() => setMode('projects')} />
                <TabButton name="Search" isActive={mode === 'search'} onClick={() => setMode('search')} />
                <TabButton name="Agents" isActive={mode === 'agents'} onClick={() => setMode('agents')} />
            </nav>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        {mode === 'projects' && <ProjectsView githubToken={githubToken} setGithubToken={setGithubToken} />}
        {mode === 'search' && <SearchView githubToken={githubToken} setGithubToken={setGithubToken} />}
        {mode === 'agents' && (
          <AgentRunSelectionProvider>
            <DialogProvider>
              <AgentsView />
            </DialogProvider>
          </AgentRunSelectionProvider>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ name, isActive, onClick }: { name: string, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`
            ${isActive ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-color'}
            whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors
        `}
        aria-current={isActive ? 'page' : undefined}
    >
        {name}
    </button>
);

export default App;