import React, { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getAPIClient } from '../../../services/codegenApiService';
import { getRepositoryApiService } from '../../../services/repositoryApiService';
import { Play, Upload, X, Image, Code, ChevronDown, ChevronUp } from 'lucide-react';
import { CodegenRepository } from '../../../types';

interface ResumeAgentRunDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agentRunId: number;
  organizationId: number;
  onResumed: () => Promise<void>;
  initialRepositoryId?: number;
}

export const ResumeAgentRunDialog: React.FC<ResumeAgentRunDialogProps> = ({ 
  isOpen, 
  onClose, 
  agentRunId, 
  organizationId, 
  onResumed,
  initialRepositoryId
}) => {
  const [prompt, setPrompt] = useState('');
  const [isResuming, setIsResuming] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showRepositorySelector, setShowRepositorySelector] = useState(false);
  const [repositories, setRepositories] = useState<CodegenRepository[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<CodegenRepository | null>(null);
  const [isLoadingRepositories, setIsLoadingRepositories] = useState(false);
  const [repositorySearchText, setRepositorySearchText] = useState('');
  const [filteredRepositories, setFilteredRepositories] = useState<CodegenRepository[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiClient = getAPIClient();
  const repositoryService = getRepositoryApiService();
  
  // Load repositories and set initial repository if provided
  useEffect(() => {
    if (isOpen) {
      loadRepositories();
    }
  }, [isOpen, organizationId]);
  
  // Load initial repository if provided
  useEffect(() => {
    if (initialRepositoryId && repositories.length > 0) {
      const repo = repositories.find(r => r.id === initialRepositoryId);
      if (repo) {
        setSelectedRepository(repo);
      }
    }
  }, [initialRepositoryId, repositories]);
  
  // Filter repositories based on search text
  useEffect(() => {
    if (!repositorySearchText) {
      setFilteredRepositories(repositories);
      return;
    }
    
    const normalizedSearchText = repositorySearchText.toLowerCase();
    const filtered = repositories.filter(repo => 
      repo.name.toLowerCase().includes(normalizedSearchText) || 
      (repo.description && repo.description.toLowerCase().includes(normalizedSearchText))
    );
    
    setFilteredRepositories(filtered);
  }, [repositorySearchText, repositories]);
  
  // Load repositories
  const loadRepositories = async () => {
    setIsLoadingRepositories(true);
    try {
      const repos = await repositoryService.getRepositories(organizationId.toString());
      setRepositories(repos);
      setFilteredRepositories(repos);
    } catch (error) {
      console.error("Error loading repositories:", error);
      toast.error("Failed to load repositories.");
    } finally {
      setIsLoadingRepositories(false);
    }
  };

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const newImages: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          toast.error(`File "${file.name}" is not an image.`);
          continue;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast.error(`Image "${file.name}" exceeds 5MB size limit.`);
          continue;
        }
        
        const base64Image = await convertFileToBase64(file);
        newImages.push(base64Image);
      }
      
      setImages(prev => [...prev, ...newImages]);
      
      if (newImages.length > 0) {
        toast.success(`${newImages.length} image${newImages.length > 1 ? 's' : ''} uploaded.`);
      }
    } catch (error) {
      toast.error('Failed to upload images.');
      console.error('Image upload error:', error);
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleResume = async () => {
    if (!prompt.trim()) {
      toast.error("A prompt is required to resume the run.");
      return;
    }
    setIsResuming(true);
    try {
      // Prepare metadata with repository context if selected
      const metadata: Record<string, any> = {};
      
      // Add repository context if selected
      if (selectedRepository) {
        metadata.repository_id = selectedRepository.id;
        metadata.repository_name = selectedRepository.name;
        metadata.repository_full_name = selectedRepository.full_name;
        
        // Add additional repository metadata if available
        if (selectedRepository.language) {
          metadata.repository_language = selectedRepository.language;
        }
        if (selectedRepository.default_branch) {
          metadata.repository_default_branch = selectedRepository.default_branch;
        }
      }
      
      // Add parent run reference
      metadata.parent_run_id = agentRunId;
      
      // Add timestamp for tracking
      metadata.resumed_at = new Date().toISOString();
      
      // Add image count if images are present
      if (images.length > 0) {
        metadata.image_count = images.length;
      }
      
      await apiClient.resumeAgentRun(organizationId.toString(), agentRunId, { 
        prompt,
        images: images.length > 0 ? images : undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      });
      toast.success(`Agent run #${agentRunId} resumed successfully.`);
      await onResumed();
      onClose();
    } catch (error) {
      console.error("Error resuming agent run:", error);
      toast.error("Failed to resume agent run. Please try again.");
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
          
          {/* Repository Context Section */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-primary">Repository Context (Optional)</label>
              <button
                type="button"
                onClick={() => setShowRepositorySelector(!showRepositorySelector)}
                className="text-xs px-2 py-1 bg-primary border border-border-color rounded-md hover:bg-tertiary flex items-center gap-1"
              >
                <Code className="w-3 h-3" />
                {showRepositorySelector ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {selectedRepository ? 'Change' : 'Select'} Repository
              </button>
            </div>
            
            {selectedRepository && !showRepositorySelector && (
              <div className="flex items-center gap-2 p-2 bg-primary border border-border-color rounded-md">
                <Code className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">{selectedRepository.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedRepository(null)}
                  className="ml-auto text-danger hover:text-danger-hover"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {showRepositorySelector && (
              <div className="mt-2 border border-border-color rounded-md overflow-hidden">
                <div className="p-2 bg-tertiary">
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={repositorySearchText}
                    onChange={(e) => setRepositorySearchText(e.target.value)}
                    className="w-full p-1 text-sm bg-primary border border-border-color rounded-md"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {isLoadingRepositories ? (
                    <div className="p-4 text-center text-text-secondary">Loading repositories...</div>
                  ) : filteredRepositories.length === 0 ? (
                    <div className="p-4 text-center text-text-secondary">No repositories found</div>
                  ) : (
                    filteredRepositories.map(repo => (
                      <div
                        key={repo.id}
                        onClick={() => {
                          setSelectedRepository(repo);
                          setShowRepositorySelector(false);
                        }}
                        className={`p-2 cursor-pointer hover:bg-tertiary flex items-center gap-2 ${
                          selectedRepository?.id === repo.id ? 'bg-tertiary' : ''
                        }`}
                      >
                        <Code className="w-4 h-4 text-accent" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{repo.name}</div>
                          {repo.description && (
                            <div className="text-xs text-text-secondary truncate">{repo.description}</div>
                          )}
                        </div>
                        {selectedRepository?.id === repo.id && (
                          <div className="text-accent">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 bg-tertiary border-t border-border-color flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRepositorySelector(false)}
                    className="text-xs px-2 py-1 bg-primary border border-border-color rounded-md hover:bg-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Image Upload Section */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-primary">Attach Images (Optional)</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs px-2 py-1 bg-primary border border-border-color rounded-md hover:bg-tertiary flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
            
            {/* Image Preview */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="w-16 h-16 rounded-md overflow-hidden border border-border-color">
                      <img src={image} alt={`Uploaded ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="bg-tertiary px-6 py-4 flex justify-end items-center space-x-4 rounded-b-lg">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-transparent border border-border-color text-text-primary hover:bg-border-color">Cancel</button>
          <button 
            onClick={handleResume} 
            disabled={isResuming || isUploading} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent/80 disabled:bg-gray-500"
          >
            {images.length > 0 ? (
              <Image className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            {isResuming ? "Resuming..." : "Resume Run"}
          </button>
        </div>
      </div>
    </div>
  );
};
