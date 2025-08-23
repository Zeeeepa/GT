import React, { useState, useEffect } from 'react';
import { BellIcon } from 'lucide-react';
import { 
  loadNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification,
  countUnreadNotifications,
  Notification
} from '../../utils/notificationSystem';

export const NotificationsIcon: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Load notifications from notification system
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifs = await loadNotifications();
        setNotifications(notifs);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    
    fetchNotifications();
    
    // Set up an interval to refresh notifications every 30 seconds
    const intervalId = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Mark a notification as read
  const markAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    // Refresh the notifications list
    const notifs = await loadNotifications();
    setNotifications(notifs);
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    await markAllNotificationsAsRead();
    // Refresh the notifications list
    const notifs = await loadNotifications();
    setNotifications(notifs);
  };
  
  // Delete a notification
  const handleDeleteNotification = async (id: string) => {
    await deleteNotification(id);
    // Refresh the notifications list
    const notifs = await loadNotifications();
    setNotifications(notifs);
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
                        onClick={() => handleDeleteNotification(notification.id)}
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

// Re-export the addNotification function from the notification system
export { addNotification } from '../../utils/notificationSystem';

export default NotificationsIcon;
