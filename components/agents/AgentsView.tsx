import React, { useState, useEffect } from 'react';
import AgentRunsList from './AgentRunsList';
import AgentRunDetails from './AgentRunDetails';
import CreateAgentRunModal from './CreateAgentRunModal';
import LogsViewer from './LogsViewer';
import IntegrationsPanel from './IntegrationsPanel';
import { PlusIcon } from '../shared/icons/PlusIcon';
import { ListBulletIcon } from '../shared/icons/ListBulletIcon';
import { CogIcon } from '../shared/icons/CogIcon';
import { CubeIcon } from '../shared/icons/CubeIcon';
import { UserGroupIcon } from '../shared/icons/UserGroupIcon';
import { EyeIcon } from '../shared/icons/EyeIcon';
import { EyeSlashIcon } from '../shared/icons/EyeSlashIcon';
import { setCodegenCredentials, getRuntimeCodegenCredentials } from '../../services/codegenService';
import { getUnseenCount, clearUnseen } from '../../utils/notifications';
// duplicate import removed

type AgentView = 'runs' | 'logs' | 'integrations' | 'settings';

interface AgentsViewProps {
  initialSelectedRunId?: number | null;
}

const AgentsView: React.FC<AgentsViewProps> = ({ initialSelectedRunId = null }) => {
  const [currentView, setCurrentView] = useState<AgentView>('runs');
  const [selectedAgentRunId, setSelectedAgentRunId] = useState<number | null>(initialSelectedRunId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [credsMissing, setCredsMissing] = useState(false);
  const [orgId, setOrgId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(false);
  const [unseen, setUnseen] = useState<number>(0);

  useEffect(() => {
    const hasToken = !!import.meta.env.VITE_CODEGEN_API_TOKEN;
    const hasOrg = !!import.meta.env.VITE_CODEGEN_ORG_ID;
    const creds = getRuntimeCodegenCredentials();
    setOrgId(creds.org_id || '');
    setApiToken(creds.api_token || '');
    setCredsMissing(!(creds.api_token && creds.org_id) && !(hasToken && hasOrg));
    setUnseen(getUnseenCount());
  }, []);

  // Update selectedAgentRunId when initialSelectedRunId changes
  useEffect(() => {
    if (initialSelectedRunId) {
      setSelectedAgentRunId(initialSelectedRunId);
      setCurrentView('runs');
    }
  }, [initialSelectedRunId]);

  const handleAgentRunSelect = (agentRunId: number) => {
    setSelectedAgentRunId(agentRunId);
    setCurrentView('runs');
  };

  const handleViewLogs = (agentRunId: number) => {
    setSelectedAgentRunId(agentRunId);
    setCurrentView('logs');
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'runs':
        return selectedAgentRunId ? (
          <AgentRunDetails 
            agentRunId={selectedAgentRunId}
            onBack={() => setSelectedAgentRunId(null)}
            onViewLogs={() => setCurrentView('logs')}
          />
        ) : (
          <AgentRunsList 
            onSelectRun={handleAgentRunSelect}
            onCreateRun={() => setShowCreateModal(true)}
          />
        );
      case 'logs':
        return selectedAgentRunId ? (
          <LogsViewer 
            agentRunId={selectedAgentRunId}
            onBack={() => setCurrentView('runs')}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-secondary">Select an agent run to view logs</p>
          </div>
        );
      case 'integrations':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-text-primary">Integrations</h2>
            <IntegrationsPanel />
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-text-primary">Agent Settings</h2>
            <div className="bg-secondary rounded-lg p-6 border border-border-color max-w-xl">
              <p className="text-sm text-text-secondary mb-4">Configure Codegen credentials used by the Agents dashboard. Values are stored only in your browser (localStorage).</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="agents-org-id" className="block text-sm font-medium text-text-primary mb-1">Codegen Organization ID</label>
                  <input
                    id="agents-org-id"
                    type="text"
                    value={orgId}
                    onChange={(e) => { setOrgId(e.target.value); setSaved(false); }}
                    className="w-full bg-primary border border-border-color rounded-md px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="org_..."
                  />
                </div>

                <div>
                  <label htmlFor="agents-api-token" className="block text-sm font-medium text-text-primary mb-1">Codegen API Token</label>
                  <div className="relative">
                    <input
                      id="agents-api-token"
                      type={showToken ? 'text' : 'password'}
                      value={apiToken}
                      onChange={(e) => { setApiToken(e.target.value); setSaved(false); }}
                      className="w-full bg-primary border border-border-color rounded-md pl-4 pr-10 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="cg_..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-text-secondary hover:text-text-primary"
                      aria-label={showToken ? 'Hide token' : 'Show token'}
                    >
                      {showToken ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => { setOrgId(''); setApiToken(''); setSaved(false); }}
                    className="px-4 py-2 rounded-md bg-transparent border border-border-color text-text-primary hover:bg-border-color transition-colors"
                  >
                    Reset
                  </button>
                  <div className="flex items-center gap-3">
                    {saved && <span className="text-sm text-success">Saved</span>}
                    <button
                      onClick={() => { setCodegenCredentials(apiToken.trim(), orgId.trim()); setSaved(true); setCredsMissing(!(apiToken.trim() && orgId.trim())); }}
                      className="px-4 py-2 rounded-md transition-colors font-semibold bg-accent text-white hover:bg-accent/80"
                      disabled={!orgId.trim() || !apiToken.trim()}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-primary">
      {credsMissing && (
        <div className="bg-yellow-100 text-yellow-900 px-6 py-3 text-sm border-b border-border-color">
          Missing Codegen API credentials. Add VITE_CODEGEN_API_TOKEN and VITE_CODEGEN_ORG_ID to your .env, then restart the dev server.
        </div>
      )}
      {/* Header */}
      <header className="bg-secondary border-b border-border-color px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-text-primary">Codegen Agents</h1>
            
            {/* Navigation */}
            <nav className="flex space-x-1">
              <NavButton
                icon={<ListBulletIcon className="w-4 h-4" />}
                label="Agent Runs"
                isActive={currentView === 'runs'}
                onClick={() => {
                  setCurrentView('runs');
                  setSelectedAgentRunId(null);
                }}
              />
              <NavButton
                icon={<CubeIcon className="w-4 h-4" />}
                label="Integrations"
                isActive={currentView === 'integrations'}
                onClick={() => {
                  setCurrentView('integrations');
                  setSelectedAgentRunId(null);
                }}
              />
              <NavButton
                icon={<UserGroupIcon className="w-4 h-4" />}
                label="Settings"
                isActive={currentView === 'settings'}
                onClick={() => {
                  setCurrentView('settings');
                  setSelectedAgentRunId(null);
                }}
              />
            </nav>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Notifications badge (missed events count) */}
            <div className="relative" onClick={() => { clearUnseen(); setUnseen(0); }}>
              <span className="inline-flex items-center px-3 py-2 rounded-lg bg-tertiary text-text-secondary text-sm">
                Events
              </span>
              {/* Placeholder badge; wire to unseen events count later */}
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-danger text-white text-xs">
                {unseen}
              </span>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Agent Run
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {renderMainContent()}
      </main>

      {/* Create Agent Run Modal */}
      {showCreateModal && (
        <CreateAgentRunModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(agentRun) => {
            setShowCreateModal(false);
            handleAgentRunSelect(agentRun.id);
          }}
        />
      )}
    </div>
  );
};

const NavButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
      ${isActive 
        ? 'bg-accent text-white' 
        : 'text-text-secondary hover:text-text-primary hover:bg-hover'
      }
    `}
  >
    {icon}
    <span className="ml-2">{label}</span>
  </button>
);

export default AgentsView;
