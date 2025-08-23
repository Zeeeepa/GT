import React, { useState, useEffect } from 'react';
import { ProjectRepository } from '../../types';
import { XIcon } from '../shared/icons/XIcon';

interface ProjectPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: ProjectRepository | null;
  title?: string;
  initialPrompt?: string;
  onSubmit: (prompt: string) => Promise<void> | void;
}

const ProjectPromptModal: React.FC<ProjectPromptModalProps> = ({ isOpen, onClose, repo, title = 'Send Message to Codegen', initialPrompt = '', onSubmit }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt || '');
    }
  }, [isOpen, initialPrompt]);

  if (!isOpen || !repo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setSubmitting(true);
    try {
      // Add project context to the prompt
      const contextualPrompt = `The project is '${repo.full_name}'. ${prompt.trim()}`;
      await onSubmit(contextualPrompt);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-secondary rounded-lg w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Repository</label>
            <div className="text-sm text-text-secondary bg-primary border border-border-color rounded px-3 py-2">
              {repo.full_name}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt((e.target as HTMLTextAreaElement).value)}
              rows={6}
              className="w-full bg-primary border border-border-color rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Describe your request or question for this project..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border-color">
            <button type="button" onClick={onClose} className="px-4 py-2 text-text-secondary hover:text-text-primary">Cancel</button>
            <button type="submit" disabled={submitting || !prompt.trim()} className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/80 disabled:opacity-50">
              {submitting ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectPromptModal;
