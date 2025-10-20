'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, Zone, TableMapData } from '@/types';
import DraggableTable from './DraggableTable';
import TableZone from './TableZone';
import TableMapControls from './TableMapControls';
import TableEditModal from './TableEditModal';
import TableMapZoomControls from './TableMapZoomControls';

interface TableMapProps {
  onTableSelect?: (table: Table | null) => void;
  selectedTableId?: string;
}

export default function TableMap({ onTableSelect, selectedTableId }: TableMapProps) {
  const [tableMapData, setTableMapData] = useState<TableMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>();
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [isEditingZones, setIsEditingZones] = useState(false);
  const [selectedZoneForTable, setSelectedZoneForTable] = useState<Zone | null>(null);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Zoom and pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Fetch table map data
  const fetchTableMapData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tables/map');
      if (!response.ok) {
        throw new Error('Failed to fetch table map data');
      }
      const data = await response.json();
      setTableMapData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch reservations for selected date
  const fetchReservations = useCallback(async () => {
    try {
      const response = await fetch(`/api/reservations?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setReservations(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  }, [selectedDate]);

  // Update table position
  const updateTablePosition = useCallback(async (tableId: string, positionX: number, positionY: number) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/position`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ positionX, positionY }),
      });

      if (!response.ok) {
        throw new Error('Failed to update table position');
      }

      // Update local state
      if (tableMapData) {
        setTableMapData({
          ...tableMapData,
          tables: tableMapData.tables.map(table =>
            table.id === tableId
              ? { ...table, positionX, positionY }
              : table
          ),
        });
      }
    } catch (err) {
      console.error('Error updating table position:', err);
    }
  }, [tableMapData]);

  // Handle table save from modal
  const handleTableSave = useCallback(async (updatedTable: Table) => {
    try {
      const response = await fetch(`/api/tables/${updatedTable.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isAvailable: updatedTable.isAvailable,
          positionX: updatedTable.positionX,
          positionY: updatedTable.positionY,
          zoneId: updatedTable.zoneId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update table');
      }

      // Refresh data
      fetchTableMapData();
      setEditingTable(null);
    } catch (err) {
      console.error('Error updating table:', err);
    }
  }, [fetchTableMapData]);

  // Handle table delete from modal
  const handleTableDelete = useCallback(async (tableId: string) => {
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete table');
      }

      // Refresh data
      fetchTableMapData();
      setEditingTable(null);
    } catch (err) {
      console.error('Error deleting table:', err);
    }
  }, [fetchTableMapData]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2)); // Max zoom 200%
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5)); // Min zoom 50%
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('map-container')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Handle wheel event for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Handle table click
  const handleTableClick = useCallback((table: Table) => {
    if (isAddingTable && selectedZoneForTable) {
      // If adding table, ignore table clicks
      return;
    }
    
    // Check for double-click to edit (simple implementation)
    if (editingTable && editingTable.id === table.id) {
      setIsEditModalOpen(true);
    } else {
      setEditingTable(table);
      onTableSelect?.(table);
    }
  }, [isAddingTable, selectedZoneForTable, onTableSelect, editingTable]);

  // Handle zone click (for adding tables)
  const handleZoneClick = useCallback((zone: Zone) => {
    if (isAddingTable) {
      setSelectedZoneForTable(zone);
      // Here you would open a modal to create a new table in this zone
      createNewTableInZone(zone);
    }
  }, [isAddingTable]);

  // Create new table in zone
  const createNewTableInZone = async (zone: Zone) => {
    try {
      // Calculate a default position within the zone
      const defaultX = zone.boundaryX !== undefined && zone.width !== undefined
        ? zone.boundaryX + zone.width / 2
        : 50;
      const defaultY = zone.boundaryY !== undefined && zone.height !== undefined
        ? zone.boundaryY + zone.height / 2
        : 50;

      // Find next table number
      const maxNumber = Math.max(...(tableMapData?.tables.map(t => t.number) || [0]));
      
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: maxNumber + 1,
          capacity: 4, // Default capacity
          location: zone.name,
          positionX: defaultX,
          positionY: defaultY,
          zoneId: zone.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create table');
      }

      // Refresh data
      fetchTableMapData();
      setIsAddingTable(false);
      setSelectedZoneForTable(null);
    } catch (err) {
      console.error('Error creating table:', err);
    }
  };

  // Filter tables by zone
  const filteredTables = tableMapData?.tables.filter(table => {
    if (!selectedZoneId) return true;
    return table.zoneId === selectedZoneId;
  }) || [];

  // Group tables by zone
  const tablesByZone = filteredTables.reduce((acc, table) => {
    const zoneId = table.zoneId || 'unassigned';
    if (!acc[zoneId]) acc[zoneId] = [];
    acc[zoneId].push(table);
    return acc;
  }, {} as Record<string, Table[]>);

  useEffect(() => {
    fetchTableMapData();
  }, [fetchTableMapData]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-lg">Cargando mapa de mesas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!tableMapData) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500">No hay datos disponibles</div>
      </div>
    );
  }

  return (
    <div>
      <TableMapControls
        zones={tableMapData.zones}
        selectedZoneId={selectedZoneId}
        onZoneFilterChange={setSelectedZoneId}
        onAddTable={() => setIsAddingTable(true)}
        onAddZone={() => {/* TODO: Implement add zone modal */}}
        onEditZones={() => setIsEditingZones(!isEditingZones)}
        isAddingTable={isAddingTable}
        isEditingZones={isEditingZones}
      />
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <div className="flex items-center gap-4">
          <label htmlFor="date-select" className="text-sm font-medium">
            Ver reservas para:
          </label>
          <input
            id="date-select"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div
        className="relative bg-gray-100 rounded-lg shadow-inner overflow-hidden"
        style={{ paddingBottom: '60%', cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="absolute inset-0 overflow-hidden rounded-lg map-container"
          style={{
            transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          {/* Render zones */}
          {tableMapData.zones.map((zone) => (
            <TableZone
              key={zone.id}
              zone={zone}
              isSelected={selectedZoneForTable?.id === zone.id}
              onZoneClick={handleZoneClick}
            >
              {/* Render tables in this zone */}
              {tablesByZone[zone.id]?.map((table) => (
                <DraggableTable
                  key={table.id}
                  table={table}
                  onPositionChange={updateTablePosition}
                  onTableClick={handleTableClick}
                  isSelected={selectedTableId === table.id}
                  reservations={reservations}
                  selectedDate={selectedDate}
                />
              ))}
            </TableZone>
          ))}

          {/* Render unassigned tables */}
          {tablesByZone['unassigned']?.map((table) => (
            <DraggableTable
              key={table.id}
              table={table}
              onPositionChange={updateTablePosition}
              onTableClick={handleTableClick}
              isSelected={selectedTableId === table.id}
              reservations={reservations}
              selectedDate={selectedDate}
            />
          ))}
        </div>

        {/* Instructions when adding table */}
        {isAddingTable && (
          <div className="absolute top-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-md shadow-md z-20">
            <p className="font-medium">Selecciona una zona para añadir una nueva mesa</p>
            <button
              onClick={() => {
                setIsAddingTable(false);
                setSelectedZoneForTable(null);
              }}
              className="mt-2 text-xs underline"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <TableMapZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetZoom}
        zoomLevel={zoomLevel}
      />

      {/* Table Edit Modal */}
      {isEditModalOpen && editingTable && (
        <TableEditModal
          table={editingTable}
          zones={tableMapData.zones}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTable(null);
          }}
          onSave={handleTableSave}
          onDelete={handleTableDelete}
        />
      )}
    </div>
  );
}