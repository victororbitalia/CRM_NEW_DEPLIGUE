'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Notification {
  id: string;
  title?: string;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  notify: {
    info: (message: string, title?: string, duration?: number) => string;
    success: (message: string, title?: string, duration?: number) => string;
    warning: (message: string, title?: string, duration?: number) => string;
    error: (message: string, title?: string, duration?: number) => string;
  };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function NotificationProvider({
  children,
  maxNotifications = 5,
  position = 'top-right',
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = () => {
    return `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = generateId();
      const newNotification: Notification = {
        ...notification,
        id,
        duration: notification.duration ?? 5000,
      };

      setNotifications((prev) => {
        const updated = [...prev, newNotification];
        // Limit the number of notifications
        if (updated.length > maxNotifications) {
          return updated.slice(-maxNotifications);
        }
        return updated;
      });

      return id;
    },
    [maxNotifications]
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const notify = {
    info: (message: string, title?: string, duration?: number) =>
      addNotification({ message, title, variant: 'info', duration }),
    success: (message: string, title?: string, duration?: number) =>
      addNotification({ message, title, variant: 'success', duration }),
    warning: (message: string, title?: string, duration?: number) =>
      addNotification({ message, title, variant: 'warning', duration }),
    error: (message: string, title?: string, duration?: number) =>
      addNotification({ message, title, variant: 'error', duration }),
  };

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    notify,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Higher-order component for easy integration
export function withNotification<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    return (
      <NotificationProvider>
        <Component {...props} />
      </NotificationProvider>
    );
  };
}

// Hook for creating notification actions
export function useNotificationActions() {
  const { addNotification } = useNotification();

  const createAction = (
    message: string,
    action: {
      label: string;
      onClick: () => void;
    },
    options?: {
      title?: string;
      variant?: 'info' | 'success' | 'warning' | 'error';
      duration?: number;
    }
  ) => {
    return addNotification({
      message,
      ...options,
      action,
    });
  };

  return { createAction };
}

export default NotificationContext;