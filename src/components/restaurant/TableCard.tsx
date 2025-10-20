import { ReactNode } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  location?: string;
  shape?: 'round' | 'square' | 'rectangle';
  currentReservation?: {
    id: string;
    customerName: string;
    time: string;
  };
}

interface TableCardProps {
  table: Table;
  onEdit?: (table: Table) => void;
  onReserve?: (table: Table) => void;
  onRelease?: (table: Table) => void;
  onSelect?: (table: Table) => void;
  className?: string;
  compact?: boolean;
  showActions?: boolean;
  selectable?: boolean;
  selected?: boolean;
}

export default function TableCard({
  table,
  onEdit,
  onReserve,
  onRelease,
  onSelect,
  className,
  compact = false,
  showActions = true,
  selectable = false,
  selected = false,
}: TableCardProps) {
  const getStatusVariant = () => {
    switch (table.status) {
      case 'available':
        return 'success';
      case 'occupied':
        return 'error';
      case 'reserved':
        return 'warning';
      case 'maintenance':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    switch (table.status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return table.status;
    }
  };

  const getShapeIcon = () => {
    switch (table.shape) {
      case 'round':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="8" strokeWidth={2} />
          </svg>
        );
      case 'square':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="6" y="6" width="12" height="12" strokeWidth={2} />
          </svg>
        );
      case 'rectangle':
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="4" y="8" width="16" height="8" strokeWidth={2} />
          </svg>
        );
    }
  };

  const renderActions = () => {
    if (!showActions) return null;

    const actions: ReactNode[] = [];

    switch (table.status) {
      case 'available':
        actions.push(
          <Button key="reserve" size="sm" onClick={() => onReserve?.(table)}>
            Reservar
          </Button>,
          <Button key="edit" size="sm" variant="outline" onClick={() => onEdit?.(table)}>
            Editar
          </Button>
        );
        break;
      case 'occupied':
        actions.push(
          <Button key="release" size="sm" variant="outline" onClick={() => onRelease?.(table)}>
            Liberar
          </Button>,
          <Button key="edit" size="sm" variant="outline" onClick={() => onEdit?.(table)}>
            Editar
          </Button>
        );
        break;
      case 'reserved':
        actions.push(
          <Button key="release" size="sm" variant="outline" onClick={() => onRelease?.(table)}>
            Liberar
          </Button>,
          <Button key="edit" size="sm" variant="outline" onClick={() => onEdit?.(table)}>
            Editar
          </Button>
        );
        break;
      case 'maintenance':
        actions.push(
          <Button key="available" size="sm" onClick={() => onRelease?.(table)}>
            Disponible
          </Button>,
          <Button key="edit" size="sm" variant="outline" onClick={() => onEdit?.(table)}>
            Editar
          </Button>
        );
        break;
    }

    return <div className="flex gap-2 mt-4">{actions}</div>;
  };

  const handleCardClick = () => {
    if (selectable) {
      onSelect?.(table);
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          'border border-gray-200 rounded-lg p-4 bg-white cursor-pointer transition-all',
          selected && 'ring-2 ring-blue-500 border-blue-500',
          className
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-gray-600">
              {getShapeIcon()}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Mesa {table.number}</h3>
              <p className="text-sm text-gray-600">{table.capacity} personas</p>
            </div>
          </div>
          <Badge variant={getStatusVariant()}>{getStatusText()}</Badge>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'h-full cursor-pointer transition-all',
        selectable && 'hover:shadow-md',
        selected && 'ring-2 ring-blue-500 border-blue-500',
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-gray-600">
              {getShapeIcon()}
            </div>
            <div>
              <CardTitle className="text-lg">Mesa {table.number}</CardTitle>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-600">{table.capacity} personas</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          {/* Status badge moved here */}
          <div className="flex justify-center">
            <Badge variant={getStatusVariant()}>{getStatusText()}</Badge>
          </div>
          {table.location && (
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-800">{table.location}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-gray-800">Capacidad: {table.capacity} personas</span>
          </div>
          
          {table.currentReservation && (
            <div className="mt-3 p-2 bg-warning-50 border border-warning-200 rounded text-sm">
              <p className="font-medium text-warning-700 mb-1">Reserva actual:</p>
              <p className="text-warning-700 font-medium">{table.currentReservation.customerName}</p>
              <p className="text-warning-700">{table.currentReservation.time}</p>
            </div>
          )}
          
          {table.status === 'maintenance' && (
            <div className="mt-3 p-2 bg-secondary-50 border border-secondary-200 rounded text-sm">
              <p className="font-medium text-gray-700">En mantenimiento</p>
            </div>
          )}
        </div>
        
        {renderActions()}
      </CardContent>
    </Card>
  );
}