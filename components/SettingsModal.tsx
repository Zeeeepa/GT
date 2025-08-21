
import React, { useState, useEffect } from 'react';
import { EyeIcon } from './shared/icons/EyeIcon';
import { EyeSlashIcon } from './shared/icons/EyeSlashIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (token: string) => void;
  currentToken: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentToken }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [isTokenVisible, setIsTokenVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTokenInput(currentToken);
      setIsTokenVisible(false);
    }
  }, [isOpen, currentToken]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(tokenInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-secondary rounded-lg shadow-2xl border border-border-color w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">Settings</h2>
          <p className="text-sm text-text-secondary mb-6">
            Manage your GitHub Personal Access Token. This is stored securely in your browser's local storage.
          </p>
          
          <div className="space-y-2">
              <label htmlFor="settings-github-token" className="block text-sm font-medium text-text-primary">
                  GitHub Personal Access Token
              </label>
              <div className="relative">
                  <input
                      id="settings-github-token"
                      type={isTokenVisible ? 'text' : 'password'}
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
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

export default SettingsModal;
