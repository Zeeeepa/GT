import React, { useState } from 'react';
import { ProjectRepository, SetupCommand } from '../../types';
import { getCodegenService } from '../../services/codegenService';
import LoadingSpinner from '../shared/LoadingSpinner';
import { ClipboardCopyIcon } from '../shared/icons/ClipboardCopyIcon';
import { XIcon } from '../shared/icons/XIcon';

interface SetupCommandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  repository: ProjectRepository | null;
}

const SetupCommandsModal: React.FC<SetupCommandsModalProps> = ({ isOpen, onClose, repository }) => {
  const [commands, setCommands] = useState<SetupCommand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  React.useEffect(() => {
    if (isOpen && repository) {
      fetchSetupCommands();
    }
  }, [isOpen, repository]);

  const fetchSetupCommands = async () => {
    if (!repository) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const service = getCodegenService();
      const response = await service.generateSetupCommands(repository.full_name);
      setCommands(response);
    } catch (err) {
      console.error('Failed to fetch setup commands:', err);
      setError('Failed to generate setup commands. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-primary rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <h2 className="text-lg font-semibold text-text-primary">
            Setup Commands for {repository?.full_name}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-text-secondary">Generating setup commands...</span>
            </div>
          ) : error ? (
            <div className="text-danger p-4 rounded-lg bg-danger/10">
              {error}
            </div>
          ) : commands.length === 0 ? (
            <div className="text-text-secondary text-center py-8">
              No setup commands available for this repository.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-text-secondary mb-4">
                These commands will help you set up your development environment for this project.
              </p>
              
              {commands.map((command, index) => (
                <div key={command.id} className="bg-secondary rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-text-primary">{command.description}</h3>
                    <div className="flex items-center">
                      {command.required && (
                        <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full mr-2">
                          Required
                        </span>
                      )}
                      <button
                        onClick={() => copyToClipboard(command.command, index)}
                        className="text-text-secondary hover:text-text-primary"
                        title="Copy to clipboard"
                      >
                        {copiedIndex === index ? (
                          <span className="text-xs text-success">Copied!</span>
                        ) : (
                          <ClipboardCopyIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <pre className="bg-primary p-3 rounded text-sm overflow-x-auto">
                    {command.command}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-border-color flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary hover:bg-hover text-text-primary rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupCommandsModal;

