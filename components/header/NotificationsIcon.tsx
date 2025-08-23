import React, { useState, useEffect } from 'react';
import { BellIcon } from 'lucide-react';
import { LocalStorage } from '../../utils/storage';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

const STORAGE_KEY = 'notifications';

export const NotificationsIcon: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Load notifications from local storage
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const storedNotifications = await LocalStorage.getItem<string>(STORAGE_KEY);
        if (storedNotifications) {
          setNotifications(JSON.parse(storedNotifications));
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    
    loadNotifications();
  }, []);
  
  // Save notifications to local storage
  const saveNotifications = async (updatedNotifications: Notification[]) => {
    try {
      await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };
  
  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    const updatedNotifications = [newNotification, ...notifications];
    saveNotifications(updatedNotifications);
  };
  
  // Mark a notification as read
  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    
    saveNotifications(updatedNotifications);
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
    saveNotifications(updatedNotifications);
  };
  
  // Delete a notification
  const deleteNotification = (id: string) => {
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    saveNotifications(updatedNotifications);
  };
  
  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-tertiary"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5 text-text-primary" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-danger rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-secondary border border-border-color rounded-md shadow-lg z-50">
          <div className="p-3 border-b border-border-color flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-text-secondary hover:text-text-primary"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-text-secondary">
                No notifications
              </div>
            ) : (
              <ul>
                {notifications.map(notification => (
                  <li 
                    key={notification.id} 
                    className={`p-3 border-b border-border-color hover:bg-tertiary ${!notification.read ? 'bg-primary/50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-xs text-text-secondary mt-1">{notification.message}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-text-secondary">
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                          <div className="flex gap-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-text-secondary hover:text-text-primary"
                              >
                                Mark as read
                              </button>
                            )}
                            {notification.link && (
                              <a
                                href={notification.link}
                                className="text-xs text-blue-400 hover:text-blue-500"
                              >
                                View
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="ml-2 text-text-secondary hover:text-danger"
                        aria-label="Delete notification"
                      >
                        &times;
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Export a function to add notifications from other components
export const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  try {
    const storedNotifications = await LocalStorage.getItem<string>(STORAGE_KEY);
    let notifications: Notification[] = [];
    
    if (storedNotifications) {
      notifications = JSON.parse(storedNotifications);
    }
    
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    const updatedNotifications = [newNotification, ...notifications];
    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications));
    
    return true;
  } catch (error) {
    console.error('Error adding notification:', error);
    return false;
  }
};

export default NotificationsIcon;
