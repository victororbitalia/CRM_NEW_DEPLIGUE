'use client';

import { useState } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useNotifications } from '@/hooks/useNotifications';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isVip?: boolean;
  isBlacklisted?: boolean;
  notes?: string;
}

interface Table {
  id: string;
  number: string;
  capacity: number;
  area?: {
    name: string;
  };
}

interface Reservation {
  id: string;
  customer: Customer;
  table?: Table;
  date: Date;
  startTime: string;
  endTime: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  specialRequests?: string;
  occasion?: string;
  notes?: string;
  source?: string;
  depositAmount?: number;
  depositPaid?: boolean;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  seatedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

interface ReservationDetailProps {
  reservation: Reservation;
  onEdit?: (reservation: Reservation) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string, reason?: string) => void;
  onClose?: () => void;
  isLoading?: boolean;
}

const statusColors = {
  pending: 'bg-warning-100 text-warning-800 border-warning-200',
  confirmed: 'bg-primary-100 text-primary-800 border-primary-200',
  seated: 'bg-success-100 text-success-800 border-success-200',
  completed: 'bg-secondary-100 text-secondary-800 border-secondary-200',
  cancelled: 'bg-error-100 text-error-800 border-error-200',
  no_show: 'bg-error-100 text-error-800 border-error-200',
};

const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  seated: 'Sentada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No se presentó',
};

const sourceLabels = {
  manual: 'Manual',
  online: 'Online',
  phone: 'Teléfono',
  walk_in: 'Sin reserva',
};

const occasionLabels = {
  birthday: 'Cumpleaños',
  anniversary: 'Aniversario',
  business: 'Reunión de Negocios',
  date: 'Cita Romántica',
  celebration: 'Celebración',
  other: 'Otra',
};

