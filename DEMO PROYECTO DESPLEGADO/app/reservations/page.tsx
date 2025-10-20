'use client';

import { useRestaurant } from '@/context/RestaurantContext';
import ReservationCard from '@/components/ReservationCard';
import { PlusIcon, XIcon, FilterIcon, SearchIcon } from '@/components/Icons';
import { useState, useMemo, useEffect } from 'react';
import { Reservation } from '@/types';
import { classifyAndGroupReservations } from '@/lib/reservationUtils';

export default function ReservationsPage() {
  const { reservations, addReservation, updateReservation, deleteReservation } = useRestaurant();
  const [showForm, setShowForm] = useState(false);
  const [filterDate, setFilterDate] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    date: '',
    time: '',
    guests: 2,
    preferredLocation: 'any',
    specialRequests: '',
  });
  // Widget: fecha y hora actuales para el gestor
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  useEffect(() => {
    const tick = () => setCurrentDateTime(new Date());
    // Actualizar cada minuto para mantener la hora visible
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addReservation({
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      date: new Date(formData.date),
      time: formData.time,
      guests: formData.guests,
      preferredLocation: formData.preferredLocation as any,
      status: 'pending',
      specialRequests: formData.specialRequests || undefined,
    });

    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      date: '',
      time: '',
      guests: 2,
      preferredLocation: 'any',
      specialRequests: '',
    });
    setShowForm(false);
  };

  const filteredReservations = useMemo(() => {
    let filtered = [...reservations];

    if (filterDate !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filterDate === 'today') {
        filtered = filtered.filter(r => {
          const resDate = new Date(r.date);
          resDate.setHours(0, 0, 0, 0);
          return resDate.getTime() === today.getTime();
        });
      } else if (filterDate === 'upcoming') {
        filtered = filtered.filter(r => {
          const resDate = new Date(r.date);
          return resDate >= today;
        });
      } else if (filterDate === 'past') {
        filtered = filtered.filter(r => {
          const resDate = new Date(r.date);
          return resDate < today;
        });
      }
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    return filtered.sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.time.localeCompare(a.time);
    });
  }, [reservations, filterDate, filterStatus]);

  // Clasificar y agrupar según timezone de settings (fallback Europe/Madrid)
  const restaurantContext = useRestaurant() as any;
  const timezone = restaurantContext?.settings?.reservations?.timezone || restaurantContext?.settings?.timezone || 'Europe/Madrid';
  const { upcomingGroups, pastGroups } = classifyAndGroupReservations(filteredReservations, timezone, new Date());

  const handleStatusChange = (id: string, status: Reservation['status']) => {
    updateReservation(id, { status });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
      deleteReservation(id);
    }
  };

  const formatHeaderDate = (date: Date) => {
    const formatted = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
            Gestión de Reservas
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Administra todas las reservas del restaurante
          </p>
        </div>
        {/* Widget fecha y hora actual */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-[var(--text-secondary)]">
            <div className="font-medium text-[var(--text-primary)]">
              {new Date(currentDateTime).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/(^\w)/, c => c.toUpperCase())}
            </div>
            <div className="text-xs">{currentDateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {showForm ? <XIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Nueva Reserva'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Nueva Reserva
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="input-field"
                placeholder="María García"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className="input-field"
                placeholder="maria@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                required
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="input-field"
                placeholder="+34 612 345 678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Número de Personas *
              </label>
              <input
                type="number"
                required
                min="1"
                max="20"
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Fecha *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Hora *
              </label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Ubicación Preferida
              </label>
              <select
                value={formData.preferredLocation}
                onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                className="input-field"
              >
                <option value="any">Cualquiera</option>
                <option value="interior">Interior</option>
                <option value="exterior">Exterior</option>
                <option value="terraza">Terraza</option>
                <option value="privado">Privado</option>
              </select>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Se asignará mesa automáticamente según esta preferencia
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Peticiones Especiales
              </label>
              <textarea
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="Alergias, preferencias de mesa, celebraciones..."
              />
            </div>

            <div className="md:col-span-2">
              <button type="submit" className="w-full btn-primary">
                Crear Reserva
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              Filtrar por Fecha
            </label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input-field"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="upcoming">Próximas</option>
              <option value="past">Pasadas</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              Filtrar por Estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="seated">En mesa</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-lg font-medium text-sm border border-blue-200 dark:border-blue-800">
              {filteredReservations.length} {filteredReservations.length === 1 ? 'reserva' : 'reservas'}
            </div>
          </div>
        </div>
      </div>

      {/* Renderizar próximas */}
      {upcomingGroups.length === 0 && pastGroups.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-[var(--text-secondary)] text-base">
            No se encontraron reservas con los filtros seleccionados
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Próximas */}
          {upcomingGroups.map(group => (
            <div key={group.key}>
              <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-primary)]/60">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] tracking-wide mb-3">
                  {formatHeaderDate(new Date(group.key))}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.reservations.map(reservation => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onUpdate={(id, updates) => updateReservation(id, updates)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Separador y pasadas (si corresponde) */}
          {(filterDate === 'all' || filterDate === 'past') && pastGroups.length > 0 && (
            <div className="py-6">
              <div className="border-t border-[var(--border-secondary)] pt-4">
                <h3 className="text-sm text-[var(--text-secondary)]">Reservas pasadas</h3>
              </div>
            </div>
          )}

          {((filterDate === 'all') || (filterDate === 'past')) && pastGroups.map(group => (
            <div key={group.key}>
              <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-primary)]/60">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] tracking-wide mb-3">
                  {formatHeaderDate(new Date(group.key))}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.reservations.map(reservation => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onUpdate={(id, updates) => updateReservation(id, updates)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}