import { LocalStorage } from './storage';
import { showToast, ToastStyle } from './toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  projectId?: number;
  projectName?: string;
}

const STORAGE_KEY = 'notifications';
const PROJECT_NOTIFICATIONS_KEY = 'projectNotifications';

// Load notifications from local storage
export const loadNotifications = async (): Promise<Notification[]> => {
  try {
    const storedNotifications = await LocalStorage.getItem<string>(STORAGE_KEY);
    if (storedNotifications) {
      return JSON.parse(storedNotifications);
    }
    return [];
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
};

// Save notifications to local storage
export const saveNotifications = async (notifications: Notification[]): Promise<boolean> => {
  try {
    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    return true;
  } catch (error) {
    console.error('Error saving notifications:', error);
    return false;
  }
};

// Add a new notification
export const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<boolean> => {
  try {
    const notifications = await loadNotifications();
    
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    const updatedNotifications = [newNotification, ...notifications];
    await saveNotifications(updatedNotifications);
    
    // If this is a project notification, increment the project notification counter
    if (notification.projectId) {
      await incrementProjectNotificationCount(notification.projectId);
    }
    
    // Show a toast notification
    showToast({
      style: notification.type === 'error' ? ToastStyle.Failure : 
             notification.type === 'success' ? ToastStyle.Success : 
             ToastStyle.Information,
      title: notification.title,
      message: notification.message,
    });
    
    return true;
  } catch (error) {
    console.error('Error adding notification:', error);
    return false;
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (id: string): Promise<boolean> => {
  try {
    const notifications = await loadNotifications();
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    
    await saveNotifications(updatedNotifications);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const notifications = await loadNotifications();
    const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
    
    await saveNotifications(updatedNotifications);
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

// Delete a notification
export const deleteNotification = async (id: string): Promise<boolean> => {
  try {
    const notifications = await loadNotifications();
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    
    await saveNotifications(updatedNotifications);
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

// Count unread notifications
export const countUnreadNotifications = async (): Promise<number> => {
  try {
    const notifications = await loadNotifications();
    return notifications.filter(notification => !notification.read).length;
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    return 0;
  }
};

// Project notification counts
export const loadProjectNotificationCounts = async (): Promise<Record<string, number>> => {
  try {
    const storedCounts = await LocalStorage.getItem<string>(PROJECT_NOTIFICATIONS_KEY);
    if (storedCounts) {
      return JSON.parse(storedCounts);
    }
    return {};
  } catch (error) {
    console.error('Error loading project notification counts:', error);
    return {};
  }
};

export const saveProjectNotificationCounts = async (counts: Record<string, number>): Promise<boolean> => {
  try {
    await LocalStorage.setItem(PROJECT_NOTIFICATIONS_KEY, JSON.stringify(counts));
    return true;
  } catch (error) {
    console.error('Error saving project notification counts:', error);
    return false;
  }
};

export const incrementProjectNotificationCount = async (projectId: number): Promise<boolean> => {
  try {
    const counts = await loadProjectNotificationCounts();
    const projectKey = projectId.toString();
    
    counts[projectKey] = (counts[projectKey] || 0) + 1;
    await saveProjectNotificationCounts(counts);
    return true;
  } catch (error) {
    console.error('Error incrementing project notification count:', error);
    return false;
  }
};

export const clearProjectNotificationCount = async (projectId: number): Promise<boolean> => {
  try {
    const counts = await loadProjectNotificationCounts();
    const projectKey = projectId.toString();
    
    if (counts[projectKey]) {
      counts[projectKey] = 0;
      await saveProjectNotificationCounts(counts);
    }
    return true;
  } catch (error) {
    console.error('Error clearing project notification count:', error);
    return false;
  }
};

// Add a notification for project analysis
export const addProjectAnalysisNotification = async (
  projectId: number,
  projectName: string,
  analysisType: string,
  status: 'success' | 'error' | 'info',
  message: string,
  link?: string
): Promise<boolean> => {
  return addNotification({
    title: `${analysisType} Analysis: ${projectName}`,
    message,
    type: status,
    link,
    projectId,
    projectName,
  });
};
