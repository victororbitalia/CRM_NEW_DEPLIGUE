import { useCallback } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

export function useNotifications() {
  const { notify, addNotification, removeNotification, clearNotifications } = useNotification();

  // Success notifications
  const showSuccess = useCallback(
    (message: string, title?: string, duration?: number) => {
      return notify.success(message, title, duration);
    },
    [notify]
  );

  // Error notifications
  const showError = useCallback(
    (message: string, title?: string, duration?: number) => {
      return notify.error(message, title, duration);
    },
    [notify]
  );

  // Warning notifications
  const showWarning = useCallback(
    (message: string, title?: string, duration?: number) => {
      return notify.warning(message, title, duration);
    },
    [notify]
  );

  // Info notifications
  const showInfo = useCallback(
    (message: string, title?: string, duration?: number) => {
      return notify.info(message, title, duration);
    },
    [notify]
  );

  // Custom notification with action
  const showAction = useCallback(
    (
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
    },
    [addNotification]
  );

  // Persistent notification (no auto-dismiss)
  const showPersistent = useCallback(
    (
      message: string,
      options?: {
        title?: string;
        variant?: 'info' | 'success' | 'warning' | 'error';
      }
    ) => {
      return addNotification({
        message,
        ...options,
        duration: 0, // No auto-dismiss
      });
    },
    [addNotification]
  );

  // API response notifications
  const handleApiResponse = useCallback(
    (
      response: {
        success: boolean;
        message?: string;
        error?: string;
      },
      successMessage?: string,
      errorMessage?: string
    ) => {
      if (response.success) {
        showSuccess(successMessage || response.message || 'Operación completada con éxito');
      } else {
        showError(errorMessage || response.error || 'Ha ocurrido un error');
      }
    },
    [showSuccess, showError]
  );

  // Form validation notifications
  const showValidationErrors = useCallback(
    (errors: Record<string, string>) => {
      const errorMessages = Object.values(errors);
      if (errorMessages.length > 0) {
        showError(errorMessages[0], 'Error de validación');
      }
    },
    [showError]
  );

  // Async operation notifications
  const showAsyncOperation = useCallback(
    async (
      operation: () => Promise<any>,
      options?: {
        loadingMessage?: string;
        successMessage?: string;
        errorMessage?: string;
        showLoading?: boolean;
      }
    ) => {
      const {
        loadingMessage = 'Procesando...',
        successMessage = 'Operación completada con éxito',
        errorMessage = 'Ha ocurrido un error',
        showLoading = true,
      } = options || {};

      let loadingId: string | undefined;

      if (showLoading) {
        loadingId = showInfo(loadingMessage, undefined, 0); // Persistent loading notification
      }

      try {
        const result = await operation();
        if (loadingId) {
          removeNotification(loadingId);
        }
        showSuccess(successMessage);
        return result;
      } catch (error) {
        if (loadingId) {
          removeNotification(loadingId);
        }
        showError(errorMessage);
        throw error;
      }
    },
    [showInfo, showSuccess, showError, removeNotification]
  );

  return {
    // Basic notifications
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Advanced notifications
    showAction,
    showPersistent,
    
    // Utility functions
    handleApiResponse,
    showValidationErrors,
    showAsyncOperation,
    
    // Control functions
    removeNotification,
    clearNotifications,
  };
}

export default useNotifications;