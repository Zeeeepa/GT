import React, { useState } from 'react';
import ProjectsView from './components/projects/ProjectsView';
import SearchView from './components/search/SearchView';
import AgentsView from './components/agents/AgentsView';
import DashboardView from './components/dashboard/DashboardView';
import { useLocalStorage } from './hooks/useLocalStorage';
import ActiveRunsCounter from './components/shared/ActiveRunsCounter';
import NotificationsIcon from './components/shared/NotificationsIcon';

type Mode = 'dashboard' | 'projects' | 'search' | 'agents';

const App = () => {
  const [mode, setMode] = useState<Mode>('dashboard');
  const [githubToken, setGithubToken] = useLocalStorage<string>('githubToken', '');
  const [githubApiUrl, setGithubApiUrl] = useLocalStorage<string>('githubApiUrl', 'https://api.github.com');
  const [selectedAgentRunId, setSelectedAgentRunId] = useState<number | null>(null);

  const handleViewAgentRun = (agentRunId: number) => {
    setSelectedAgentRunId(agentRunId);
    setMode('agents');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-primary text-text-primary overflow-hidden">
      <header className="flex-shrink-0 bg-secondary border-b border-border-color z-30">
        <div className="flex items-center justify-between px-4">
          <nav className="flex space-x-2" aria-label="Tabs">
            <TabButton name="Dashboard" isActive={mode === 'dashboard'} onClick={() => setMode('dashboard')} />
            <TabButton name="Projects" isActive={mode === 'projects'} onClick={() => setMode('projects')} />
            <TabButton name="Search" isActive={mode === 'search'} onClick={() => setMode('search')} />
            <TabButton name="Agents" isActive={mode === 'agents'} onClick={() => setMode('agents')} />
          </nav>
          <div className="flex items-center space-x-4">
            <ActiveRunsCounter className="text-neon-green" />
            <NotificationsIcon />
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        {mode === 'dashboard' && <DashboardView onViewAgentRun={handleViewAgentRun} />}
        {mode === 'projects' && <ProjectsView githubToken={githubToken} setGithubToken={setGithubToken} githubApiUrl={githubApiUrl} />}
        {mode === 'search' && <SearchView githubToken={githubToken} setGithubToken={setGithubToken} />}
        {mode === 'agents' && <AgentsView initialSelectedRunId={selectedAgentRunId} />}
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
