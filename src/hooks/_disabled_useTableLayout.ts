import { useState, useCallback, useRef } from 'react';
import { Table } from './useTables';

export interface TablePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseTableLayoutOptions {
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  enablePanning?: boolean;
  enableZoom?: boolean;
}

export const useTableLayout = (options: UseTableLayoutOptions = {}) => {
  const {
    initialScale = 1,
    minScale = 0.5,
    maxScale = 3,
    enablePanning = true,
    enableZoom = true,
  } = options;

  const [scale, setScale] = useState(initialScale);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [tablePositions, setTablePositions] = useState<Record<string, TablePosition>>({});
  const [layoutAreas, setLayoutAreas] = useState<LayoutArea[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Inicializar posiciones de mesas
  const initializeTablePositions = useCallback((tables: Table[]) => {
    const positions: Record<string, TablePosition> = {};
    
    tables.forEach((table, index) => {
      if (table.positionX !== null && table.positionY !== null) {
        positions[table.id] = {
          id: table.id,
          x: table.positionX || 0,
          y: table.positionY || 0,
          width: table.width || 80,
          height: table.height || 80,
        };
      } else {
        // Asignar posición automática si no tiene
        const row = Math.floor(index / 4);
        const col = index % 4;
        
        positions[table.id] = {
          id: table.id,
          x: 100 + col * 120,
          y: 100 + row * 120,
          width: table.width || 80,
          height: table.height || 80,
        };
      }
    });
    
    setTablePositions(positions);
  }, []);

  // Calcular áreas de layout basadas en las mesas
  const calculateLayoutAreas = useCallback((tables: Table[], areas: any[], currentTablePositions: Record<string, TablePosition>) => {
    const layoutAreasMap: Record<string, LayoutArea> = {};
    
    areas.forEach(area => {
      const areaTables = tables.filter(table => table.areaId === area.id);
      
      if (areaTables.length === 0) return;
      
      // Calcular bounds del área
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      areaTables.forEach(table => {
        const pos = currentTablePositions[table.id];
        if (pos) {
          minX = Math.min(minX, pos.x);
          minY = Math.min(minY, pos.y);
          maxX = Math.max(maxX, pos.x + pos.width);
          maxY = Math.max(maxY, pos.y + pos.height);
        }
      });
      
      // Añadir padding
      const padding = 40;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX += padding;
      maxY += padding;
      
      layoutAreasMap[area.id] = {
        id: area.id,
        name: area.name,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    });
    
    setLayoutAreas(Object.values(layoutAreasMap));
  }, []);

  // Manejar zoom
  const handleZoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    if (!enableZoom) return;

    setScale(prevScale => {
      const newScale = Math.min(Math.max(minScale, prevScale * delta), maxScale);
      
      // Si se proporcionan coordenadas, ajustar el offset para mantener el punto central
      if (centerX !== undefined && centerY !== undefined && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (centerX - rect.left - offset.x) / prevScale;
        const y = (centerY - rect.top - offset.y) / prevScale;
        
        const newX = centerX - rect.left - x * newScale;
        const newY = centerY - rect.top - y * newScale;
        
        setOffset({ x: newX, y: newY });
      }
      
      return newScale;
    });
  }, [enableZoom, minScale, maxScale, offset]);

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
    
    setIsPanning(true);
    setPanStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  }, [enablePanning, offset]);

  // Mover durante el paneo
  const movePanning = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart]);

  // Detener paneo
  const stopPanning = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Iniciar arrastre de mesa
  const startDraggingTable = useCallback((tableId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedTableId(tableId);
  }, []);

  // Mover mesa durante arrastre
  const moveDraggingTable = useCallback((e: React.MouseEvent) => {
    if (!draggedTableId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;
    
    setTablePositions(prev => {
      const tablePos = prev[draggedTableId];
      if (!tablePos) return prev;
      
      return {
        ...prev,
        [draggedTableId]: {
          ...tablePos,
          x: Math.max(0, x - tablePos.width / 2),
          y: Math.max(0, y - tablePos.height / 2),
        },
      };
    });
  }, [draggedTableId, offset, scale]);

  // Detener arrastre de mesa
  const stopDraggingTable = useCallback(() => {
    setDraggedTableId(null);
  }, []);

  // Seleccionar mesa
  const selectTable = useCallback((tableId: string | null) => {
    setSelectedTableId(tableId);
  }, []);

  // Actualizar posición de mesa
  const updateTablePosition = useCallback((tableId: string, x: number, y: number) => {
    setTablePositions(prev => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        x,
        y,
      },
    }));
  }, []);

  // Actualizar tamaño de mesa
  const updateTableSize = useCallback((tableId: string, width: number, height: number) => {
    setTablePositions(prev => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        width,
        height,
      },
    }));
  }, []);

  // Restablecer vista
  const resetView = useCallback(() => {
    setScale(initialScale);
    setOffset({ x: 0, y: 0 });
  }, [initialScale]);

  // Centrar en una mesa específica
  const centerOnTable = useCallback((tableId: string) => {
    const tablePos = tablePositions[tableId];
    if (!tablePos || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = tablePos.x + tablePos.width / 2;
    const centerY = tablePos.y + tablePos.height / 2;
    
    const offsetX = rect.width / 2 - centerX * scale;
    const offsetY = rect.height / 2 - centerY * scale;
    
    setOffset({ x: offsetX, y: offsetY });
  }, [tablePositions, scale]);

  // Ajustar zoom para mostrar todas las mesas
  const fitToScreen = useCallback(() => {
    if (!containerRef.current || Object.keys(tablePositions).length === 0) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calcular bounds de todas las mesas
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    Object.values(tablePositions).forEach(pos => {
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
    
    setScale(newScale);
    setOffset({ x: offsetX, y: offsetY });
  }, [tablePositions, maxScale]);

  // Obtener mesa en una posición específica
  const getTableAtPosition = useCallback((x: number, y: number): string | null => {
    // Convertir coordenadas de pantalla a coordenadas del layout
    const layoutX = (x - offset.x) / scale;
    const layoutY = (y - offset.y) / scale;
    
    // Buscar mesa en esa posición
    for (const [tableId, position] of Object.entries(tablePositions)) {
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
  }, [offset, scale, tablePositions]);

  // Exportar configuración del layout
  const exportLayout = useCallback(() => {
    return {
      scale,
      offset,
      tablePositions,
      layoutAreas,
    };
  }, [scale, offset, tablePositions, layoutAreas]);

  // Importar configuración del layout
  const importLayout = useCallback((layout: any) => {
    if (layout.scale) setScale(layout.scale);
    if (layout.offset) setOffset(layout.offset);
    if (layout.tablePositions) setTablePositions(layout.tablePositions);
    if (layout.layoutAreas) setLayoutAreas(layout.layoutAreas);
  }, []);

  return {
    // Estado
    scale,
    offset,
    isPanning,
    selectedTableId,
    draggedTableId,
    tablePositions,
    layoutAreas,
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
    initializeTablePositions,
    calculateLayoutAreas,
    
    // Métodos de importación/exportación
    exportLayout,
    importLayout,
  };
};

export default useTableLayout;