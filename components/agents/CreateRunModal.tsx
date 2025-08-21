import React, { useState } from 'react';
import { CodegenRepository, CreateAgentRunRequest } from '../../types';
import { PlusIcon } from '../shared/icons/PlusIcon';
import LoadingSpinner from '../shared/LoadingSpinner';

interface CreateRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositories: CodegenRepository[];
  onCreateRun: (payload: CreateAgentRunRequest) => void;
  isCreating: boolean;
}

const CreateRunModal: React.FC<CreateRunModalProps> = ({ isOpen, onClose, repositories, onCreateRun, isCreating }) => {
  const [prompt, setPrompt] = useState('');
  const [repoId, setRepoId] = useState<number | undefined>();
  const [files, setFiles] = useState<FileList | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isCreating) return;

    const filePromises: Promise<string>[] = [];
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        filePromises.push(new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        }));
      }
    }

    try {
        const base64Images = await Promise.all(filePromises);

        const payload: CreateAgentRunRequest = { 
            prompt: prompt.trim(),
            repo_id: repoId,
            images: base64Images.length > 0 ? base64Images : undefined,
        };
        
        onCreateRun(payload);
    } catch (error) {
        console.error("Error reading file(s):", error);
        alert("There was an error processing the attached files. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-secondary rounded-lg shadow-2xl border border-border-color w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-text-primary mb-6">Create New Agent Run</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-text-secondary mb-1">Prompt</label>
              <textarea id="prompt" rows={8} value={prompt} onChange={e => setPrompt(e.target.value)}
                className="w-full bg-primary border border-border-color rounded-md p-2 text-sm focus:ring-accent focus:border-accent"
                placeholder="Describe the task for the agent... e.g., 'Refactor the authentication service to use async/await.'"
                required
              />
            </div>
            <div>
              <label htmlFor="repo" className="block text-sm font-medium text-text-secondary mb-1">Repository Context (Optional)</label>
              <select id="repo" value={repoId || ''} onChange={e => setRepoId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full bg-primary border border-border-color rounded-md p-2 text-sm focus:ring-accent focus:border-accent">
                <option value="">None</option>
                {repositories.map(repo => <option key={repo.id} value={repo.id}>{repo.full_name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-text-secondary mb-1">Image Attachments (Optional)</label>
              <input type="file" id="file" multiple accept="image/*" onChange={e => setFiles(e.target.files)}
                className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-tertiary file:text-text-primary hover:file:bg-border-color"
              />
            </div>
          </div>
        </div>
        <div className="bg-tertiary px-6 py-4 flex justify-end items-center space-x-4 rounded-b-lg">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-transparent border border-border-color text-text-primary hover:bg-border-color transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={!prompt.trim() || isCreating} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent/80 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed w-48">
            {isCreating ? <LoadingSpinner/> : <PlusIcon className="w-5 h-5" />}
            {isCreating ? 'Creating Run...' : 'Create Agent Run'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRunModal;