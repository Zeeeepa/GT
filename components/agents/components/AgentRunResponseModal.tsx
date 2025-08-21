import React from 'react';
import toast from 'react-hot-toast';
import { CachedAgentRun } from '../../../types';
import { XIcon, Copy } from 'lucide-react';

interface AgentRunResponseModalProps {
  run: CachedAgentRun;
  isOpen: boolean;
  onClose: () => void;
}

export const AgentRunResponseModal: React.FC<AgentRunResponseModalProps> = ({ run, isOpen, onClose }) => {
  if (!isOpen) return null;

  const copyToClipboard = async () => {
    if (!run.result) return;
    try {
      await navigator.clipboard.writeText(run.result);
      toast.success("Response copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy response");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-secondary rounded-lg shadow-2xl border border-border-color w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 flex justify-between items-center border-b border-border-color">
            <h2 className="text-lg font-bold text-text-primary">Response for Run #{run.id}</h2>
            <div className="flex items-center gap-2">
                <button onClick={copyToClipboard} className="p-2 rounded-md hover:bg-tertiary" title="Copy Response">
                    <Copy className="h-5 w-5 text-text-secondary" />
                </button>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-tertiary" title="Close">
                    <XIcon className="h-6 w-6 text-text-secondary" />
                </button>
            </div>
        </header>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm text-text-primary bg-primary p-4 rounded-md border border-border-color">
            <code>{run.result || "No response content."}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
