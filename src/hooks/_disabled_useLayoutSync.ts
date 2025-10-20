import { useCallback, useRef, useEffect } from 'react';
import { useNotifications } from './useNotifications';
import { Table } from './useTables';
import { Area } from '@/types';

interface SyncOptions {
  autoSave?: boolean;
  autoSaveDelay?: number;
  enableOptimisticUpdates?: boolean;
  rollbackOnError?: boolean;
}

interface PendingChanges {
  tableId: string;
  changes: Partial<{
    positionX: number;
    positionY: number;
    width: number;
    height: number;
  }>;
  timestamp: number;
  originalState?: Partial<Table>;
}

export const useLayoutSync = (
  updateTablePosition: (tableId: string, positionX: number, positionY: number) => Promise<boolean>,
  updateTable: (tableData: any) => Promise<Table | null>,
  options: SyncOptions = {}
) => {
  const {
    autoSave = true,
    autoSaveDelay = 0,
    enableOptimisticUpdates = true,
    rollbackOnError = true,
  } = options;

  const { showSuccess, showError } = useNotifications();
  const pendingChanges = useRef<Map<string, PendingChanges>>(new Map());
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const originalStates = useRef<Map<string, Partial<Table>>>(new Map());

  // Guardar estado original para rollback
  const saveOriginalState = useCallback((table: Table) => {
    if (!originalStates.current.has(table.id)) {
      originalStates.current.set(table.id, {
        positionX: table.positionX,
        positionY: table.positionY,
        width: table.width,
        height: table.height,
      });
    }
  }, []);

  // Actualizar posición con optimistic update
  const updatePositionOptimistic = useCallback(async (
    tableId: string,
    positionX: number,
    positionY: number,
    originalTable?: Table
  ) => {
    if (originalTable) {
      saveOriginalState(originalTable);
    }

    // Guardar cambios pendientes
    pendingChanges.current.set(tableId, {
      tableId,
      changes: { positionX, positionY },
      timestamp: Date.now(),
      originalState: originalStates.current.get(tableId),
    });

    // Auto-guardado
    if (autoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('DEBUG: useLayoutSync - saving position', { tableId, positionX, positionY });
          const success = await updateTablePosition(tableId, positionX, positionY);
          
          if (success) {
            pendingChanges.current.delete(tableId);
            originalStates.current.delete(tableId);
            console.log('DEBUG: useLayoutSync - position saved successfully', { tableId });
            showSuccess('Posición de mesa guardada correctamente');
          } else if (rollbackOnError) {
            // Rollback en caso de error
            const originalState = originalStates.current.get(tableId);
            if (originalState) {
              console.log('DEBUG: useLayoutSync - rolling back position', { tableId, originalState });
              await updateTable({
                id: tableId,
                positionX: originalState.positionX,
                positionY: originalState.positionY,
              });
              showError('Error al guardar la posición. Se ha restaurado la posición original');
            }
          }
        } catch (error) {
          console.error('Error al guardar posición:', error);
          
          if (rollbackOnError) {
            const originalState = originalStates.current.get(tableId);
            if (originalState) {
              console.log('DEBUG: useLayoutSync - rolling back position due to error', { tableId, originalState });
              await updateTable({
                id: tableId,
                positionX: originalState.positionX,
                positionY: originalState.positionY,
              });
              showError('Error de conexión. Se ha restaurado la posición original');
            } else {
              showError('Error de conexión al guardar la posición');
            }
          } else {
            showError('Error de conexión al guardar la posición');
          }
        }
      }, autoSaveDelay);
    }

    return true;
  }, [autoSave, autoSaveDelay, updateTablePosition, updateTable, saveOriginalState, showSuccess, showError, rollbackOnError]);

  // Actualizar tamaño con optimistic update
  const updateSizeOptimistic = useCallback(async (
    tableId: string,
    width: number,
    height: number,
    originalTable?: Table
  ) => {
    if (originalTable) {
      saveOriginalState(originalTable);
    }

    // Guardar cambios pendientes
    pendingChanges.current.set(tableId, {
      tableId,
      changes: { width, height },
      timestamp: Date.now(),
      originalState: originalStates.current.get(tableId),
    });

    // Auto-guardado
    if (autoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          const success = await updateTable({
            id: tableId,
            width,
            height,
          });
          
          if (success) {
            pendingChanges.current.delete(tableId);
            originalStates.current.delete(tableId);
            showSuccess('Tamaño de mesa guardado correctamente');
          } else if (rollbackOnError) {
            // Rollback en caso de error
            const originalState = originalStates.current.get(tableId);
            if (originalState) {
              await updateTable({
                id: tableId,
                width: originalState.width,
                height: originalState.height,
              });
              showError('Error al guardar el tamaño. Se ha restaurado el tamaño original');
            }
          }
        } catch (error) {
          console.error('Error al guardar tamaño:', error);
          
          if (rollbackOnError) {
            const originalState = originalStates.current.get(tableId);
            if (originalState) {
              await updateTable({
                id: tableId,
                width: originalState.width,
                height: originalState.height,
              });
              showError('Error de conexión. Se ha restaurado el tamaño original');
            } else {
              showError('Error de conexión al guardar el tamaño');
            }
          } else {
            showError('Error de conexión al guardar el tamaño');
          }
        }
      }, autoSaveDelay);
    }

    return true;
  }, [autoSave, autoSaveDelay, updateTable, saveOriginalState, showSuccess, showError, rollbackOnError]);

  // Forzar sincronización de cambios pendientes
  const syncPendingChanges = useCallback(async () => {
    const changes = Array.from(pendingChanges.current.values());
    
    if (changes.length === 0) return true;

    try {
      const results = await Promise.all(
        changes.map(async (change) => {
          const { tableId, changes: tableChanges } = change;
          
          if (tableChanges.positionX !== undefined && tableChanges.positionY !== undefined) {
            return await updateTablePosition(tableId, tableChanges.positionX, tableChanges.positionY);
          }
          
          if (tableChanges.width !== undefined && tableChanges.height !== undefined) {
            const result = await updateTable({
              id: tableId,
              width: tableChanges.width,
              height: tableChanges.height,
            });
            return !!result;
          }
          
          return false;
        })
      );

      const allSuccessful = results.every(success => success);
      
      if (allSuccessful) {
        pendingChanges.current.clear();
        originalStates.current.clear();
        showSuccess('Todos los cambios pendientes se han guardado correctamente');
      } else {
        showError('Algunos cambios no pudieron guardarse');
      }

      return allSuccessful;
    } catch (error) {
      console.error('Error al sincronizar cambios:', error);
      showError('Error de conexión al sincronizar cambios');
      return false;
    }
  }, [updateTablePosition, updateTable, showSuccess, showError]);

  // Descartar cambios pendientes
  const discardPendingChanges = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    pendingChanges.current.clear();
    originalStates.current.clear();
    showSuccess('Cambios pendientes descartados');
  }, [showSuccess]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    updatePositionOptimistic,
    updateSizeOptimistic,
    syncPendingChanges,
    discardPendingChanges,
    hasPendingChanges: pendingChanges.current.size > 0,
    pendingChangesCount: pendingChanges.current.size,
  };
};

export default useLayoutSync;