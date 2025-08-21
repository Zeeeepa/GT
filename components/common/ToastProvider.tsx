import React, { useEffect, useState } from 'react';
import Toast, { ToastContainer } from './Toast';
import { subscribeToToasts, removeToast } from '../../utils/toast';

interface ToastItem {
  id: string;
  message: string;
  style: any;
  duration?: number;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    // Subscribe to toast changes
    const unsubscribe = subscribeToToasts((newToasts) => {
      setToasts(newToasts);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleCloseToast = (id: string) => {
    removeToast(id);
  };

  return (
    <>
      {children}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            style={toast.style}
            duration={toast.duration}
            onClose={handleCloseToast}
          />
        ))}
      </ToastContainer>
    </>
  );
};

export default ToastProvider;
