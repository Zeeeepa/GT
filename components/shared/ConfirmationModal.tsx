import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ConfirmationModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'success' | 'primary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen = true,
  onClose, 
  onConfirm, 
  onCancel,
  title, 
  message, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass,
  isLoading = false,
  variant = 'danger'
}) => {
  if (isOpen === false) return null;

  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  const getVariantClass = () => {
    if (confirmButtonClass) return confirmButtonClass;
    
    switch (variant) {
      case 'success':
        return 'bg-success text-white hover:bg-success/80';
      case 'primary':
        return 'bg-accent text-white hover:bg-accent-hover';
      case 'danger':
      default:
        return 'bg-danger text-white hover:bg-danger/80';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={handleCancel}>
      <div className="bg-secondary rounded-lg shadow-2xl border border-border-color w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">{title}</h2>
          <p className="text-text-secondary mb-6">{message}</p>
        </div>
        <div className="bg-tertiary px-6 py-4 flex justify-end items-center space-x-4 rounded-b-lg">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-md bg-transparent border border-border-color text-text-primary hover:bg-border-color transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md transition-colors font-semibold inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed ${getVariantClass()}`}
          >
            {isLoading && <LoadingSpinner />}
            {isLoading ? 'Loading...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
