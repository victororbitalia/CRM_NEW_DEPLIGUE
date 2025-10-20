'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { useNotifications } from '@/hooks/useNotifications';

interface Reservation {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: Date;
  startTime: string;
  endTime: string;
  partySize: number;
  tableId?: string;
  tableName?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  specialRequests?: string;
  occasion?: string;
  notes?: string;
  createdAt: Date;
}

interface ReservationListProps {
  reservations: Reservation[];
  onEdit?: (reservation: Reservation) => void;
  onDelete?: (id: string) => void;
  onView?: (reservation: Reservation) => void;
  onStatusChange?: (id: string, status: string) => void;
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

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'seated', label: 'Sentada' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'no_show', label: 'No se presentó' },
];

const sortOptions = [
  { value: 'date-asc', label: 'Fecha (Más antiguo primero)' },
  { value: 'date-desc', label: 'Fecha (Más reciente primero)' },
  { value: 'party-size-asc', label: 'Comensales (Menor primero)' },
  { value: 'party-size-desc', label: 'Comensales (Mayor primero)' },
  { value: 'created-asc', label: 'Creación (Más antiguo primero)' },
  { value: 'created-desc', label: 'Creación (Más reciente primero)' },
];

export default function ReservationList({
  reservations,
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  isLoading = false,
}: ReservationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-asc');
  const [filteredReservations, setFilteredReservations] = useState(reservations);
  const { showSuccess, showError } = useNotifications();

  // Filter and sort reservations
  useEffect(() => {
    let filtered = [...reservations];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(reservation =>
        reservation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.customerPhone.includes(searchTerm) ||
        (reservation.tableName && reservation.tableName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (reservation.specialRequests && reservation.specialRequests.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reservation => reservation.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime() ||
                 a.startTime.localeCompare(b.startTime);
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime() ||
                 b.startTime.localeCompare(a.startTime);
        case 'party-size-asc':
          return a.partySize - b.partySize;
        case 'party-size-desc':
          return b.partySize - a.partySize;
        case 'created-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'created-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredReservations(filtered);
  }, [reservations, searchTerm, statusFilter, sortBy]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      if (onStatusChange) {
        await onStatusChange(id, newStatus);
        showSuccess('Estado de reserva actualizado correctamente');
      }
    } catch (error) {
      showError('Error al actualizar el estado de la reserva');
      console.error('Error updating reservation status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
      try {
        if (onDelete) {
          await onDelete(id);
          showSuccess('Reserva eliminada correctamente');
        }
      } catch (error) {
        showError('Error al eliminar la reserva');
        console.error('Error deleting reservation:', error);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getNextStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return [
          { value: 'confirmed', label: 'Confirmar' },
          { value: 'cancelled', label: 'Cancelar' },
        ];
      case 'confirmed':
        return [
          { value: 'seated', label: 'Sentar' },
          { value: 'cancelled', label: 'Cancelar' },
        ];
      case 'seated':
        return [
          { value: 'completed', label: 'Completar' },
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
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Reservations ({filteredReservations.length})</CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Buscar reservas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
            
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as string)}
              options={statusOptions}
              className="w-full sm:w-40"
            />
            
            <Select
              value={sortBy}
              onChange={(value) => setSortBy(value as string)}
              options={sortOptions}
              className="w-full sm:w-48"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-secondary-500">Cargando reservas...</div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-secondary-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No se encontraron reservas
            </h3>
            <p className="text-secondary-600">
              {searchTerm || statusFilter !== 'all'
                ? 'Intenta ajustar tu búsqueda o filtros'
                : 'Aún no se han creado reservas'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Nº de Comensales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Mesa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-secondary-900">
                          {reservation.customerName}
                        </div>
                        <div className="text-sm text-secondary-500">
                          {reservation.customerEmail}
                        </div>
                        <div className="text-sm text-secondary-500">
                          {reservation.customerPhone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        {formatDate(reservation.date)}
                      </div>
                      <div className="text-sm text-secondary-500">
                        {reservation.startTime} - {reservation.endTime}
                      </div>
                      {reservation.occasion && (
                        <div className="text-xs text-secondary-500">
                          {reservation.occasion}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        {reservation.partySize} {reservation.partySize === 1 ? 'comensal' : 'comensales'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        {reservation.tableName || 'No asignada'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={statusColors[reservation.status]}>
                        {statusLabels[reservation.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1">
                          {onView && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onView(reservation)}
                            >
                              Ver
                            </Button>
                          )}
                          
                          {onEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEdit(reservation)}
                            >
                              Editar
                            </Button>
                          )}
                        </div>
                        
                        {onStatusChange && (
                          <Select
                            value=""
                            onChange={(value) => handleStatusChange(reservation.id, value as string)}
                            options={[
                              { value: '', label: 'Cambiar Estado' },
                              ...getNextStatusOptions(reservation.status),
                            ]}
                            className="w-full"
                          />
                        )}
                        
                        {onDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(reservation.id)}
                            className="text-error-600 border-error-200 hover:bg-error-50"
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}