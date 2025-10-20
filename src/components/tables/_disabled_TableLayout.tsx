'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Area } from '@/types';

// Extender el tipo Table para incluir propiedades adicionales
interface Table {
  id: string;
  areaId: string;
  number: string;
  capacity: number;
  minCapacity?: number;
  positionX?: number | null;
  positionY?: number | null;
  width?: number | null;
  height?: number | null;
  shape?: string | null;
  isAccessible?: boolean;
  isActive?: boolean;
  currentStatus?: string;
  currentReservation?: any;
  upcomingMaintenance?: any;
}

interface TableLayoutProps {
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

interface TablePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AreaPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const TableLayout: React.FC<TableLayoutProps> = ({
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
  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  const [draggedArea, setDraggedArea] = useState<string | null>(null);
  const [resizingArea, setResizingArea] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [tablePositions, setTablePositions] = useState<Record<string, TablePosition>>({});
  const [areaPositions, setAreaPositions] = useState<Record<string, AreaPosition>>({});
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Inicializar posiciones de las mesas y áreas
  useEffect(() => {
    const tablePos: Record<string, TablePosition> = {};
    const areaPos: Record<string, AreaPosition> = {};
    
    // Asignar posiciones fijas a las áreas
    areas.forEach((area, index) => {
      const areaRow = Math.floor(index / 2);
      const areaCol = index % 2;
      
      areaPos[area.id] = {
        id: area.id,
        x: areaCol * 600 + 100,
        y: areaRow * 400 + 100,
        width: 500,
        height: 300,
      };
    });
    
    // Agrupar mesas por área
    const tablesByArea: Record<string, Table[]> = {};
    tables.forEach(table => {
      if (!tablesByArea[table.areaId]) {
        tablesByArea[table.areaId] = [];
      }
      tablesByArea[table.areaId].push(table);
    });
    
    // Asignar posiciones a las mesas por área
    Object.entries(tablesByArea).forEach(([areaId, areaTables]) => {
      const area = areaPos[areaId];
      if (!area) return;
      
      areaTables.forEach((table, tableIndex) => {
        const tableWidth = table.width || 80;
        const tableHeight = table.height || 80;
        
        if (table.positionX !== null && table.positionY !== null) {
          // Usar posición guardada pero dentro del área
          const areaX = area.x;
          const areaY = area.y;
          const relX = Math.min(table.positionX || 0, area.width - tableWidth - 40);
          const relY = Math.min(table.positionY || 0, area.height - tableHeight - 40);
          
          // Aplicar snap a la cuadrícula
          const snappedX = Math.round((areaX + 20 + relX) / 20) * 20;
          const snappedY = Math.round((areaY + 40 + relY) / 20) * 20;
          
          tablePos[table.id] = {
            id: table.id,
            x: snappedX,
            y: snappedY,
            width: tableWidth,
            height: tableHeight,
          };
        } else {
          // Asignar posición automática dentro del área con espaciado uniforme
          const areaX = area.x;
          const areaY = area.y;
          const cols = Math.floor((area.width - 40) / 100); // Máximo 3 columnas con espacio
          const tableCol = tableIndex % cols;
          const tableRow = Math.floor(tableIndex / cols);
          
          // Calcular posición con espaciado uniforme
          const spacingX = (area.width - 40 - cols * tableWidth) / (cols + 1);
          const spacingY = 100; // Espacio fijo entre filas
          
          const snappedX = Math.round((areaX + spacingX + tableCol * (tableWidth + spacingX)) / 20) * 20;
          const snappedY = Math.round((areaY + 40 + tableRow * spacingY) / 20) * 20;
          
          tablePos[table.id] = {
            id: table.id,
            x: snappedX,
            y: snappedY,
            width: tableWidth,
            height: tableHeight,
          };
        }
      });
    });
    
    setTablePositions(tablePos);
    setAreaPositions(areaPos);
  }, [tables, areas]);

  // Manejar zoom con rueda del mouse
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prevScale => Math.min(Math.max(0.5, prevScale * delta), 3));
  };

  // Manejar inicio de arrastre de mesa
  const handleTableMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (!editable) return;
    
