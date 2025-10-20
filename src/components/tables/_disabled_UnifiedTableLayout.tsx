'use client';

import React, { useEffect, useCallback } from 'react';
import { useUnifiedTableLayout, TablePosition, AreaPosition } from '@/hooks/useUnifiedTableLayout';
import { useLayoutSync } from '@/hooks/useLayoutSync';
import { Table } from '@/hooks/useTables';
import { Area } from '@/types';

interface UnifiedTableLayoutProps {
  areas: Area[];
  tables: Table[];
  selectedTableId?: string;
  onTableSelect?: (tableId: string) => void;
  onTableMove?: (tableId: string, positionX: number, positionY: number) => void;
  onAreaMove?: (areaId: string, positionX: number, positionY: number) => void;
  onAreaResize?: (areaId: string, width: number, height: number) => void;
  editable?: boolean;
  className?: string;
}

const UnifiedTableLayout: React.FC<UnifiedTableLayoutProps> = ({
  areas,
  tables,
  selectedTableId,
  onTableSelect,
  onTableMove,
  onAreaMove,
  onAreaResize,
  editable = false,
  className = '',
}) => {
  const {
    state,
    containerRef,
    handleZoom,
    handleWheel,
    startPanning,
    movePanning,
    stopPanning,
    resetView,
    centerOnTable,
    fitToScreen,
    startDraggingTable,
    moveDraggingTable,
    stopDraggingTable,
    selectTable,
    updateTablePosition,
    updateTableSize,
    getTableAtPosition,
    initializeLayout,
    convertLayoutToDbCoordinates,
  } = useUnifiedTableLayout({
    initialScale: 1,
    minScale: 0.5,
    maxScale: 3,
    enablePanning: true,
    enableZoom: true,
    coordinateType: 'relative',
    autoSave: true,
    autoSaveDelay: 1000,
  });

  // Hook de sincronización para persistencia con optimistic updates
  const {
    updatePositionOptimistic,
    updateSizeOptimistic,
    syncPendingChanges,
    discardPendingChanges,
    hasPendingChanges,
    pendingChangesCount,
  } = useLayoutSync(
    async (tableId: string, positionX: number, positionY: number) => {
      if (onTableMove) {
        onTableMove(tableId, positionX, positionY);
      }
      return true;
    },
    async (tableData: any) => {
      // Simulación de actualización - en una implementación real esto llamaría a la API
      return tableData;
    },
    {
      autoSave: true,
      autoSaveDelay: 1000,
      enableOptimisticUpdates: true,
      rollbackOnError: true,
    }
  );

  // Inicializar layout cuando cambian las mesas o áreas
  useEffect(() => {
    // Solo inicializar si hay cambios estructurales (nuevas mesas o áreas)
    const hasNewTables = tables.some(table => !state.tablePositions[table.id]);
    const hasNewAreas = areas.some(area => !state.areaPositions[area.id]);
    
    if (hasNewTables || hasNewAreas || Object.keys(state.tablePositions).length === 0) {
      initializeLayout(tables, areas, hasNewTables || hasNewAreas);
    }
  }, [tables, areas, initializeLayout, state.tablePositions, state.areaPositions]);

  // Manejar selección de mesa
  const handleTableSelect = useCallback((tableId: string) => {
    selectTable(tableId);
    if (onTableSelect) {
      onTableSelect(tableId);
    }
  }, [selectTable, onTableSelect]);

  // Manejar movimiento de mesa con sincronización
  const handleTableMove = useCallback((tableId: string) => {
    const coords = convertLayoutToDbCoordinates(tableId);
    const table = tables.find(t => t.id === tableId);
    
    console.log('DEBUG: handleTableMove called', {
      tableId,
      coords,
      table,
      originalPosition: { x: table?.positionX, y: table?.positionY },
      layoutPosition: state.tablePositions[tableId]
    });
    
    if (coords && table) {
      updatePositionOptimistic(tableId, coords.x, coords.y, table);
      
      // También llamar al callback original si existe
      if (onTableMove) {
        onTableMove(tableId, coords.x, coords.y);
      }
    }
  }, [convertLayoutToDbCoordinates, tables, updatePositionOptimistic, onTableMove, state.tablePositions]);

  // Manejar movimiento de área
  const handleAreaMove = useCallback((areaId: string) => {
    const areaPos = state.areaPositions[areaId];
    if (areaPos && onAreaMove) {
      onAreaMove(areaId, areaPos.x, areaPos.y);
    }
  }, [state.areaPositions, onAreaMove]);

  // Manejar redimensionamiento de área
  const handleAreaResize = useCallback((areaId: string) => {
    const areaPos = state.areaPositions[areaId];
    if (areaPos && onAreaResize) {
      onAreaResize(areaId, areaPos.width, areaPos.height);
    }
  }, [state.areaPositions, onAreaResize]);

  // Manejar eventos del mouse
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    moveDraggingTable(e);
    movePanning(e);
  }, [moveDraggingTable, movePanning]);

  const handleMouseUp = useCallback(() => {
    if (state.draggedTableId) {
      handleTableMove(state.draggedTableId);
    }
    if (state.draggedAreaId) {
      handleAreaMove(state.draggedAreaId);
    }
    
    stopDraggingTable();
    stopPanning();
  }, [state.draggedTableId, state.draggedAreaId, handleTableMove, handleAreaMove, stopDraggingTable, stopPanning]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('layout-area')) {
      startPanning(e);
    }
  }, [startPanning]);

  // Obtener color según estado de la mesa
  const getTableColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 border-green-600';
      case 'occupied':
        return 'bg-red-500 border-red-600';
      case 'reserved':
        return 'bg-yellow-500 border-yellow-600';
      case 'maintenance':
        return 'bg-gray-500 border-gray-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  // Obtener forma de la mesa
  const getTableShape = (shape?: string) => {
    switch (shape) {
      case 'circle':
        return 'rounded-full';
      case 'rectangle':
        return 'rounded';
      default:
        return 'rounded-md';
    }
  };

  // Renderizar mesa
  const renderTable = (table: Table) => {
    const position = state.tablePositions[table.id];
    if (!position) return null;

    const isSelected = selectedTableId === table.id || state.selectedTableId === table.id;
    const isBeingDragged = state.draggedTableId === table.id;

    return (
      <div
        key={table.id}
        className={`absolute flex flex-col items-center justify-center cursor-move transition-all ${
          getTableColor(table.currentStatus || 'available')
        } ${getTableShape(table.shape || undefined)} ${
          isSelected ? 'ring-4 ring-blue-300 z-10' : ''
        } ${isBeingDragged ? 'opacity-75 z-20' : 'hover:z-10'}
        border-2 text-white font-medium shadow-lg`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${position.width}px`,
          height: `${position.height}px`,
        }}
        onMouseDown={(e) => editable && startDraggingTable(table.id, e)}
        onClick={() => handleTableSelect(table.id)}
      >
        <div className="text-center">
          <div className="text-sm font-bold">{table.number}</div>
          <div className="text-xs">{table.capacity}</div>
        </div>
      </div>
    );
  };

  // Renderizar área
  const renderArea = (area: Area) => {
    const position = state.areaPositions[area.id];
    if (!position) return null;
    
    const isBeingDragged = state.draggedAreaId === area.id;

    return (
      <div
        key={area.id}
        className={`absolute border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg layout-area flex items-center justify-center ${
          editable ? 'cursor-move' : ''
        } ${isBeingDragged ? 'opacity-75 z-10' : ''} hover:z-5`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${position.width}px`,
          height: `${position.height}px`,
        }}
      >
        <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded text-sm font-medium text-gray-700">
          {area.name}
        </div>
        
        {/* Handle para redimensionar (simplificado) */}
        {editable && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize z-20"
            style={{ transform: 'translate(50%, 50%)' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              // Implementar redimensionamiento aquí
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 z-30 bg-white rounded-lg shadow-md p-2 flex flex-col gap-2">
        <button
          onClick={() => handleZoom(1.2)}
          className="p-2 hover:bg-gray-100 rounded"
          title="Acercar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          onClick={() => handleZoom(0.8)}
          className="p-2 hover:bg-gray-100 rounded"
          title="Alejar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={resetView}
          className="p-2 hover:bg-gray-100 rounded"
          title="Restablecer vista"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={fitToScreen}
          className="p-2 hover:bg-gray-100 rounded"
          title="Ajustar a pantalla"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Leyenda */}
      <div className="absolute top-4 left-4 z-30 bg-white rounded-lg shadow-md p-3">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Estado de mesas</h3>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-600">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-xs text-gray-600">Ocupada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-xs text-gray-600">Reservada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span className="text-xs text-gray-600">Mantenimiento</span>
          </div>
        </div>
      </div>

      {/* Contenedor del layout */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ touchAction: 'none' }}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${state.offset.x}px, ${state.offset.y}px) scale(${state.scale})`,
            transformOrigin: '0 0',
            transition: state.draggedTableId || state.draggedAreaId || state.isPanning ? 'none' : 'transform 0.2s',
            width: '2000px',
            height: '2000px',
          }}
        >
          {/* Renderizar áreas */}
          {areas.map(area => renderArea(area))}
          
          {/* Renderizar mesas */}
          {tables.map(table => renderTable(table))}
        </div>
      </div>

      {/* Instrucciones */}
      {editable && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 max-w-xs">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Instrucciones</h3>
          <p className="text-xs text-gray-600">
            • Arrastra las mesas para reposicionarlas<br/>
            • Usa la rueda del mouse para hacer zoom<br/>
            • Arrastra el fondo para mover la vista<br/>
            • Los cambios se guardan automáticamente
          </p>
        </div>
      )}
    </div>
  );
};

export default UnifiedTableLayout;