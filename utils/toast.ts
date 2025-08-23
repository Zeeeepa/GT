import toast from 'react-hot-toast';

export enum ToastStyle {
  Success = "success",
  Failure = "failure",
  Warning = "warning",
}

export interface ToastOptions {
  style?: ToastStyle;
  title: string;
  message?: string;
  duration?: number;
}

export function showToast(options: ToastOptions): void {
  const { style = ToastStyle.Success, title, message, duration = 4000 } = options;
  const fullMessage = message ? `${title}\n${message}` : title;

  switch (style) {
    case ToastStyle.Success:
      toast.success(fullMessage, { duration });
      break;
    case ToastStyle.Failure:
      toast.error(fullMessage, { duration });
      break;
    case ToastStyle.Warning:
      toast(fullMessage, { duration, icon: '⚠️' });
      break;
    default:
      toast(fullMessage, { duration });
  }
}
