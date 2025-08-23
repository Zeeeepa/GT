import React from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { getUnseenCount, clearUnseen } from '../../utils/notifications';

interface NotificationsIconProps {
  className?: string;
}

const NotificationsIcon: React.FC<NotificationsIconProps> = ({ className = '' }) => {
  const [count, setCount] = React.useState(0);
  
  // Update count when component mounts and periodically
  React.useEffect(() => {
    const updateCount = () => {
      setCount(getUnseenCount());
    };
    
    updateCount();
    const interval = setInterval(updateCount, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleClick = () => {
    clearUnseen();
    setCount(0);
  };
  
  return (
    <div className={`relative ${className}`} onClick={handleClick}>
      <button className="p-2 rounded-full hover:bg-hover transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>
      
      {count > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-danger text-white text-xs">
          {count}
        </span>
      )}
    </div>
  );
};

export default NotificationsIcon;

