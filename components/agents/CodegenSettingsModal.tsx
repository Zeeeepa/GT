import React, { useState, useEffect } from 'react';
import { EyeIcon } from '../shared/icons/EyeIcon';
import { EyeSlashIcon } from '../shared/icons/EyeSlashIcon';

interface CodegenSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (orgId: string, token: string) => void;
  currentOrgId: string;
  currentToken: string;
}

const CodegenSettingsModal: React.FC<CodegenSettingsModalProps> = ({ isOpen, onClose, onSave, currentOrgId, currentToken }) => {
  const [orgIdInput, setOrgIdInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [isTokenVisible, setIsTokenVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOrgIdInput(currentOrgId);
      setTokenInput(currentToken);
      setIsTokenVisible(false);
    }
  }, [isOpen, currentOrgId, currentToken]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(orgIdInput.trim(), tokenInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-secondary rounded-lg shadow-2xl border border-border-color w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">Codegen Credentials</h2>
          <p className="text-sm text-text-secondary mb-6">
            Manage your Codegen Organization ID and API Token. They are stored securely in your browser's local storage.
          </p>
          
          <div className="space-y-4">
              <div>
                <label htmlFor="codegen-org-id" className="block text-sm font-medium text-text-primary">
                    Organization ID
                </label>
                <div className="mt-1">
                    <input
                        id="codegen-org-id"
                        type="text"
                        value={orgIdInput}
                        onChange={(e) => setOrgIdInput(e.target.value)}
                        className="w-full bg-primary border border-border-color rounded-md px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="Enter your Organization ID"
                    />
                </div>
              </div>
              <div>
                <label htmlFor="codegen-token" className="block text-sm font-medium text-text-primary">
                    API Token
                </label>
                <div className="relative mt-1">
                    <input
                        id="codegen-token"
                        type={isTokenVisible ? 'text' : 'password'}
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        className="w-full bg-primary border border-border-color rounded-md pl-4 pr-10 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="Enter your Codegen API token"
                    />
                    <button
                        type="button"
                        onClick={() => setIsTokenVisible(!isTokenVisible)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-text-secondary hover:text-text-primary"
                        aria-label={isTokenVisible ? "Hide token" : "Show token"}
                    >
                        {isTokenVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
              </div>
          </div>
        </div>
        <div className="bg-tertiary px-6 py-4 flex justify-end items-center space-x-4 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-transparent border border-border-color text-text-primary hover:bg-border-color transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md transition-colors font-semibold bg-accent text-white hover:bg-accent/80"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodegenSettingsModal;
