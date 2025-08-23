import React, { useState } from 'react';
import ProjectsView from './components/projects/ProjectsView';
import SearchView from './components/search/SearchView';
import AgentsView from './components/agents/AgentsView';
import DashboardView from './components/dashboard/DashboardView';
import { useLocalStorage } from './hooks/useLocalStorage';
import ActiveAgentRunsCounter from './components/header/ActiveAgentRunsCounter';
import NotificationsIcon from './components/header/NotificationsIcon';
import SettingsIcon from './components/header/SettingsIcon';

type Mode = 'dashboard' | 'projects' | 'search' | 'agents';

const App = () => {
  const [mode, setMode] = useState<Mode>('dashboard');
  const [selectedAgentRunId, setSelectedAgentRunId] = useState<number | null>(null);

  const handleViewAgentRun = (agentRunId: number) => {
    setSelectedAgentRunId(agentRunId);
    setMode('agents');
  };

  const [projects, setProjects] = useState<any[]>([]);

  // Fetch projects for the Dashboard
  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        // If we have a ProjectsView component instance, we can get projects from there
        // For now, we'll just use an empty array
        // In a real implementation, you would fetch projects from your API
        setProjects([]);
      } catch (error) {
        console.error('Error fetching projects for dashboard:', error);
      }
    };
    
    fetchProjects();
  }, []);

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
            <ActiveAgentRunsCounter />
            <NotificationsIcon />
            <SettingsIcon />
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        {mode === 'dashboard' && <DashboardView onViewAgentRun={handleViewAgentRun} />}
        {mode === 'projects' && <ProjectsView />}
        {mode === 'search' && <SearchView />}
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
