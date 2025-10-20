import { useReducer, useState, useCallback, useRef, useEffect } from 'react';
import { Table } from './useTables';
import { Area } from '@/types';

// Tipos unificados para coordenadas
export interface CoordinateSystem {
  type: 'absolute' | 'relative';
  origin: { x: number; y: number };
  scale: number;
}

export interface TablePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  areaId: string;
}

export interface AreaPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutState {
  coordinateSystem: CoordinateSystem;
  tablePositions: Record<string, TablePosition>;
  areaPositions: Record<string, AreaPosition>;
  selectedTableId: string | null;
  draggedTableId: string | null;
  draggedAreaId: string | null;
  scale: number;
  offset: { x: number; y: number };
  isPanning: boolean;
  isDirty: boolean;
}

export interface LayoutAction {
  type: string;
  payload?: any;
}

interface UseUnifiedTableLayoutOptions {
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  enablePanning?: boolean;
  enableZoom?: boolean;
  coordinateType?: 'absolute' | 'relative';
  autoSave?: boolean;
  autoSaveDelay?: number;
}

// Estado inicial
const getInitialState = (coordinateType: 'absolute' | 'relative' = 'relative'): LayoutState => ({
  coordinateSystem: {
    type: coordinateType,
    origin: { x: 0, y: 0 },
    scale: 1,
  },
  tablePositions: {},
  areaPositions: {},
  selectedTableId: null,
  draggedTableId: null,
  draggedAreaId: null,
  scale: 1,
  offset: { x: 0, y: 0 },
  isPanning: false,
  isDirty: false,
});

// Reducer para gestionar el estado del layout
function layoutReducer(state: LayoutState, action: LayoutAction): LayoutState {
  switch (action.type) {
    case 'INITIALIZE_LAYOUT':
      return {
        ...state,
        tablePositions: action.payload.tablePositions || {},
        areaPositions: action.payload.areaPositions || {},
        isDirty: false,
      };

    case 'SET_TABLE_POSITIONS':
      return {
        ...state,
        tablePositions: action.payload,
        isDirty: true,
      };

    case 'UPDATE_TABLE_POSITION':
      const { tableId, x, y } = action.payload;
      return {
        ...state,
        tablePositions: {
          ...state.tablePositions,
          [tableId]: {
            ...state.tablePositions[tableId],
            x,
            y,
          },
        },
        isDirty: true,
      };

    case 'UPDATE_TABLE_SIZE':
      const { tableId: tid, width, height } = action.payload;
      return {
        ...state,
        tablePositions: {
          ...state.tablePositions,
          [tid]: {
            ...state.tablePositions[tid],
            width,
            height,
          },
        },
        isDirty: true,
      };

    case 'SET_AREA_POSITIONS':
      return {
        ...state,
        areaPositions: action.payload,
        isDirty: true,
      };

    case 'UPDATE_AREA_POSITION':
      const { areaId, x: areaX, y: areaY } = action.payload;
      const deltaX = areaX - state.areaPositions[areaId]?.x || 0;
      const deltaY = areaY - state.areaPositions[areaId]?.y || 0;
      
      // Mover todas las mesas del área
      const updatedTablePositions = { ...state.tablePositions };
      Object.entries(updatedTablePositions).forEach(([tableId, position]) => {
        if (position.areaId === areaId) {
          updatedTablePositions[tableId] = {
            ...position,
            x: position.x + deltaX,
            y: position.y + deltaY,
          };
        }
      });

      return {
        ...state,
        areaPositions: {
          ...state.areaPositions,
          [areaId]: {
            ...state.areaPositions[areaId],
            x: areaX,
            y: areaY,
          },
        },
        tablePositions: updatedTablePositions,
        isDirty: true,
      };

    case 'UPDATE_AREA_SIZE':
      const { areaId: aid, width: areaWidth, height: areaHeight } = action.payload;
      return {
        ...state,
        areaPositions: {
          ...state.areaPositions,
          [aid]: {
            ...state.areaPositions[aid],
            width: areaWidth,
            height: areaHeight,
          },
        },
        isDirty: true,
      };

    case 'SET_SELECTED_TABLE':
      return {
        ...state,
        selectedTableId: action.payload,
      };

    case 'SET_DRAGGED_TABLE':
      return {
        ...state,
        draggedTableId: action.payload,
      };

    case 'SET_DRAGGED_AREA':
      return {
        ...state,
        draggedAreaId: action.payload,
      };

    case 'SET_SCALE':
      return {
        ...state,
        scale: action.payload,
        coordinateSystem: {
          ...state.coordinateSystem,
          scale: action.payload,
        },
      };

    case 'SET_OFFSET':
      return {
        ...state,
        offset: action.payload,
      };

    case 'SET_PANNING':
      return {
        ...state,
        isPanning: action.payload,
      };

    case 'MARK_CLEAN':
      return {
        ...state,
        isDirty: false,
      };

    case 'RESET_VIEW':
      return {
        ...state,
        scale: 1,
        offset: { x: 0, y: 0 },
        coordinateSystem: {
          ...state.coordinateSystem,
          scale: 1,
        },
      };

    default:
      return state;
  }
}

