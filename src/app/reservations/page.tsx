'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useNotifications } from '@/hooks/useNotifications';

// Import the new reservation components
import ReservationForm from '@/components/reservations/ReservationForm';
import ReservationCalendar from '@/components/reservations/ReservationCalendar';
import ReservationList from '@/components/reservations/ReservationList';
import ReservationDetail from '@/components/reservations/ReservationDetail';
import WaitlistManager from '@/components/reservations/WaitlistManager';
import CustomerInfo from '@/components/reservations/CustomerInfo';
import AvailabilityChecker from '@/components/reservations/AvailabilityChecker';
import { useReservations } from '@/hooks/useReservations';

type ViewMode = 'list' | 'calendar' | 'waitlist' | 'availability' | 'customer';

export default function ReservationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<'form' | 'detail'>('form');
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  const { showSuccess, showError } = useNotifications();
  
  // Use the reservations hook to fetch data from the API
  const {
    reservations,
    isLoading,
    error,
    fetchReservations,
    createReservation,
    updateReservation,
    deleteReservation,
    updateReservationStatus
  } = useReservations();
  
  // Mock waitlist entries for now
  const [waitlistEntries, setWaitlistEntries] = useState([
    {
      id: '1',
      customer: {
        id: '4',
        firstName: 'Ana',
        lastName: 'Martínez',
        email: 'ana@example.com',
        phone: '600111222',
        isVip: true,
      },
      date: new Date(),
      partySize: 4,
      preferredTime: '20:30',
      area: { id: '1', name: 'Interior' },
      specialRequests: 'Cumpleaños',
      status: 'waiting' as const,
      priority: 5,
      expiresAt: new Date(new Date().setHours(23, 59, 59, 999)),
      notes: 'Cliente VIP',
      createdAt: new Date(),
    },
  ]);
  
  // Fetch reservations on component mount
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);
  
  // Show error notification if there's an error
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Handle reservation creation
  const handleCreateReservation = () => {
    setSelectedReservation(null);
    setModalContent('form');
    setIsModalOpen(true);
  };

  // Handle reservation edit
  const handleEditReservation = (reservation: any) => {
    setSelectedReservation(reservation);
    setModalContent('form');
    setIsModalOpen(true);
  };

  // Handle reservation view
  const handleViewReservation = (reservation: any) => {
    setSelectedReservation(reservation);
    setModalContent('detail');
    setIsModalOpen(true);
  };

  // Handle reservation form submission
  const handleReservationSubmit = async (data: any) => {
    try {
      if (selectedReservation) {
        // Update existing reservation
        const updateData = { id: selectedReservation.id, ...data };
        await updateReservation(updateData);
        showSuccess('Reserva actualizada correctamente');
      } else {
        // Create new reservation
        await createReservation(data);
        showSuccess('Reserva creada correctamente');
      }
      
      setIsModalOpen(false);
      setSelectedReservation(null);
    } catch (error) {
      showError('Error al guardar la reserva');
      console.error('Error saving reservation:', error);
    }
  };

  // Handle reservation status change
  const handleStatusChange = async (id: string, status: string, reason?: string) => {
    try {
      await updateReservationStatus(id, status, reason);
      showSuccess('Estado de reserva actualizado correctamente');
    } catch (error) {
      showError('Error al actualizar el estado de la reserva');
      console.error('Error updating reservation status:', error);
    }
  };

  // Handle reservation deletion
  const handleDeleteReservation = async (id: string) => {
    try {
      await deleteReservation(id);
      showSuccess('Reserva eliminada correctamente');
    } catch (error) {
      showError('Error al eliminar la reserva');
      console.error('Error deleting reservation:', error);
    }
  };

  // Handle waitlist actions
  const handleWaitlistAction = async (action: string, data: any) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      switch (action) {
        case 'create':
          const newEntry = {
            id: Date.now().toString(),
            ...data,
            createdAt: new Date(),
          };
          setWaitlistEntries(prev => [...prev, newEntry]);
          showSuccess('Entrada de lista de espera creada correctamente');
          break;
          
        case 'update-status':
          setWaitlistEntries(prev =>
            prev.map(entry =>
              entry.id === data.entryId
                ? { ...entry, status: data.status }
                : entry
            )
          );
          showSuccess('Entrada de lista de espera actualizada correctamente');
          break;
          
        case 'delete':
          setWaitlistEntries(prev =>
            prev.filter(entry => entry.id !== data.entryId)
          );
          showSuccess('Entrada de lista de espera eliminada correctamente');
          break;
          
        case 'offer-table':
          // In a real implementation, this would create a reservation
          showSuccess('Mesa ofrecida al cliente');
          break;
      }
    } catch (error) {
      showError('Error al realizar acción de lista de espera');
      console.error('Error performing waitlist action:', error);
    }
  };

  // Handle customer view
  const handleViewCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setViewMode('customer');
  };

  // Handle reservation request from availability checker
  const handleReservationRequest = (data: any) => {
    setSelectedReservation(data);
    setModalContent('form');
    setIsModalOpen(true);
  };

  // Render the appropriate view based on viewMode
  const renderView = () => {
    switch (viewMode) {
      case 'calendar':
        return (
          <ReservationCalendar
            reservations={reservations}
            onReservationClick={handleViewReservation}
            onDateChange={setSelectedDate}
            selectedDate={selectedDate}
            isLoading={isLoading}
          />
        );
        
      case 'waitlist':
        return (
          <WaitlistManager
            waitlistEntries={waitlistEntries}
            onOfferTable={(entryId, tableId) => handleWaitlistAction('offer-table', { entryId, tableId })}
            onUpdateStatus={(entryId, status) => handleWaitlistAction('update-status', { entryId, status })}
            onDelete={(entryId) => handleWaitlistAction('delete', { entryId })}
            onCreateEntry={(data) => handleWaitlistAction('create', data)}
            isLoading={isLoading}
          />
        );
        
      case 'availability':
        return (
          <AvailabilityChecker
            onReservationRequest={handleReservationRequest}
            isLoading={isLoading}
          />
        );
        
      case 'customer':
        return selectedCustomerId ? (
          <CustomerInfo
            customerId={selectedCustomerId}
            onEdit={(customer) => console.log('Edit customer:', customer)}
            onCreateReservation={(customerId) => {
              setSelectedReservation({ customerId });
              setModalContent('form');
              setIsModalOpen(true);
            }}
            isLoading={isLoading}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-secondary-500">No se ha seleccionado ningún cliente</p>
          </div>
        );
        
      case 'list':
      default:
        return (
          <ReservationList
            reservations={reservations}
            onEdit={handleEditReservation}
            onDelete={handleDeleteReservation}
            onView={handleViewReservation}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        );
    }
  };

  return (
    <ProtectedRoute>
      <Layout
        title="Gestión de Reservas"
        subtitle="Administra las reservas de tu restaurante"
        restaurantName="Mi Restaurante"
        actions={
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              onClick={() => handleViewModeChange('list')}
            >
              Vista Lista
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'outline'}
              onClick={() => handleViewModeChange('calendar')}
            >
              Calendario
            </Button>
            <Button
              variant={viewMode === 'availability' ? 'primary' : 'outline'}
              onClick={() => handleViewModeChange('availability')}
            >
              Ver Disponibilidad
            </Button>
            <Button
              variant={viewMode === 'waitlist' ? 'primary' : 'outline'}
              onClick={() => handleViewModeChange('waitlist')}
            >
              Lista de Espera
            </Button>
            <Button onClick={handleCreateReservation}>
              Nueva Reserva
            </Button>
          </div>
        }
      >
        <div className="animate-fade-in">
          {renderView()}
        </div>

        {/* Modal for reservation form/detail */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          size={modalContent === 'detail' ? 'xl' : 'lg'}
        >
          {modalContent === 'form' ? (
            <ReservationForm
              initialData={selectedReservation}
              onSubmit={handleReservationSubmit}
              onCancel={() => setIsModalOpen(false)}
              isLoading={isLoading}
              selectedDate={selectedDate}
            />
          ) : (
            selectedReservation && (
              <ReservationDetail
                reservation={selectedReservation}
                onEdit={handleEditReservation}
                onDelete={handleDeleteReservation}
                onStatusChange={handleStatusChange}
                onClose={() => setIsModalOpen(false)}
                isLoading={isLoading}
              />
            )
          )}
        </Modal>
      </Layout>
    </ProtectedRoute>
  );
}