import { ReactNode } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface Reservation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  partySize: number;
  tableId?: string;
  tableName?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';
  specialRequests?: string;
  createdAt: string;
}

interface ReservationCardProps {
  reservation: Reservation;
  onEdit?: (reservation: Reservation) => void;
  onCancel?: (reservation: Reservation) => void;
  onConfirm?: (reservation: Reservation) => void;
  onSeat?: (reservation: Reservation) => void;
  onComplete?: (reservation: Reservation) => void;
  className?: string;
  compact?: boolean;
  showActions?: boolean;
}

export default function ReservationCard({
  reservation,
  onEdit,
  onCancel,
  onConfirm,
  onSeat,
  onComplete,
  className,
  compact = false,
  showActions = true,
}: ReservationCardProps) {
  const getStatusVariant = () => {
    switch (reservation.status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'primary';
      case 'seated':
        return 'success';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    switch (reservation.status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmada';
      case 'seated':
        return 'En mesa';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return reservation.status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const renderActions = () => {
    if (!showActions) return null;

    const actions: ReactNode[] = [];

    switch (reservation.status) {
      case 'pending':
        actions.push(
          <Button key="confirm" size="sm" onClick={() => onConfirm?.(reservation)}>
            Confirmar
          </Button>,
          <Button key="edit" size="sm" variant="outline" onClick={() => onEdit?.(reservation)}>
            Editar
          </Button>,
          <Button key="cancel" size="sm" variant="error" onClick={() => onCancel?.(reservation)}>
            Cancelar
          </Button>
        );
        break;
      case 'confirmed':
        actions.push(
          <Button key="seat" size="sm" onClick={() => onSeat?.(reservation)}>
            Sentar
          </Button>,
          <Button key="edit" size="sm" variant="outline" onClick={() => onEdit?.(reservation)}>
            Editar
          </Button>,
          <Button key="cancel" size="sm" variant="error" onClick={() => onCancel?.(reservation)}>
            Cancelar
          </Button>
        );
        break;
      case 'seated':
        actions.push(
          <Button key="complete" size="sm" onClick={() => onComplete?.(reservation)}>
            Completar
          </Button>,
          <Button key="edit" size="sm" variant="outline" onClick={() => onEdit?.(reservation)}>
            Editar
          </Button>
        );
        break;
      case 'completed':
        actions.push(
          <Button key="new" size="sm" variant="outline" onClick={() => onEdit?.(reservation)}>
            Nueva Reserva
          </Button>
        );
        break;
      case 'cancelled':
        actions.push(
          <Button key="new" size="sm" variant="outline" onClick={() => onEdit?.(reservation)}>
            Nueva Reserva
          </Button>
        );
        break;
    }

    return <div className="flex gap-2 mt-4">{actions}</div>;
  };

  if (compact) {
    return (
      <div className={cn('border border-secondary-200 rounded-lg p-4 bg-white', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h3 className="font-medium text-secondary-900">{reservation.customerName}</h3>
              <p className="text-sm text-secondary-600">
                {formatDate(reservation.date)} a las {formatTime(reservation.time)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={getStatusVariant()}>{getStatusText()}</Badge>
            <span className="text-sm text-secondary-600">{reservation.partySize} personas</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{reservation.customerName}</CardTitle>
            <div className="flex items-center mt-1 space-x-2">
              <Badge variant={getStatusVariant()}>{getStatusText()}</Badge>
              <span className="text-sm text-secondary-600">{reservation.partySize} personas</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(reservation.date)}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatTime(reservation.time)}</span>
          </div>
          
          {reservation.tableName && (
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Mesa {reservation.tableName}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{reservation.customerEmail}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{reservation.customerPhone}</span>
          </div>
          
          {reservation.specialRequests && (
            <div className="mt-3 p-2 bg-secondary-50 rounded text-sm">
              <p className="font-medium text-secondary-700 mb-1">Notas especiales:</p>
              <p className="text-secondary-600">{reservation.specialRequests}</p>
            </div>
          )}
        </div>
        
        {renderActions()}
      </CardContent>
    </Card>
  );
}