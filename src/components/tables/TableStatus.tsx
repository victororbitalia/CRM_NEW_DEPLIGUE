'use client';

import React from 'react';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

// Extender el tipo Table para incluir propiedades adicionales
interface Table {
  id: string;
  number: string;
  capacity: number;
  areaId: string;
  area?: {
    id: string;
    name: string;
  };
  currentStatus?: string;
  currentReservation?: {
    id: string;
    customerName: string;
    startTime: string;
    endTime: string;
    partySize: number;
  };
  upcomingMaintenance?: {
    id: string;
    reason: string;
    scheduledStart: string;
    scheduledEnd: string;
  };
}

interface TableStatusProps {
  table: Table;
  onStatusChange?: (tableId: string, newStatus: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

const TableStatus: React.FC<TableStatusProps> = ({
  table,
  onStatusChange,
  showActions = false,
  compact = false,
}) => {
  // Obtener configuración según estado
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return {
          label: 'Disponible',
          color: 'success',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        };
      case 'occupied':
        return {
          label: 'Ocupada',
          color: 'error',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case 'reserved':
        return {
          label: 'Reservada',
          color: 'warning',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case 'maintenance':
        return {
          label: 'Mantenimiento',
          color: 'secondary',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        };
      default:
        return {
          label: 'Desconocido',
          color: 'secondary',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
    }
  };

  const status = table.currentStatus || 'available';
  const statusConfig = getStatusConfig(status);

  // Formatear hora
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Renderizar vista compacta
  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <Badge color={statusConfig.color as any} className="flex items-center space-x-1">
          {statusConfig.icon}
          <span>{statusConfig.label}</span>
        </Badge>
        <span className="text-sm text-gray-600">
          Mesa {table.number} ({table.capacity} pers.)
        </span>
      </div>
    );
  }

  // Renderizar vista completa
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                Mesa {table.number}
              </h3>
              <Badge color={statusConfig.color as any} className="flex items-center space-x-1">
                {statusConfig.icon}
                <span>{statusConfig.label}</span>
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Capacidad:</span>
                <span className="ml-2 font-medium">{table.capacity} personas</span>
              </div>
              <div>
                <span className="text-gray-500">Área:</span>
                <span className="ml-2 font-medium">{table.area?.name || 'Sin asignar'}</span>
              </div>
            </div>

            {/* Información de reserva actual */}
            {table.currentReservation && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-yellow-800">Reserva actual</span>
                </div>
                <div className="text-sm text-yellow-700">
                  <p>Cliente: {table.currentReservation.customerName}</p>
                  <p>Hora: {formatTime(table.currentReservation.startTime)} - {formatTime(table.currentReservation.endTime)}</p>
                  <p>Comensales: {table.currentReservation.partySize}</p>
                </div>
              </div>
            )}

            {/* Información de mantenimiento próximo */}
            {table.upcomingMaintenance && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-800">Mantenimiento programado</span>
                </div>
                <div className="text-sm text-gray-700">
                  <p>Motivo: {table.upcomingMaintenance.reason}</p>
                  <p>Fecha: {new Date(table.upcomingMaintenance.scheduledStart).toLocaleDateString('es-ES')}</p>
                  <p>Hora: {formatTime(table.upcomingMaintenance.scheduledStart)} - {formatTime(table.upcomingMaintenance.scheduledEnd)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Acciones */}
          {showActions && onStatusChange && (
            <div className="ml-4">
              <div className="flex flex-col space-y-2">
                {status === 'available' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(table.id, 'occupied')}
                  >
                    Marcar como ocupada
                  </Button>
                )}
                {status === 'occupied' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(table.id, 'available')}
                  >
                    Liberar mesa
                  </Button>
                )}
                {status === 'reserved' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(table.id, 'occupied')}
                  >
                    Sentar clientes
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TableStatus;