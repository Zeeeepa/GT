import React, { useState } from 'react';
import { showToast, ToastStyle } from '../../utils/toast';
import { getAPIClient } from '../../services/codegenApiService';
import LoadingSpinner from '../shared/LoadingSpinner';
import { Copy } from 'lucide-react';

interface GenerateSetupCommandsProps {
  projectId: number;
  organizationId: number;
}

export const GenerateSetupCommands: React.FC<GenerateSetupCommandsProps> = ({ projectId, organizationId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [commands, setCommands] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const generateCommands = async () => {
    setIsLoading(true);
    try {
      const apiClient = getAPIClient();
      const response = await apiClient.generateSetupCommands(organizationId.toString(), projectId);
      
      if (response && Array.isArray(response)) {
        setCommands(response.map(cmd => cmd.command));
        setIsOpen(true);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating setup commands:', error);
      showToast({ 
        style: ToastStyle.Failure, 
        title: 'Error', 
        message: 'Failed to generate setup commands' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast({ style: ToastStyle.Success, title: 'Success', message: 'Command copied to clipboard' });
    } catch (error) {
      showToast({ style: ToastStyle.Failure, title: 'Error', message: 'Failed to copy command' });
    }
  };

  const copyAllToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(commands.join('\n'));
      showToast({ style: ToastStyle.Success, title: 'Success', message: 'All commands copied to clipboard' });
    } catch (error) {
      showToast({ style: ToastStyle.Failure, title: 'Error', message: 'Failed to copy commands' });
    }
  };

  return (
    <>
      <button
        onClick={generateCommands}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-tertiary border border-border-color rounded-md text-sm"
      >
        {isLoading ? <LoadingSpinner size="sm" /> : null}
        Generate Setup Commands
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-secondary rounded-lg shadow-2xl border border-border-color w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <header className="p-4 flex justify-between items-center border-b border-border-color">
              <h2 className="text-lg font-bold text-text-primary">Setup Commands</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={copyAllToClipboard} 
                  className="px-3 py-1 text-sm bg-primary hover:bg-tertiary border border-border-color rounded-md"
                >
                  Copy All
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-1 rounded-full hover:bg-tertiary"
                >
                  &times;
                </button>
              </div>
            </header>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {commands.length === 0 ? (
                <p className="text-text-secondary">No commands generated.</p>
              ) : (
                <ul className="space-y-3">
                  {commands.map((command, index) => (
                    <li key={index} className="flex items-start gap-2 group">
                      <div className="flex-1 bg-primary p-3 rounded-md text-sm font-mono whitespace-pre-wrap border border-border-color/50 overflow-x-auto">
                        {command}
                      </div>
                      <button
                        onClick={() => copyToClipboard(command)}
                        className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy command"
                      >
                        <Copy className="h-4 w-4 text-text-secondary" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GenerateSetupCommands;
