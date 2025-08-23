import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X as CloseIcon } from 'lucide-react';
import { getCredentials, saveCredentials } from '../../utils/credentials';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const [githubToken, setGithubToken] = useState('');
  const [codegenToken, setCodegenToken] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCredentials();
    }
  }, [isOpen]);

  const loadCredentials = async () => {
    try {
      const credentials = await getCredentials();
      if (credentials) {
        setGithubToken(credentials.githubToken || '');
        setCodegenToken(credentials.codegenToken || '');
        setOrganizationId(credentials.organizationId?.toString() || '');
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!codegenToken) {
        setError('API token is required');
        setIsSaving(false);
        return;
      }

      await saveCredentials({
        githubToken,
        codegenToken,
        organizationId: organizationId ? parseInt(organizationId) : undefined,
      });

      setSuccess('Settings saved successfully!');
      setTimeout(() => {
        onClose();
        // Reload the page to apply the new settings
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error saving credentials:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-secondary rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button 
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">GitHub Token</label>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="w-full px-3 py-2 bg-primary border border-border-color rounded-md"
              placeholder="Enter GitHub token"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Codegen API Token <span className="text-danger">*</span></label>
            <input
              type="password"
              value={codegenToken}
              onChange={(e) => setCodegenToken(e.target.value)}
              className="w-full px-3 py-2 bg-primary border border-border-color rounded-md"
              placeholder="Enter Codegen API token"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Organization ID</label>
            <input
              type="text"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full px-3 py-2 bg-primary border border-border-color rounded-md"
              placeholder="Enter organization ID"
            />
          </div>

          {error && (
            <div className="bg-danger/20 border border-danger/30 text-danger px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-success/20 border border-success/30 text-success px-3 py-2 rounded-md text-sm">
              {success}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-md flex items-center"
            >
              {isSaving ? (
                <>
                  <span className="mr-2">Saving...</span>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;

