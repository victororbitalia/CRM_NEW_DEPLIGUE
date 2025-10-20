'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUnifiedTableLayout } from '@/hooks/useUnifiedTableLayout';
import { useLayoutSync } from '@/hooks/useLayoutSync';
import { useTables } from '@/hooks/useTables';
import { useAreas } from '@/hooks/useAreas';
import { useReservations } from '@/hooks/useReservations';
import { useNotifications } from '@/hooks/useNotifications';
import { Table, Area } from '@/types';
import Button from '@/components/ui/Button';
import LayoutControls, { InteractionMode } from '@/components/tables/LayoutControls';
import TableContextMenu from '@/components/tables/TableContextMenu';
import TableDetailsModal from '@/components/tables/TableDetailsModal';
import ReservationTimer from '@/components/tables/ReservationTimer';

interface ImprovedTableLayoutProps {
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

export default function ImprovedTableLayout({
  areas,
  tables,
  selectedTableId,
  onTableSelect,
  onTableMove,
  onAreaMove,
  onAreaResize,
  editable = true,
  className = '',
}: ImprovedTableLayoutProps) {
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('navigate');
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    tableId: string;
    tableName: string;
    tableStatus: string;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    tableId: '',
    tableName: '',
    tableStatus: '',
    position: { x: 0, y: 0 },
  });
  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean;
    tableId: string;
  }>({
    isOpen: false,
    tableId: '',
  });

  const {
    state,
    containerRef,
    startDraggingTable,
    stopDraggingTable,
    updateTablePosition,
    initializeLayout,
    resetView,
    fitToScreen,
    handleZoom,
    convertLayoutToDbCoordinates,
  } = useUnifiedTableLayout({
    coordinateType: 'relative',
    autoSave: true,
  });

  const { updatePositionOptimistic } = useLayoutSync(
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

  const { reservations } = useReservations();
  
  // Log para depuración
  useEffect(() => {
    console.log('Reservations loaded:', reservations);
    console.log('Tables:', tables);
  }, [reservations, tables]);

  const { showSuccess, showError } = useNotifications();

  // Initialize layout when tables or areas change
  useEffect(() => {
    // Only initialize if there are structural changes (new tables or areas)
    const hasNewTables = tables.some(table => !state.tablePositions[table.id]);
    const hasNewAreas = areas.some(area => !state.areaPositions[area.id]);
    
    if (hasNewTables || hasNewAreas || Object.keys(state.tablePositions).length === 0) {
      // Convert tables to the expected format for initializeLayout
      // Asignar reservas a las mesas
      const tablesForLayout = tables.map(table => {
        // Buscar si hay una reserva para esta mesa
        const reservation = reservations.find(r => r.tableId === table.id);
        
        return {
          ...table,
          areaId: (table as any).areaId || areas[0]?.id || '',
          currentStatus: reservation ? 'reserved' : 'available',
          currentReservation: reservation ? {
            id: reservation.id,
            customerName: reservation.customerName || '',
            startTime: reservation.startTime || '',
            endTime: reservation.endTime || '',
            partySize: reservation.partySize || 0,
          } : undefined,
        };
      });
      
      initializeLayout(tablesForLayout, areas, hasNewTables || hasNewAreas);
    }
  }, [tables, areas, initializeLayout, state.tablePositions, state.areaPositions, reservations]);

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, tableId: string) => {
    e.preventDefault();
    
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    setContextMenu({
      isOpen: true,
      tableId,
      tableName: table.number,
      tableStatus: (table as any).currentStatus || 'available',
      position: { x: e.clientX, y: e.clientY },
    });
  }, [tables]);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Handle table details
  const handleTableDetails = useCallback((tableId: string) => {
    setDetailsModal({
      isOpen: true,
      tableId,
    });
  }, []);

  // Close details modal
  const closeDetailsModal = useCallback(() => {
    setDetailsModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Handle table actions
  const handleReleaseTable = useCallback((tableId: string) => {
    // Implementation for releasing table
    showSuccess('Mesa liberada correctamente');
  }, [showSuccess]);

  const handleEditTable = useCallback((tableId: string) => {
    // Implementation for editing table
    console.log('Edit table:', tableId);
  }, []);

  const handleDeleteTable = useCallback((tableId: string) => {
    // Implementation for deleting table
    console.log('Delete table:', tableId);
  }, []);

  const handleAssignReservation = useCallback((tableId: string) => {
    // Implementation for assigning reservation
    console.log('Assign reservation to table:', tableId);
  }, []);

  const handleCreateReservation = useCallback((tableId: string) => {
    // Implementation for creating reservation
    console.log('Create reservation for table:', tableId);
  }, []);

  // Handle centering on area
  const handleCenterArea = useCallback((areaId: string) => {
    const areaPosition = state.areaPositions[areaId];
    if (!areaPosition) return;
    
    // Calculate center position
    const centerX = areaPosition.x + areaPosition.width / 2;
    const centerY = areaPosition.y + areaPosition.height / 2;
    
    // Adjust viewport to center on area
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const offsetX = (viewportWidth / 2 - centerX * state.scale) / state.scale;
    const offsetY = (viewportHeight / 2 - centerY * state.scale) / state.scale;
    
    // For now, just log the center position
    // In a complete implementation, this would update the state to center on the area
    console.log('Center on area:', areaId, { centerX, centerY, offsetX, offsetY });
  }, [state.areaPositions, state.scale]);

  // Handle mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, tableId: string) => {
      console.log('DEBUG: handleMouseDown called', { tableId, interactionMode, editable });
      
      if (!editable) {
        console.log('DEBUG: handleMouseDown - not editable');
        return;
      }
      
      // Only allow dragging in move mode
      if (interactionMode !== 'move') {
        console.log('DEBUG: handleMouseDown - not in move mode');
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      console.log('DEBUG: handleMouseDown - calling startDraggingTable');
      startDraggingTable(tableId, e);
    },
    [editable, interactionMode, startDraggingTable]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (state.draggedTableId && interactionMode === 'move') {
        e.preventDefault();
        console.log('DEBUG: handleMouseMove - dragging table', state.draggedTableId);
        // El hook useUnifiedTableLayout manejará el movimiento del arrastre
      }
    },
    [
      state.draggedTableId,
      updateTablePosition,
      interactionMode,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (state.draggedTableId) {
      console.log('DEBUG: handleMouseUp - stopping drag for table', state.draggedTableId);
      stopDraggingTable();
      
      // Save position to database
      const coords = convertLayoutToDbCoordinates(state.draggedTableId);
      if (coords) {
        console.log('DEBUG: handleMouseUp - saving position', { tableId: state.draggedTableId, coords });
        updatePositionOptimistic(state.draggedTableId, coords.x, coords.y);
      }
    }
  }, [state.draggedTableId, stopDraggingTable, convertLayoutToDbCoordinates, updatePositionOptimistic]);

  // Handle table click
  const handleTableClick = useCallback((e: React.MouseEvent, tableId: string) => {
    e.stopPropagation();
    
    if (interactionMode === 'navigate') {
      // Double click to show details
      if (e.detail === 2) {
        handleTableDetails(tableId);
      }
    }
    
    // Single click to select
    if (onTableSelect) {
      onTableSelect(tableId);
    }
  }, [interactionMode, onTableSelect, handleTableDetails]);

  // Handle pan
  const handlePanStart = useCallback(
    (e: React.MouseEvent) => {
      // Solo permitir pan en modo navigate
      if (interactionMode !== 'navigate') return;
      
      // El hook useUnifiedTableLayout manejará el pan
    },
    [interactionMode]
  );

  const handlePanMove = useCallback(
    (e: React.MouseEvent) => {
      // El hook useUnifiedTableLayout manejará el movimiento del pan
    },
    [interactionMode]
  );

  const handlePanEnd = useCallback(() => {
    // El hook useUnifiedTableLayout manejará el fin del pan
  }, []);

  // Get table color based on status
  const getTableColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'border-green-500 bg-green-50 hover:bg-green-100';
      case 'occupied':
        return 'border-red-500 bg-red-50 hover:bg-red-100';
      case 'reserved':
        return 'border-yellow-500 bg-yellow-50 hover:bg-yellow-100';
      case 'maintenance':
        return 'border-gray-500 bg-gray-50 hover:bg-gray-100';
      default:
        return 'border-blue-500 bg-blue-50 hover:bg-blue-100';
    }
  };

  // Get table shape
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

  // Render table
  const renderTable = (table: Table) => {
    const position = state.tablePositions[table.id];
    if (!position) return null;

    const isSelected = selectedTableId === table.id || state.selectedTableId === table.id;
    const isBeingDragged = state.draggedTableId === table.id;

    return (
      <div
        key={table.id}
        className={`absolute rounded-lg border-2 transition-all ${
          interactionMode === 'move' ? 'cursor-move' : 'cursor-pointer'
        } ${
          isSelected
            ? 'border-blue-500 shadow-lg z-10'
            : getTableColor((table as any).currentStatus || 'available')
        } ${isBeingDragged ? 'opacity-75 z-20' : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${position.width}px`,
          height: `${position.height}px`,
          transform: 'translate(-50%, -50%)',
        }}
        onMouseDown={(e) => handleMouseDown(e, table.id)}
        onClick={(e) => handleTableClick(e, table.id)}
        onContextMenu={(e) => handleContextMenu(e, table.id)}
      >
        <div className="flex flex-col items-center justify-center h-full p-1">
          <div className="text-xs font-bold">{table.number || `Mesa ${table.id}`}</div>
          <div className="text-xs">{table.capacity}p</div>
          
          {/* Show reservation info if available */}
          {(table as any).currentReservation && (
            <div className="text-center">
              <div className="text-xs truncate max-w-full font-medium">
                {(table as any).currentReservation.customerName}
              </div>
              {(table as any).currentReservation.endTime && (
                <ReservationTimer
                  endTime={(table as any).currentReservation.endTime}
                  className="mt-1"
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render area
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
      </div>
    );
  };

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10">
        <LayoutControls
          scale={state.scale}
          onScaleChange={(scale) => handleZoom(scale / state.scale)}
          onReset={resetView}
          onFitToScreen={fitToScreen}
          interactionMode={interactionMode}
          onInteractionModeChange={setInteractionMode}
          areas={areas}
          onCenterArea={handleCenterArea}
        />
      </div>

      {/* Container */}
      <div
        ref={containerRef}
        className="w-full h-full layout-viewport"
        onMouseDown={handlePanStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          handleZoom(delta);
        }}
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
          {/* Render areas */}
          {areas.map(area => renderArea(area))}
          
          {/* Render tables */}
          {tables.map(table => renderTable(table))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.isOpen && (
        <TableContextMenu
          tableId={contextMenu.tableId}
          tableName={contextMenu.tableName}
          tableStatus={contextMenu.tableStatus}
          position={contextMenu.position}
          onClose={closeContextMenu}
          onViewDetails={handleTableDetails}
          onAssignReservation={handleAssignReservation}
          onCreateReservation={handleCreateReservation}
          onReleaseTable={handleReleaseTable}
          onEditTable={handleEditTable}
          onDeleteTable={handleDeleteTable}
        />
      )}

      {/* Table Details Modal */}
      {detailsModal.isOpen && (
        <TableDetailsModal
          isOpen={detailsModal.isOpen}
          onClose={closeDetailsModal}
          table={{
            id: detailsModal.tableId,
            number: tables.find(t => t.id === detailsModal.tableId)?.number || '',
            capacity: tables.find(t => t.id === detailsModal.tableId)?.capacity || 0,
            areaName: areas.find(a => a.id === (tables.find(t => t.id === detailsModal.tableId) as any)?.areaId)?.name || '',
            status: (tables.find(t => t.id === detailsModal.tableId) as any)?.currentStatus || 'available',
            shape: (tables.find(t => t.id === detailsModal.tableId) as any)?.shape || 'square',
            isAccessible: (tables.find(t => t.id === detailsModal.tableId) as any)?.isAccessible || false,
          }}
          currentReservation={(tables.find(t => t.id === detailsModal.tableId) as any)?.currentReservation}
          reservationHistory={[]} // This would be populated with actual reservation history
          onReleaseTable={handleReleaseTable}
          onEditReservation={(reservationId) => console.log('Edit reservation:', reservationId)}
          onCancelReservation={(reservationId) => console.log('Cancel reservation:', reservationId)}
        />
      )}
    </div>
  );
}