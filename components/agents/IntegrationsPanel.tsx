import React from 'react';
import { useOrganizationIntegrations } from '../../hooks/codegen_api';
import LoadingSpinner from '../shared/LoadingSpinner';

const IntegrationsPanel: React.FC = () => {
  const { data: integrations, loading, error, refetch } = useOrganizationIntegrations();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-600 mb-3">Failed to load integrations: {error.message}</p>
        <button onClick={() => refetch()} className="px-3 py-2 bg-accent text-white rounded-md">Retry</button>
      </div>
    );
  }

  const items = Array.isArray(integrations) ? integrations : [];
  const active = items.filter(i => i.status === 'active');
  const inactive = items.filter(i => i.status !== 'active');

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold text-text-primary mb-3">Active</h3>
        {active.length === 0 ? (
          <p className="text-text-secondary">No active integrations</p>
        ) : (
          <div className="space-y-2">
            {active.map(integration => (
              <div key={integration.id} className="flex items-center justify-between bg-secondary border border-border-color rounded-lg px-4 py-3">
                <div>
                  <p className="text-text-primary font-medium">{integration.name}</p>
                  {integration.description && (
                    <p className="text-sm text-text-secondary">{integration.description}</p>
                  )}
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-text-primary mb-3">Inactive</h3>
        {inactive.length === 0 ? (
          <p className="text-text-secondary">No inactive integrations</p>
        ) : (
          <div className="space-y-2">
            {inactive.map(integration => (
              <div key={integration.id} className="flex items-center justify-between bg-secondary border border-border-color rounded-lg px-4 py-3">
                <div>
                  <p className="text-text-primary font-medium">{integration.name}</p>
                  {integration.description && (
                    <p className="text-sm text-text-secondary">{integration.description}</p>
                  )}
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default IntegrationsPanel;


