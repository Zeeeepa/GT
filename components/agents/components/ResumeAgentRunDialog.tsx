import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { getAPIClient } from '../../../services/codegenApiService';
import { Play } from 'lucide-react';

interface ResumeAgentRunDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agentRunId: number;
  organizationId: number;
  onResumed: () => Promise<void>;
}

export const ResumeAgentRunDialog: React.FC<ResumeAgentRunDialogProps> = ({ isOpen, onClose, agentRunId, organizationId, onResumed }) => {
  const [prompt, setPrompt] = useState('');
  const [isResuming, setIsResuming] = useState(false);
  const apiClient = getAPIClient();

  const handleResume = async () => {
    if (!prompt.trim()) {
      toast.error("A prompt is required to resume the run.");
      return;
    }
    setIsResuming(true);
    try {
      await apiClient.resumeAgentRun(organizationId.toString(), agentRunId, { prompt });
      toast.success(`Agent run #${agentRunId} resumed successfully.`);
      await onResumed();
      onClose();
    } catch (error) {
      // API client will show a toast on error
    } finally {
      setIsResuming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-secondary rounded-lg shadow-2xl border border-border-color w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">Resume Agent Run #{agentRunId}</h2>
          <p className="text-text-secondary mb-4">This run is paused and requires input to continue. Please provide a brief instruction.</p>
          <textarea
            rows={4}
            className="w-full bg-primary border border-border-color rounded-md p-2 text-sm focus:ring-accent"
            placeholder="e.g., 'Please continue with the task.'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <div className="bg-tertiary px-6 py-4 flex justify-end items-center space-x-4 rounded-b-lg">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-transparent border border-border-color text-text-primary hover:bg-border-color">Cancel</button>
          <button onClick={handleResume} disabled={isResuming} className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent/80 disabled:bg-gray-500">
            <Play className="w-5 h-5" />
            {isResuming ? "Resuming..." : "Resume Run"}
          </button>
        </div>
      </div>
    </div>
  );
};
