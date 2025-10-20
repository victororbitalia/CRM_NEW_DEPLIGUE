'use client';

import React from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { ToastContainer } from './Toast';

interface NotificationSystemProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
}

export default function NotificationSystem({
  position = 'top-right',
  className,
}: NotificationSystemProps) {
  const { notifications, removeNotification } = useNotification();

  return (
    <ToastContainer
      toasts={notifications.map(notification => ({
        ...notification,
        onClose: removeNotification,
      }))}
      onClose={removeNotification}
      position={position}
      className={className}
    />
  );
}