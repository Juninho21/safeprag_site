import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

export const NotificationToast: React.FC = () => {
  const { notifications } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`mb-2 p-4 rounded-lg shadow-lg text-white ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
};
