import React, { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getAPIClient } from '../../../services/codegenApiService';
import { Play, Upload, X, Image } from 'lucide-react';

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
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiClient = getAPIClient();

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
      await apiClient.resumeAgentRun(organizationId.toString(), agentRunId, { 
        prompt,
        images: images.length > 0 ? images : undefined
      });
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
