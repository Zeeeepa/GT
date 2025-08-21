import React, { useEffect, useState } from 'react';

export enum ToastStyle {
  Success = "success",
  Error = "error",
  Warning = "warning",
}

export interface ToastProps {
  id: string;
  message: string;
  style: ToastStyle;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, style, duration = 4000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose(id), 300); // Allow time for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (style) {
      case ToastStyle.Success:
        return (
          <svg className="toast-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM11.4 6.4L7.6 10.2C7.5 10.3 7.3 10.4 7.2 10.4C7.1 10.4 6.9 10.3 6.8 10.2L4.6 8C4.4 7.8 4.4 7.4 4.6 7.2C4.8 7 5.2 7 5.4 7.2L7.2 9L10.6 5.6C10.8 5.4 11.2 5.4 11.4 5.6C11.6 5.8 11.6 6.2 11.4 6.4Z" fill="currentColor"/>
          </svg>
        );
      case ToastStyle.Error:
        return (
          <svg className="toast-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM11.4 10.6C11.6 10.8 11.6 11.2 11.4 11.4C11.2 11.6 10.8 11.6 10.6 11.4L8 8.8L5.4 11.4C5.2 11.6 4.8 11.6 4.6 11.4C4.4 11.2 4.4 10.8 4.6 10.6L7.2 8L4.6 5.4C4.4 5.2 4.4 4.8 4.6 4.6C4.8 4.4 5.2 4.4 5.4 4.6L8 7.2L10.6 4.6C10.8 4.4 11.2 4.4 11.4 4.6C11.6 4.8 11.6 5.2 11.4 5.4L8.8 8L11.4 10.6Z" fill="currentColor"/>
          </svg>
        );
      case ToastStyle.Warning:
        return (
          <svg className="toast-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM8 12C7.4 12 7 11.6 7 11C7 10.4 7.4 10 8 10C8.6 10 9 10.4 9 11C9 11.6 8.6 12 8 12ZM9 9H7V4H9V9Z" fill="currentColor"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={`toast toast-${style} ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ transition: 'opacity 0.3s ease-out' }}
    >
      {getIcon()}
      <div className="toast-message">{message}</div>
    </div>
  );
};

export interface ToastContainerProps {
  children: React.ReactNode;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => {
  return (
    <div className="toast-container">
      {children}
    </div>
  );
};

export default Toast;
