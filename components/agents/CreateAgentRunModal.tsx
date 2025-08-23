import React, { useMemo, useState } from 'react';
import { useCreateAgentRun, useRepositories } from '../../hooks/codegen_api';
import { AgentRun, CreateAgentRunRequest } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';
import { XIcon } from '../shared/icons/XIcon';
import { UploadIcon } from '../shared/icons/UploadIcon';
import { TrashIcon } from '../shared/icons/TrashIcon';

interface CreateAgentRunModalProps {
  onClose: () => void;
  onSuccess: (agentRun: AgentRun) => void;
}

const CreateAgentRunModal: React.FC<CreateAgentRunModalProps> = ({ onClose, onSuccess }) => {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [metadataJson, setMetadataJson] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const { execute: createRun, loading, error } = useCreateAgentRun();
  const { data: repositories } = useRepositories();
  const [showRepoBrowser, setShowRepoBrowser] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const [repoPage, setRepoPage] = useState(0);
  const repoPageSize = 20;

  const filteredRepos = useMemo(() => {
    const list = repositories || [];
    if (!repoSearch.trim()) return list;
    const q = repoSearch.trim().toLowerCase();
    return list.filter(r => (r.full_name || r.name).toLowerCase().includes(q));
  }, [repositories, repoSearch]);

  const totalRepoPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRepos.length / repoPageSize));
  }, [filteredRepos.length]);

  const pageRepos = useMemo(() => {
    const start = repoPage * repoPageSize;
    return filteredRepos.slice(start, start + repoPageSize);
  }, [filteredRepos, repoPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;

    let parsedMetadata = {};
    if (metadataJson.trim()) {
      try {
        parsedMetadata = JSON.parse(metadataJson);
      } catch (err) {
        alert('Invalid JSON in metadata field');
        return;
      }
    }

    const data: CreateAgentRunRequest = {
      prompt: prompt.trim(),
      images: images.length > 0 ? images : undefined,
      metadata: Object.keys(parsedMetadata).length > 0 ? parsedMetadata : undefined
    };

    const result = await createRun(data);
    if (result) {
      onSuccess(result);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    processImageFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files) as File[];
    const imageFiles = files.filter(file => typeof file.type === 'string' && file.type.startsWith('image/'));
    processImageFiles(imageFiles);
  };

  const processImageFiles = (files: File[]) => {
    if (images.length + files.length > 10) {
      alert('Maximum 10 images allowed');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setImages(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const insertPromptTemplate = (template: string) => {
    setPrompt(prev => prev + (prev ? '\n\n' : '') + template);
  };

  const promptTemplates = [
    {
      name: 'Bug Fix',
      template: 'Fix the following bug:\n\n[Describe the bug and provide relevant code or error messages]'
    },
    {
      name: 'Feature Implementation',
      template: 'Implement the following feature:\n\n[Describe the feature requirements and expected behavior]'
    },
    {
      name: 'Code Review',
      template: 'Review this code and suggest improvements:\n\n[Paste the code to be reviewed]'
    },
    {
      name: 'Documentation',
      template: 'Generate documentation for:\n\n[Specify what needs documentation]'
    },
    {
      name: 'Testing',
      template: 'Create tests for:\n\n[Describe what needs to be tested]'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-secondary rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-color">
          <h2 className="text-xl font-semibold text-text-primary">Create New Agent Run</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Prompt Templates */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {promptTemplates.map((template) => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => insertPromptTemplate(template.template)}
                  className="px-3 py-1 text-xs bg-accent hover:bg-accent-hover text-white rounded-full transition-colors"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-text-primary mb-2">
              Prompt <span className="text-red-500">*</span>
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want the agent to do..."
              className="w-full h-32 p-3 bg-primary border border-border-color rounded-lg text-text-primary placeholder-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              required
            />
            <p className="text-xs text-text-secondary mt-1">
              {prompt.length}/50,000 characters
            </p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Images (Optional)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver 
                  ? 'border-accent bg-accent bg-opacity-10' 
                  : 'border-border-color hover:border-accent'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <UploadIcon className="w-8 h-8 text-text-secondary mx-auto mb-2" />
              <p className="text-text-secondary mb-2">
                Drag and drop images here, or{' '}
                <label className="text-accent hover:text-accent-hover cursor-pointer">
                  browse
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-text-secondary">
                Maximum 10 images, PNG, JPG, GIF supported
              </p>
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-border-color"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div>
            <label htmlFor="metadata" className="block text-sm font-medium text-text-primary mb-2">
              Metadata (Optional JSON)
            </label>
            <textarea
              id="metadata"
              value={metadataJson}
              onChange={(e) => setMetadataJson(e.target.value)}
              placeholder='{"key": "value", "priority": "high"}'
              className="w-full h-20 p-3 bg-primary border border-border-color rounded-lg text-text-primary placeholder-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent font-mono text-sm"
            />
            <p className="text-xs text-text-secondary mt-1">
              Optional JSON metadata to include with the run
            </p>
          </div>

          {/* Repository Context */}
          {repositories && repositories.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-text-primary">
                  Repository Context
                </label>
                <button
                  type="button"
                  onClick={() => setShowRepoBrowser(v => !v)}
                  className="text-xs px-3 py-1 rounded bg-tertiary text-text-secondary hover:text-text-primary"
                >
                  {showRepoBrowser ? 'Hide' : 'Browse'} ({repositories.length})
                </button>
              </div>

              {!showRepoBrowser ? (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {repositories.slice(0, 5).map((repo) => (
                    <div key={repo.id} className="text-xs text-text-secondary bg-primary p-2 rounded border border-border-color">
                      {repo.full_name}
                    </div>
                  ))}
                  {repositories.length > 5 && (
                    <p className="text-xs text-text-secondary">
                      +{repositories.length - 5} more repositories
                    </p>
                  )}
                </div>
              ) : (
                <div className="border border-border-color rounded-lg p-3 bg-primary">
                  <div className="flex flex-col sm:flex-row gap-3 mb-3">
                    <input
                      type="text"
                      value={repoSearch}
                      onChange={(e) => { setRepoSearch(e.target.value); setRepoPage(0); }}
                      placeholder="Search repositories..."
                      className="flex-1 px-3 py-2 rounded bg-secondary border border-border-color text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <div className="text-xs text-text-secondary self-center">
                      {filteredRepos.length} results
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-border-color rounded bg-primary">
                    {pageRepos.map((repo) => (
                      <div key={repo.id} className="py-2 px-2 text-sm text-text-primary flex items-center justify-between">
                        <span className="truncate">
                          {repo.full_name}
                        </span>
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-accent hover:text-accent-hover ml-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open
                        </a>
                      </div>
                    ))}
                    {pageRepos.length === 0 && (
                      <div className="py-6 text-center text-text-secondary text-sm">No repositories match your search</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <button
                      type="button"
                      onClick={() => setRepoPage(p => Math.max(0, p - 1))}
                      disabled={repoPage === 0}
                      className="px-3 py-2 text-xs rounded bg-secondary border border-border-color text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="text-xs text-text-secondary">
                      Page {repoPage + 1} of {totalRepoPages}
                    </div>
                    <button
                      type="button"
                      onClick={() => setRepoPage(p => Math.min(totalRepoPages - 1, p + 1))}
                      disabled={repoPage >= totalRepoPages - 1}
                      className="px-3 py-2 text-xs rounded bg-secondary border border-border-color text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border-color">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="inline-flex items-center px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              {loading ? 'Creating...' : 'Create Agent Run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAgentRunModal;
