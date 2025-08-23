import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Clipboard as ClipboardIcon, Settings } from 'lucide-react';
import { getAPIClient, resetAPIClient } from '../../../services/codegenApiService';
import { getAgentRunCache } from '../../../storage/agentRunCache';
import { validateCredentials, hasCredentials, getCredentials, getDefaultOrganizationId } from '../../../utils/credentials';
import { Organization, CreateAgentRunRequest } from '../../../types';
import { getBackgroundMonitoringService } from '../../../utils/backgroundMonitoring';
import LoadingSpinner from '../../shared/LoadingSpinner';

interface CreateRunDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateRunDialog: React.FC<CreateRunDialogProps> = ({ isOpen, onClose, onCreated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [prompt, setPrompt] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [attachClipboard, setAttachClipboard] = useState(false);

  const apiClient = getAPIClient();
  const cache = getAgentRunCache();
  const backgroundMonitoring = getBackgroundMonitoringService();

  useEffect(() => {
    if (!isOpen) return;

    async function initialize() {
      setIsLoadingOrgs(true);
      setValidationError(null);

      if (!await hasCredentials()) {
        setValidationError("API token not configured. Please set it in your Codegen settings.");
        setIsLoadingOrgs(false);
        return;
      }

      try {
        const validation = await validateCredentials();
        if (!validation.isValid) {
          setValidationError(validation.error || "Invalid credentials");
          return;
        }

        if (validation.organizations) {
          setOrganizations(validation.organizations as OrganizationResponse[]);
          const defaultOrgId = await getDefaultOrganizationId();
          if (defaultOrgId) {
            setOrganizationId(defaultOrgId.toString());
          } else if (validation.organizations.length > 0) {
            setOrganizationId(validation.organizations[0].id.toString());
          }
        }
      } catch (error) {
        setValidationError(error instanceof Error ? error.message : "Failed to validate credentials");
      } finally {
        setIsLoadingOrgs(false);
      }
    }

    initialize();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !organizationId) {
      toast.error("Prompt and organization are required.");
      return;
    }
    setIsLoading(true);

    try {
      let finalPrompt = prompt.trim();
      if (attachClipboard) {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText.trim()) {
          finalPrompt += `\n\n--- Context from Clipboard ---\n${clipboardText}`;
        }
      }

      const payload: CreateAgentRunRequest = { prompt: finalPrompt };
      const newRun = await apiClient.createAgentRun(organizationId, payload);
      await cache.updateAgentRun(parseInt(organizationId), newRun);
      
      if (!backgroundMonitoring.isMonitoring()) {
        backgroundMonitoring.start();
      }

      await onCreated();
      toast.success(`Agent run #${newRun.id} created successfully!`);
      onClose();
    } catch (error) {
      // API Client shows its own toast
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-secondary rounded-lg shadow-2xl border border-border-color w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-xl font-bold text-text-primary mb-6">Create New Agent Run</h2>
            {isLoadingOrgs ? <div className="flex justify-center"><LoadingSpinner/></div> : validationError ? (
              <div className="text-center p-4 bg-danger/10 text-danger rounded-md">{validationError}</div>
            ) : (
              <div className="space-y-4">
                <textarea
                  rows={6}
                  className="w-full bg-primary border border-border-color rounded-md p-2 text-sm focus:ring-accent"
                  placeholder="What are we building today?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                />
                <div className="flex items-center">
                  <input id="attachClipboard" type="checkbox" className="h-4 w-4 text-accent bg-primary border-border-color rounded focus:ring-accent" checked={attachClipboard} onChange={(e) => setAttachClipboard(e.target.checked)} />
                  <label htmlFor="attachClipboard" className="ml-2 block text-sm text-text-primary">Include clipboard context</label>
                </div>
                <select id="organizationId" className="w-full bg-primary border border-border-color rounded-md p-2 text-sm focus:ring-accent" value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} required >
                  <option value="">Select Organization</option>
                  {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="bg-tertiary px-6 py-4 flex justify-end items-center space-x-4 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-transparent border border-border-color text-text-primary hover:bg-border-color">Cancel</button>
            <button type="submit" disabled={isLoading || isLoadingOrgs || !!validationError} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent/80 disabled:bg-gray-500 w-40">
              {isLoading ? <LoadingSpinner/> : <><Plus className="w-5 h-5" /> Create Run</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