export const useUnifiedTableLayout = (options: UseUnifiedTableLayoutOptions = {}) => {
  const {
    initialScale = 1,
    minScale = 0.5,
    maxScale = 3,
    enablePanning = true,
    enableZoom = true,
    coordinateType = 'relative',
    autoSave = true,
    autoSaveDelay = 1000,
  } = options;

  const [state, dispatch] = useReducer(layoutReducer, getInitialState(coordinateType));
  const containerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convertir coordenadas de base de datos (absolutas) a coordenadas del layout (relativas)
  const convertDbToLayoutCoordinates = useCallback((table: Table, areaPosition: AreaPosition) => {
    // Para coordenadas relativas, necesitamos convertir las coordenadas de BD a relativas al área
    if (coordinateType === 'relative') {
      return {
        x: (table.positionX || 0) + areaPosition.x,
        y: (table.positionY || 0) + areaPosition.y,
        width: table.width || 80,
        height: table.height || 80,
      };
    } else {
      // Coordenadas absolutas, usar directamente
      return {
        x: table.positionX || 0,
        y: table.positionY || 0,
        width: table.width || 80,
        height: table.height || 80,
      };
    }
  }, [coordinateType]);

  // Convertir coordenadas del layout a coordenadas de base de datos
  const convertLayoutToDbCoordinates = useCallback((tableId: string) => {
    const tablePosition = state.tablePositions[tableId];
    if (!tablePosition) return null;

    console.log('DEBUG: convertLayoutToDbCoordinates', {
      tableId,
      tablePosition,
      coordinateType
    });

    // Para coordenadas relativas, necesitamos convertirlas a absolutas
    // Para coordenadas absolutas, las usamos directamente
    let result;
    
    if (coordinateType === 'relative') {
      // Las coordenadas del layout son relativas al área, pero la BD espera absolutas
      const areaPosition = state.areaPositions[tablePosition.areaId];
      if (areaPosition) {
        result = {
          x: tablePosition.x - areaPosition.x,
          y: tablePosition.y - areaPosition.y,
          width: tablePosition.width,
          height: tablePosition.height,
        };
      } else {
        // Si no hay área, tratar como absolutas
        result = {
          x: tablePosition.x,
          y: tablePosition.y,
          width: tablePosition.width,
          height: tablePosition.height,
        };
      }
    } else {
      // Coordenadas absolutas, usar directamente
      result = {
        x: tablePosition.x,
        y: tablePosition.y,
        width: tablePosition.width,
        height: tablePosition.height,
      };
    }

    console.log('DEBUG: convertLayoutToDbCoordinates result', {
      tableId,
      result,
      coordinateType,
      tableX: tablePosition.x,
      tableY: tablePosition.y,
      areaId: tablePosition.areaId
    });

    return result;
  }, [state.tablePositions, state.areaPositions, coordinateType]);

  // Inicializar layout con mesas y áreas
  const initializeLayout = useCallback((tables: Table[], areas: Area[], forceReinitialize = false) => {
    console.log('DEBUG: initializeLayout called', { tables, areas, forceReinitialize });
    
    // Si no forzamos reinicialización y ya hay posiciones, solo actualizamos las áreas nuevas
    if (!forceReinitialize && Object.keys(state.tablePositions).length > 0 && Object.keys(state.areaPositions).length > 0) {
      console.log('DEBUG: initializeLayout - skipping reinitialization, preserving existing positions');
      return;
    }
    
    const tablePositions: Record<string, TablePosition> = {};
    const areaPositions: Record<string, AreaPosition> = {};

    // Preservar posiciones existentes de áreas si ya existen
    if (!forceReinitialize && Object.keys(state.areaPositions).length > 0) {
      Object.assign(areaPositions, state.areaPositions);
    } else {
      // Inicializar posiciones de áreas
      areas.forEach((area, index) => {
        const areaRow = Math.floor(index / 2);
        const areaCol = index % 2;
        
        areaPositions[area.id] = {
          id: area.id,
          x: areaCol * 600 + 100,
          y: areaRow * 400 + 100,
          width: 500,
          height: 300,
        };
      });
    }

    // Preservar posiciones existentes de mesas si ya existen
    if (!forceReinitialize && Object.keys(state.tablePositions).length > 0) {
      Object.assign(tablePositions, state.tablePositions);
    } else {
      // Inicializar posiciones de mesas
      tables.forEach((table, index) => {
        const areaPosition = areaPositions[table.areaId];
        if (!areaPosition) return;

        // Si ya existe una posición para esta mesa, preservarla
        if (state.tablePositions[table.id] && !forceReinitialize) {
          tablePositions[table.id] = state.tablePositions[table.id];
          return;
        }

        if (table.positionX !== null && table.positionY !== null) {
          // Usar posición guardada
          const layoutCoords = convertDbToLayoutCoordinates(table, areaPosition);
          console.log('DEBUG: initializeLayout - using saved position', {
            tableId: table.id,
            dbPosition: { x: table.positionX, y: table.positionY },
            layoutCoords,
            areaPosition
          });
          
          tablePositions[table.id] = {
            id: table.id,
            areaId: table.areaId,
            ...layoutCoords,
          };
        } else {
          // Asignar posición automática
          const areaTables = tables.filter(t => t.areaId === table.areaId);
          const tableIndex = areaTables.findIndex(t => t.id === table.id);
          const cols = Math.floor((areaPosition.width - 40) / 100);
          const tableCol = tableIndex % cols;
          const tableRow = Math.floor(tableIndex / cols);
          const spacingX = (areaPosition.width - 40 - cols * 80) / (cols + 1);
          
          tablePositions[table.id] = {
            id: table.id,
            areaId: table.areaId,
            x: areaPosition.x + spacingX + tableCol * (80 + spacingX),
            y: areaPosition.y + 40 + tableRow * 100,
            width: table.width || 80,
            height: table.height || 80,
          };
        }
      });
    }

    console.log('DEBUG: initializeLayout dispatching', {
      tablePositions,
      areaPositions
    });

    dispatch({
      type: 'INITIALIZE_LAYOUT',
      payload: { tablePositions, areaPositions },
    });
  }, [convertDbToLayoutCoordinates, state.tablePositions, state.areaPositions]);

  // Manejar zoom
  const handleZoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    if (!enableZoom) return;

    const newScale = Math.min(Math.max(minScale, state.scale * delta), maxScale);
    dispatch({ type: 'SET_SCALE', payload: newScale });

    // Ajustar offset para mantener el punto central si se proporcionan coordenadas
    if (centerX !== undefined && centerY !== undefined && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (centerX - rect.left - state.offset.x) / state.scale;
      const y = (centerY - rect.top - state.offset.y) / state.scale;
      
      const newX = centerX - rect.left - x * newScale;
      const newY = centerY - rect.top - y * newScale;
      
      dispatch({ type: 'SET_OFFSET', payload: { x: newX, y: newY } });
    }
  }, [enableZoom, minScale, maxScale, state.scale, state.offset]);

  // Manejar rueda del mouse para zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!enableZoom) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    handleZoom(delta, e.clientX, e.clientY);
  }, [enableZoom, handleZoom]);

  // Iniciar paneo
  const startPanning = useCallback((e: React.MouseEvent) => {
    if (!enablePanning) return;
    
    dispatch({ type: 'SET_PANNING', payload: true });
  }, [enablePanning]);

  // Mover durante el paneo
  const movePanning = useCallback((e: React.MouseEvent) => {
    if (state.isPanning) {
      dispatch({
        type: 'SET_OFFSET',
        payload: { x: e.clientX, y: e.clientY },
      });
    }
  }, [state.isPanning]);

  // Detener paneo
  const stopPanning = useCallback(() => {
    dispatch({ type: 'SET_PANNING', payload: false });
  }, []);

  // Iniciar arrastre de mesa
  const startDraggingTable = useCallback((tableId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SET_DRAGGED_TABLE', payload: tableId });
  }, []);

  // Mover mesa durante arrastre
  const moveDraggingTable = useCallback((e: React.MouseEvent) => {
    if (!state.draggedTableId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - state.offset.x) / state.scale;
    const y = (e.clientY - rect.top - state.offset.y) / state.scale;
    
    const tablePos = state.tablePositions[state.draggedTableId];
    if (!tablePos) return;
    
    const areaPos = state.areaPositions[tablePos.areaId];
    if (!areaPos) return;
    
    // Calcular nueva posición con restricciones para mantener la mesa dentro de su área
    let newX = x - tablePos.width / 2;
    let newY = y - tablePos.height / 2;
    
    // Restringir dentro del área
    newX = Math.max(areaPos.x + 20, Math.min(newX, areaPos.x + areaPos.width - tablePos.width - 20));
    newY = Math.max(areaPos.y + 40, Math.min(newY, areaPos.y + areaPos.height - tablePos.height - 20));
    
    // Aplicar snap a una cuadrícula de 20px para mejor alineación
    newX = Math.round(newX / 20) * 20;
    newY = Math.round(newY / 20) * 20;
    
    dispatch({
      type: 'UPDATE_TABLE_POSITION',
      payload: { tableId: state.draggedTableId, x: newX, y: newY },
    });
  }, [state.draggedTableId, state.offset, state.scale, state.tablePositions, state.areaPositions]);

  // Detener arrastre de mesa
  const stopDraggingTable = useCallback(() => {
    dispatch({ type: 'SET_DRAGGED_TABLE', payload: null });
  }, []);

  // Seleccionar mesa
  const selectTable = useCallback((tableId: string | null) => {
    dispatch({ type: 'SET_SELECTED_TABLE', payload: tableId });
  }, []);

  // Actualizar posición de mesa
  const updateTablePosition = useCallback((tableId: string, x: number, y: number) => {
    dispatch({
      type: 'UPDATE_TABLE_POSITION',
      payload: { tableId, x, y },
    });
  }, []);

  // Actualizar tamaño de mesa
  const updateTableSize = useCallback((tableId: string, width: number, height: number) => {
    dispatch({
      type: 'UPDATE_TABLE_SIZE',
      payload: { tableId, width, height },
    });
  }, []);

  // Restablecer vista
  const resetView = useCallback(() => {
    dispatch({ type: 'RESET_VIEW' });
  }, []);

  // Centrar en una mesa específica
  const centerOnTable = useCallback((tableId: string) => {
    const tablePos = state.tablePositions[tableId];
    if (!tablePos || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = tablePos.x + tablePos.width / 2;
    const centerY = tablePos.y + tablePos.height / 2;
    
    const offsetX = rect.width / 2 - centerX * state.scale;
    const offsetY = rect.height / 2 - centerY * state.scale;
    
    dispatch({ type: 'SET_OFFSET', payload: { x: offsetX, y: offsetY } });
  }, [state.tablePositions, state.scale]);

  // Ajustar zoom para mostrar todas las mesas
  const fitToScreen = useCallback(() => {
    if (!containerRef.current || Object.keys(state.tablePositions).length === 0) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calcular bounds de todas las mesas
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    Object.values(state.tablePositions).forEach(pos => {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + pos.width);
      maxY = Math.max(maxY, pos.y + pos.height);
    });
    
    // Añadir padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // Calcular escala necesaria
    const scaleX = rect.width / contentWidth;
    const scaleY = rect.height / contentHeight;
    const newScale = Math.min(scaleX, scaleY, maxScale);
    
    // Calcular offset para centrar
    const offsetX = (rect.width - contentWidth * newScale) / 2 - minX * newScale;
    const offsetY = (rect.height - contentHeight * newScale) / 2 - minY * newScale;
    
    dispatch({ type: 'SET_SCALE', payload: newScale });
    dispatch({ type: 'SET_OFFSET', payload: { x: offsetX, y: offsetY } });
  }, [state.tablePositions, maxScale]);

  // Obtener mesa en una posición específica
  const getTableAtPosition = useCallback((x: number, y: number): string | null => {
    // Convertir coordenadas de pantalla a coordenadas del layout
    const layoutX = (x - state.offset.x) / state.scale;
    const layoutY = (y - state.offset.y) / state.scale;
    
    // Buscar mesa en esa posición
    for (const [tableId, position] of Object.entries(state.tablePositions)) {
      if (
        layoutX >= position.x &&
        layoutX <= position.x + position.width &&
        layoutY >= position.y &&
        layoutY <= position.y + position.height
      ) {
        return tableId;
      }
    }
    
    return null;
  }, [state.offset, state.scale, state.tablePositions]);

  // Exportar configuración del layout
  const exportLayout = useCallback(() => {
    return {
      coordinateSystem: state.coordinateSystem,
      tablePositions: state.tablePositions,
      areaPositions: state.areaPositions,
      scale: state.scale,
      offset: state.offset,
    };
  }, [state]);

  // Importar configuración del layout
  const importLayout = useCallback((layout: any) => {
    if (layout.tablePositions) {
      dispatch({ type: 'SET_TABLE_POSITIONS', payload: layout.tablePositions });
    }
    if (layout.areaPositions) {
      dispatch({ type: 'SET_AREA_POSITIONS', payload: layout.areaPositions });
    }
    if (layout.scale !== undefined) {
      dispatch({ type: 'SET_SCALE', payload: layout.scale });
    }
    if (layout.offset) {
      dispatch({ type: 'SET_OFFSET', payload: layout.offset });
    }
  }, []);

  // Auto-guardado
  useEffect(() => {
    if (!autoSave || !state.isDirty) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      // Aquí se guardaría el estado en el backend
      console.log('Auto-guardando layout:', state);
      dispatch({ type: 'MARK_CLEAN' });
    }, autoSaveDelay);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [state.isDirty, autoSave, autoSaveDelay]);

  return {
    // Estado
    state,
    
    // Referencias
    containerRef,
    
    // Métodos de navegación
    handleZoom,
    handleWheel,
    startPanning,
    movePanning,
    stopPanning,
    resetView,
    centerOnTable,
    fitToScreen,
    
    // Métodos de interacción con mesas
    startDraggingTable,
    moveDraggingTable,
    stopDraggingTable,
    selectTable,
    updateTablePosition,
    updateTableSize,
    getTableAtPosition,
    
    // Métodos de inicialización
    initializeLayout,
    
    // Métodos de importación/exportación
    exportLayout,
    importLayout,
    
    // Utilidades de coordenadas
    convertDbToLayoutCoordinates,
    convertLayoutToDbCoordinates,
  };
};

export default useUnifiedTableLayout;