    e.stopPropagation();
    setDraggedTable(tableId);
  };
  
  // Manejar inicio de arrastre de área
  const handleAreaMouseDown = (e: React.MouseEvent, areaId: string) => {
    if (!editable) return;
    
    e.stopPropagation();
    setDraggedArea(areaId);
  };
  
  // Manejar inicio de redimensionamiento de área
  const handleAreaResizeStart = (e: React.MouseEvent, areaId: string, handle: string) => {
    if (!editable) return;
    
    e.stopPropagation();
    setResizingArea(areaId);
    setResizeHandle(handle);
  };

  // Manejar movimiento del mouse
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedTable && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / scale;
      const y = (e.clientY - rect.top - offset.y) / scale;
      
      setTablePositions(prev => {
        const tablePos = prev[draggedTable];
        if (!tablePos) return prev;
        
        // Encontrar el área al que pertenece esta mesa
        const table = tables.find(t => t.id === draggedTable);
        if (!table) return prev;
        
        const areaPos = areaPositions[table.areaId];
        if (!areaPos) return prev;
        
        // Calcular nueva posición con restricciones para mantener la mesa dentro de su área
        let newX = x - tablePos.width / 2;
        let newY = y - tablePos.height / 2;
        
        // Restringir dentro del área
        newX = Math.max(areaPos.x + 20, Math.min(newX, areaPos.x + areaPos.width - tablePos.width - 20));
        newY = Math.max(areaPos.y + 40, Math.min(newY, areaPos.y + areaPos.height - tablePos.height - 20));
        
        // AplicarSnap a una cuadrícula de 20px para mejor alineación
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;
        
        return {
          ...prev,
          [draggedTable]: {
            ...tablePos,
            x: newX,
            y: newY,
          },
        };
      });
    } else if (draggedArea && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / scale;
      const y = (e.clientY - rect.top - offset.y) / scale;
      
      setAreaPositions(prev => {
        const area = prev[draggedArea];
        if (!area) return prev;
        
        const newPos = {
          ...prev,
          [draggedArea]: {
            ...area,
            x: Math.max(0, x - area.width / 2),
            y: Math.max(0, y - area.height / 2),
          },
        };
        
        // Mover todas las mesas del área
        const deltaX = newPos[draggedArea].x - area.x;
        const deltaY = newPos[draggedArea].y - area.y;
        
        setTablePositions(tablePrev => {
          const updatedTablePos = { ...tablePrev };
          tables.forEach(table => {
            if (table.areaId === draggedArea && updatedTablePos[table.id]) {
              updatedTablePos[table.id] = {
                ...updatedTablePos[table.id],
                x: updatedTablePos[table.id].x + deltaX,
                y: updatedTablePos[table.id].y + deltaY,
              };
            }
          });
          
          return updatedTablePos;
        });
        
        return newPos;
      });
    } else if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (resizingArea && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / scale;
      const y = (e.clientY - rect.top - offset.y) / scale;
      
      setAreaPositions(prev => {
        const area = prev[resizingArea];
        if (!area) return prev;
        
        let newWidth = area.width;
        let newHeight = area.height;
        
        // Calcular nuevo tamaño según el handle
        if (resizeHandle?.includes('right')) {
          newWidth = Math.max(200, x - area.x);
        } else if (resizeHandle?.includes('left')) {
          const newRight = area.x + area.width;
          newWidth = Math.max(200, newRight - x);
          if (newWidth > 200) {
            // Mover las mesas si el área se mueve
            const deltaX = x - area.x;
            setTablePositions(tablePrev => {
              const updatedTablePos = { ...tablePrev };
              tables.forEach(table => {
                if (table.areaId === resizingArea && updatedTablePos[table.id]) {
                  updatedTablePos[table.id] = {
                    ...updatedTablePos[table.id],
                    x: updatedTablePos[table.id].x + deltaX,
                  };
                }
              });
              return updatedTablePos;
            });
          }
        }
        
        if (resizeHandle?.includes('bottom')) {
          newHeight = Math.max(200, y - area.y);
        } else if (resizeHandle?.includes('top')) {
          const newBottom = area.y + area.height;
          newHeight = Math.max(200, newBottom - y);
          if (newHeight > 200) {
            // Mover las mesas si el área se mueve
            const deltaY = y - area.y;
            setTablePositions(tablePrev => {
              const updatedTablePos = { ...tablePrev };
              tables.forEach(table => {
                if (table.areaId === resizingArea && updatedTablePos[table.id]) {
                  updatedTablePos[table.id] = {
                    ...updatedTablePos[table.id],
                    y: updatedTablePos[table.id].y + deltaY,
                  };
                }
              });
              return updatedTablePos;
            });
          }
        }
        
        return {
          ...prev,
          [resizingArea]: {
            ...area,
            width: newWidth,
            height: newHeight,
            x: resizeHandle?.includes('left') && newWidth > 200 ? area.x + area.width - newWidth : area.x,
            y: resizeHandle?.includes('top') && newHeight > 200 ? area.y + area.height - newHeight : area.y,
          },
        };
      });
    }
  };

  // Manejar fin de arrastre
  const handleMouseUp = () => {
    if (draggedTable && onTableMove) {
      const position = tablePositions[draggedTable];
      if (position) {
        onTableMove(draggedTable, position.x, position.y);
      }
    }
    
    if (draggedArea && onAreaMove) {
      const position = areaPositions[draggedArea];
      if (position) {
        onAreaMove(draggedArea, position.x, position.y);
      }
    }
    
    if (resizingArea && onAreaResize) {
      const position = areaPositions[resizingArea];
      if (position) {
        onAreaResize(resizingArea, position.width, position.height);
      }
    }
    
    setDraggedTable(null);
    setDraggedArea(null);
    setResizingArea(null);
    setResizeHandle(null);
    setIsPanning(false);
  };

  // Manejar inicio de paneo
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('layout-area')) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    }
  };

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
    const position = tablePositions[table.id];
    if (!position) return null;

    const isSelected = selectedTableId === table.id;
    const isBeingDragged = draggedTable === table.id;

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
        onMouseDown={(e) => handleTableMouseDown(e, table.id)}
        onClick={() => onTableSelect && onTableSelect(table.id)}
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
    const position = areaPositions[area.id];
    if (!position) return null;
    
    const isBeingDragged = draggedArea === area.id;
    const isBeingResized = resizingArea === area.id;

    return (
      <div
        key={area.id}
        className={`absolute border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg layout-area flex items-center justify-center ${
          editable ? 'cursor-move' : ''
        } ${isBeingDragged ? 'opacity-75 z-10' : ''} ${isBeingResized ? 'opacity-75 z-10' : 'hover:z-5'}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${position.width}px`,
          height: `${position.height}px`,
        }}
        onMouseDown={(e) => handleAreaMouseDown(e, area.id)}
      >
        <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded text-sm font-medium text-gray-700">
          {area.name}
        </div>
        
        {/* Handles para redimensionar */}
        {editable && (
          <>
            {/* Corner handles */}
            <div
              className="absolute top-0 left-0 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize z-20"
              style={{ transform: 'translate(-50%, -50%)' }}
              onMouseDown={(e) => handleAreaResizeStart(e, area.id, 'top-left')}
            />
            <div
              className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize z-20"
              style={{ transform: 'translate(50%, -50%)' }}
              onMouseDown={(e) => handleAreaResizeStart(e, area.id, 'top-right')}
            />
            <div
              className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize z-20"
              style={{ transform: 'translate(-50%, 50%)' }}
              onMouseDown={(e) => handleAreaResizeStart(e, area.id, 'bottom-left')}
            />
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize z-20"
              style={{ transform: 'translate(50%, 50%)' }}
              onMouseDown={(e) => handleAreaResizeStart(e, area.id, 'bottom-right')}
            />
            
            {/* Edge handles */}
            <div
              className="absolute top-0 left-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-n-resize z-20"
              style={{ transform: 'translate(-50%, -50%)' }}
              onMouseDown={(e) => handleAreaResizeStart(e, area.id, 'top')}
            />
            <div
              className="absolute bottom-0 left-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-s-resize z-20"
              style={{ transform: 'translate(-50%, 50%)' }}
              onMouseDown={(e) => handleAreaResizeStart(e, area.id, 'bottom')}
            />
            <div
              className="absolute left-0 top-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-w-resize z-20"
              style={{ transform: 'translate(-50%, -50%)' }}
              onMouseDown={(e) => handleAreaResizeStart(e, area.id, 'left')}
            />
            <div
              className="absolute right-0 top-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-e-resize z-20"
              style={{ transform: 'translate(50%, -50%)' }}
              onMouseDown={(e) => handleAreaResizeStart(e, area.id, 'right')}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 z-30 bg-white rounded-lg shadow-md p-2 flex flex-col gap-2">
        <button
          onClick={() => setScale(prev => Math.min(3, prev * 1.2))}
          className="p-2 hover:bg-gray-100 rounded"
          title="Acercar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          onClick={() => setScale(prev => Math.max(0.5, prev / 1.2))}
          className="p-2 hover:bg-gray-100 rounded"
          title="Alejar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={() => {
            setScale(1);
            setOffset({ x: 0, y: 0 });
          }}
          className="p-2 hover:bg-gray-100 rounded"
          title="Restablecer vista"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
      >
        <div
          className="relative"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: draggedTable || draggedArea || resizingArea ? 'none' : 'transform 0.2s',
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
            • Arrastra las áreas para reposicionarlas<br/>
            • Usa los handles azules para redimensionar las áreas<br/>
            • Usa la rueda del mouse para hacer zoom<br/>
            • Arrastra el fondo para mover la vista
          </p>
        </div>
      )}
    </div>
  );
};

export default TableLayout;