export default function ReservationDetail({
  reservation,
  onEdit,
  onDelete,
  onStatusChange,
  onClose,
  isLoading = false,
}: ReservationDetailProps) {
  const [showCancellationReason, setShowCancellationReason] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const { showSuccess, showError } = useNotifications();

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return time;
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    try {
      if (onStatusChange) {
        await onStatusChange(reservation.id, newStatus, reason);
        showSuccess('Estado de reserva actualizado correctamente');
        setShowCancellationReason(false);
        setCancellationReason('');
      }
    } catch (error) {
      showError('Error al actualizar el estado de la reserva');
      console.error('Error updating reservation status:', error);
    }
  };

  const handleCancel = () => {
    setShowCancellationReason(true);
  };

  const confirmCancel = () => {
    handleStatusChange('cancelled', cancellationReason);
  };

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar esta reserva? Esta acción no se puede deshacer.')) {
      try {
        if (onDelete) {
          await onDelete(reservation.id);
          showSuccess('Reserva eliminada correctamente');
        }
      } catch (error) {
        showError('Error al eliminar la reserva');
        console.error('Error deleting reservation:', error);
      }
    }
  };

  const getNextStatusOptions = () => {
    switch (reservation.status) {
      case 'pending':
        return [
          { value: 'confirmed', label: 'Confirmar', color: 'primary' },
          { value: 'cancelled', label: 'Cancelar', color: 'error' },
        ];
      case 'confirmed':
        return [
          { value: 'seated', label: 'Sentar Cliente', color: 'success' },
          { value: 'cancelled', label: 'Cancelar', color: 'error' },
        ];
      case 'seated':
        return [
          { value: 'completed', label: 'Completar', color: 'secondary' },
        ];
      case 'completed':
      case 'cancelled':
      case 'no_show':
        return [];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">
            Detalles de la Reserva
          </h2>
          <p className="text-secondary-600">
            ID: {reservation.id}
          </p>
        </div>
        
        <div className="flex gap-2">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          )}
          
          {onEdit && (
            <Button variant="outline" onClick={() => onEdit(reservation)}>
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-4">
        <Badge className={statusColors[reservation.status]}>
          {statusLabels[reservation.status]}
        </Badge>
        
        <span className="text-sm text-secondary-500">
          Origen: {sourceLabels[reservation.source as keyof typeof sourceLabels] || 'Desconocido'}
        </span>
      </div>

      {/* Main Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-secondary-900">
                {reservation.customer.firstName} {reservation.customer.lastName}
              </h3>
              <p className="text-sm text-secondary-600">{reservation.customer.email}</p>
              {reservation.customer.phone && (
                <p className="text-sm text-secondary-600">{reservation.customer.phone}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              {reservation.customer.isVip && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  VIP
                </Badge>
              )}
              {reservation.customer.isBlacklisted && (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  En Lista Negra
                </Badge>
              )}
            </div>
            
            {reservation.customer.notes && (
              <div>
                <h4 className="text-sm font-medium text-secondary-700 mb-1">Notas del Cliente</h4>
                <p className="text-sm text-secondary-600">{reservation.customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservation Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Reserva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-secondary-700">Fecha y Hora</h4>
              <p className="text-sm text-secondary-900">
                {formatDate(reservation.date)}
              </p>
              <p className="text-sm text-secondary-600">
                {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-secondary-700">Nº de Comensales</h4>
              <p className="text-sm text-secondary-900">
                {reservation.partySize} {reservation.partySize === 1 ? 'comensal' : 'comensales'}
              </p>
            </div>
            
            {reservation.table && (
              <div>
                <h4 className="text-sm font-medium text-secondary-700">Mesa</h4>
                <p className="text-sm text-secondary-900">
                  Mesa {reservation.table.number} (Capacidad: {reservation.table.capacity})
                </p>
                {reservation.table.area && (
                  <p className="text-sm text-secondary-600">
                    Área: {reservation.table.area.name}
                  </p>
                )}
              </div>
            )}
            
            {reservation.occasion && (
              <div>
                <h4 className="text-sm font-medium text-secondary-700">Ocasión</h4>
                <p className="text-sm text-secondary-900">
                  {occasionLabels[reservation.occasion as keyof typeof occasionLabels] || reservation.occasion}
                </p>
              </div>
            )}
            
            {reservation.depositAmount && (
              <div>
                <h4 className="text-sm font-medium text-secondary-700">Depósito</h4>
                <p className="text-sm text-secondary-900">
                  ${reservation.depositAmount.toFixed(2)}
                </p>
                <p className="text-sm text-secondary-600">
                  Estado: {reservation.depositPaid ? 'Pagado' : 'Pendiente'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Special Requests & Notes */}
      {(reservation.specialRequests || reservation.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Información Adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reservation.specialRequests && (
              <div>
                <h4 className="text-sm font-medium text-secondary-700 mb-1">Peticiones Especiales</h4>
                <p className="text-sm text-secondary-600">{reservation.specialRequests}</p>
              </div>
            )}
            
            {reservation.notes && (
              <div>
                <h4 className="text-sm font-medium text-secondary-700 mb-1">Notas de la Reserva</h4>
                <p className="text-sm text-secondary-600">{reservation.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Línea de Tiempo de la Reserva</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-secondary-700">Creada:</span>
              <span className="text-sm text-secondary-900">
                {formatDateTime(reservation.createdAt)}
              </span>
            </div>
            
            {reservation.updatedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-secondary-700">Última Actualización:</span>
                <span className="text-sm text-secondary-900">
                  {formatDateTime(reservation.updatedAt)}
                </span>
              </div>
            )}
            
            {reservation.confirmedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-secondary-700">Confirmada:</span>
                <span className="text-sm text-secondary-900">
                  {formatDateTime(reservation.confirmedAt)}
                </span>
              </div>
            )}
            
            {reservation.seatedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-secondary-700">Sentada:</span>
                <span className="text-sm text-secondary-900">
                  {formatDateTime(reservation.seatedAt)}
                </span>
              </div>
            )}
            
            {reservation.completedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-secondary-700">Completada:</span>
                <span className="text-sm text-secondary-900">
                  {formatDateTime(reservation.completedAt)}
                </span>
              </div>
            )}
            
            {reservation.cancelledAt && (
              <div className="flex justify-between">
                <span className="text-sm text-secondary-700">Cancelada:</span>
                <span className="text-sm text-secondary-900">
                  {formatDateTime(reservation.cancelledAt)}
                </span>
              </div>
            )}
            
            {reservation.cancellationReason && (
              <div>
                <span className="text-sm font-medium text-secondary-700">Motivo de Cancelación:</span>
                <p className="text-sm text-secondary-900 mt-1">
                  {reservation.cancellationReason}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {getNextStatusOptions().map(option => (
              <Button
                key={option.value}
                variant={option.color as any}
                onClick={() => {
                  if (option.value === 'cancelled') {
                    handleCancel();
                  } else {
                    handleStatusChange(option.value);
                  }
                }}
                disabled={isLoading}
              >
                {option.label}
              </Button>
            ))}
            
            {onDelete && (
              <Button
                variant="error"
                onClick={handleDelete}
                disabled={isLoading}
              >
                Eliminar Reserva
              </Button>
            )}
          </div>
          
          {showCancellationReason && (
            <div className="mt-4 p-4 border border-secondary-200 rounded-md">
              <h4 className="text-sm font-medium text-secondary-700 mb-2">
                Motivo de Cancelación
              </h4>
              <textarea
                className="w-full p-2 border border-secondary-300 rounded-md text-sm text-gray-900"
                rows={3}
                placeholder="Por favor, proporciona un motivo para la cancelación..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <Button
                  variant="error"
                  onClick={confirmCancel}
                  disabled={!cancellationReason.trim() || isLoading}
                >
                Confirmar Cancelación
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancellationReason(false);
                    setCancellationReason('');
                  }}
                >
                Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}