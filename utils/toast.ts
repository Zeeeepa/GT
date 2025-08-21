import { ToastStyle as ComponentToastStyle } from '../components/common/Toast';

// Re-export the ToastStyle enum from the component for backward compatibility
export enum ToastStyle {
  Success = "success",
  Failure = "error", // Map Failure to Error for the new component
  Warning = "warning",
}

export interface ToastOptions {
  style?: ToastStyle;
  title: string;
  message?: string;
  duration?: number;
}

// Global state for toasts
type ToastItem = {
  id: string;
  message: string;
  style: ComponentToastStyle;
  duration?: number;
};

let toasts: ToastItem[] = [];
let toastListeners: ((toasts: ToastItem[]) => void)[] = [];

// Function to add a toast
export function showToast(options: ToastOptions): void {
  const { style = ToastStyle.Success, title, message, duration = 4000 } = options;
  const fullMessage = message ? `${title}\n${message}` : title;
  
  // Map the old style to the new component style
  let componentStyle: ComponentToastStyle;
  switch (style) {
    case ToastStyle.Success:
      componentStyle = ComponentToastStyle.Success;
      break;
    case ToastStyle.Failure:
      componentStyle = ComponentToastStyle.Error;
      break;
    case ToastStyle.Warning:
      componentStyle = ComponentToastStyle.Warning;
      break;
    default:
      componentStyle = ComponentToastStyle.Success;
  }

  const id = Date.now().toString();
  const newToast: ToastItem = {
    id,
    message: fullMessage,
    style: componentStyle,
    duration,
  };

  toasts = [...toasts, newToast];
  notifyListeners();

  // Auto-remove toast after duration
  setTimeout(() => {
    removeToast(id);
  }, duration);
}

// Function to remove a toast
export function removeToast(id: string): void {
  toasts = toasts.filter(toast => toast.id !== id);
  notifyListeners();
}

// Function to subscribe to toast changes
export function subscribeToToasts(listener: (toasts: ToastItem[]) => void): () => void {
  toastListeners.push(listener);
  
  // Immediately notify the new listener of current toasts
  listener(toasts);
  
  // Return unsubscribe function
  return () => {
    toastListeners = toastListeners.filter(l => l !== listener);
  };
}

// Function to notify all listeners of toast changes
function notifyListeners(): void {
  toastListeners.forEach(listener => listener(toasts));
}

// Export the toast state for components to use
export function getToasts(): ToastItem[] {
  return toasts;
}
