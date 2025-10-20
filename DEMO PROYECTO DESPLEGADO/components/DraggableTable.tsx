'use client';

import { useState } from 'react';
import { Table, Reservation } from '@/types';

interface DraggableTableProps {
  table: Table;
  onPositionChange: (tableId: string, positionX: number, positionY: number) => void;
  onTableClick: (table: Table) => void;
  isSelected?: boolean;
  isDragging?: boolean;
  reservations?: Reservation[];
  selectedDate?: string;
}

export default function DraggableTable({
  table,
  onPositionChange,
  onTableClick,
  isSelected = false,
  isDragging = false,
  reservations = [],
  selectedDate,
}: DraggableTableProps) {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isLocalDragging, setIsLocalDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsLocalDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isLocalDragging || !dragStart) return;

    const container = e.currentTarget.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newX = ((e.clientX - containerRect.left - dragStart.x) / containerRect.width) * 100;
    const newY = ((e.clientY - containerRect.top - dragStart.y) / containerRect.height) * 100;

    // Constrain to container bounds
    const constrainedX = Math.max(0, Math.min(95, newX)); // 95% to keep table fully visible
    const constrainedY = Math.max(0, Math.min(95, newY));

    onPositionChange(table.id, constrainedX, constrainedY);
  };

  const handleMouseUp = () => {
    setIsLocalDragging(false);
    setDragStart(null);
  };

  const getTableColor = () => {
    // Check if table has reservations for the selected date
    if (selectedDate && reservations) {
      const hasReservation = reservations.some(r => {
        const resDate = new Date(r.date).toISOString().split('T')[0];
        return resDate === selectedDate && r.tableId === table.id && r.status !== 'cancelled';
      });
      
      if (hasReservation) {
        return 'bg-yellow-500'; // Reserved
      }
    }
    
    if (!table.isAvailable) return 'bg-red-500'; // Occupied
    return 'bg-green-500'; // Available
  };

  const getPositionStyle = () => {
    if (table.positionX !== undefined && table.positionY !== undefined) {
      return {
        position: 'absolute' as const,
        left: `${table.positionX}%`,
        top: `${table.positionY}%`,
        transform: 'translate(-50%, -50%)',
      };
    }
    return {};
  };

  return (
    <div
      className={`
        absolute w-16 h-16 rounded-full flex flex-col items-center justify-center
        cursor-move select-none transition-all duration-200 shadow-lg
        ${getTableColor()}
        ${isSelected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
        ${isDragging || isLocalDragging ? 'opacity-75 scale-110 z-50' : 'hover:scale-105 z-10'}
        text-white font-semibold text-xs
      `}
      style={getPositionStyle()}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => onTableClick(table)}
      title={`Mesa ${table.number} - ${table.capacity} personas${getTableStatusText()}`}
    >
      <div className="text-lg leading-none">{table.number}</div>
      <div className="text-xs leading-none mt-1">{table.capacity}</div>
    </div>
  );
  
  function getTableStatusText() {
    if (selectedDate && reservations) {
      const hasReservation = reservations.some(r => {
        const resDate = new Date(r.date).toISOString().split('T')[0];
        return resDate === selectedDate && r.tableId === table.id && r.status !== 'cancelled';
      });
      
      if (hasReservation) {
        const reservation = reservations.find(r => {
          const resDate = new Date(r.date).toISOString().split('T')[0];
          return resDate === selectedDate && r.tableId === table.id && r.status !== 'cancelled';
        });
        return ` - Reservada (${reservation?.time})`;
      }
    }
    
    if (!table.isAvailable) return ' - Ocupada';
    return ' - Disponible';
  }
}