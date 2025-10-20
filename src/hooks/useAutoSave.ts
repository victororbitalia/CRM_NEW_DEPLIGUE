import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { handleApiError } from '@/lib/validation';

interface AutoSaveOptions {
  debounceMs?: number;
  onSave?: (data: any) => Promise<void>;
  onError?: (error: string) => void;
  onSuccess?: () => void;
  enabled?: boolean;
}

interface AutoSaveReturn<T> {
  data: T;
  setData: (data: T | ((prev: T) => T)) => void;
  save: () => Promise<void>;
  isSaving: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  reset: () => void;
}

export function useAutoSave<T extends Record<string, any>>(
  initialData: T,
  saveFunction: (data: T) => Promise<void>,
  options: AutoSaveOptions = {}
): AutoSaveReturn<T> {
  const {
    debounceMs = 1000,
    onSave,
    onError,
    onSuccess,
    enabled = true,
  } = options;

  const [data, setDataState] = useState<T>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const { showError, showSuccess } = useNotifications();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialDataRef = useRef<T>(initialData);

  // Update initial data ref when it changes
  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const setData = useCallback((newData: T | ((prev: T) => T)) => {
    setDataState(prevData => {
      const updatedData = typeof newData === 'function' 
        ? (newData as (prev: T) => T)(prevData)
        : newData;
      
      // Check if data has changed from initial
      const hasChanged = JSON.stringify(updatedData) !== JSON.stringify(initialDataRef.current);
      setIsDirty(hasChanged);
      
      return updatedData;
    });
  }, []);

  const save = useCallback(async () => {
    if (!enabled || !isDirty || isSaving) {
      return;
    }

    setIsSaving(true);
    
    try {
      // Call the custom save function if provided
      if (onSave) {
        await onSave(data);
      } else {
        // Call the default save function
        await saveFunction(data);
      }
      
      setIsDirty(false);
      setLastSaved(new Date());
      
      // Update initial data reference
      initialDataRef.current = { ...data };
      
      if (onSuccess) {
        onSuccess();
      } else {
        showSuccess('Cambios guardados automáticamente');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      
      if (onError) {
        onError(errorMessage);
      } else {
        showError(`Error al guardar: ${errorMessage}`);
      }
    } finally {
      setIsSaving(false);
    }
  }, [data, enabled, isDirty, isSaving, saveFunction, onSave, onError, onSuccess, showError, showSuccess]);

  // Auto-save with debounce
  useEffect(() => {
    if (!enabled || !isDirty || isSaving) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, enabled, isDirty, isSaving, save, debounceMs]);

  const reset = useCallback(() => {
    setDataState(initialDataRef.current);
    setIsDirty(false);
    setLastSaved(null);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  return {
    data,
    setData,
    save,
    isSaving,
    isDirty,
    lastSaved,
    reset,
  };
}

// Hook for form auto-save with validation
export function useFormAutoSave<T extends Record<string, any>>(
  initialData: T,
  saveFunction: (data: T) => Promise<void>,
  validateFunction?: (data: T) => { isValid: boolean; errors: Record<string, string> },
  options: AutoSaveOptions = {}
) {
  const autoSave = useAutoSave(initialData, saveFunction, options);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setDataWithValidation = useCallback((newData: T | ((prev: T) => T)) => {
    const updatedData = typeof newData === 'function' 
      ? (newData as (prev: T) => T)(autoSave.data)
      : newData;
    
    // Validate if validation function is provided
    if (validateFunction) {
      const validation = validateFunction(updatedData);
      setErrors(validation.errors);
      
      // Only set data if valid
      if (validation.isValid) {
        autoSave.setData(updatedData);
      }
    } else {
      autoSave.setData(updatedData);
    }
  }, [autoSave.data, validateFunction, autoSave]);

  const saveWithValidation = useCallback(async () => {
    // Validate before saving
    if (validateFunction) {
      const validation = validateFunction(autoSave.data);
      setErrors(validation.errors);
      
      if (!validation.isValid) {
        return;
      }
    }
    
    await autoSave.save();
  }, [autoSave.data, validateFunction, autoSave]);

  return {
    ...autoSave,
    setData: setDataWithValidation,
    save: saveWithValidation,
    errors,
    hasErrors: Object.keys(errors).length > 0,
  };
}

// Hook for batch auto-save (for multiple forms)
export function useBatchAutoSave<T extends Record<string, any>>(
  items: Array<{ id: string; data: T; saveFunction: (data: T) => Promise<void> }>,
  options: AutoSaveOptions = {}
) {
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const [dirtyItems, setDirtyItems] = useState<Set<string>>(new Set());
  const [lastSavedItems, setLastSavedItems] = useState<Record<string, Date>>({});
  
  const { showError, showSuccess } = useNotifications();

  const updateItem = useCallback((id: string, newData: T) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Update the item's data
    item.data = newData;
    
    // Mark as dirty
    setDirtyItems(prev => new Set(prev).add(id));
  }, [items]);

  const saveItem = useCallback(async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || !dirtyItems.has(id)) return;

    setSavingItems(prev => new Set(prev).add(id));
    
    try {
      await item.saveFunction(item.data);
      
      setDirtyItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      
      setLastSavedItems(prev => ({
        ...prev,
        [id]: new Date(),
      }));
      
      if (options.onSuccess) {
        options.onSuccess();
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      
      if (options.onError) {
        options.onError(errorMessage);
      } else {
        showError(`Error al guardar ${id}: ${errorMessage}`);
      }
    } finally {
      setSavingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [items, dirtyItems, options, showError]);

  const saveAll = useCallback(async () => {
    const promises = Array.from(dirtyItems).map(id => saveItem(id));
    await Promise.all(promises);
    
    if (options.onSuccess) {
      options.onSuccess();
    } else {
      showSuccess('Todos los cambios han sido guardados');
    }
  }, [dirtyItems, saveItem, options, showSuccess]);

  const resetItem = useCallback((id: string) => {
    setDirtyItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    
    setLastSavedItems(prev => {
      const newSaved = { ...prev };
      delete newSaved[id];
      return newSaved;
    });
  }, []);

  const resetAll = useCallback(() => {
    setDirtyItems(new Set());
    setLastSavedItems({});
  }, []);

  return {
    updateItem,
    saveItem,
    saveAll,
    resetItem,
    resetAll,
    isSaving: (id: string) => savingItems.has(id),
    isDirty: (id: string) => dirtyItems.has(id),
    hasDirtyItems: dirtyItems.size > 0,
    lastSaved: (id: string) => lastSavedItems[id] || null,
    dirtyItemsCount: dirtyItems.size,
  };
}