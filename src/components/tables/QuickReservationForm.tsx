'use client';

import React, { useState, useEffect } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import { useNotifications } from '@/hooks/useNotifications';
import { useCustomers } from '@/hooks/useCustomers';

interface QuickReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  tableName: string;
  tableCapacity: number;
  onSubmit: (data: ReservationData) => Promise<void>;
}

interface ReservationData {
  customerId: string;
  tableId: string;
  date: Date;
  startTime: string;
  partySize: number;
  specialRequests?: string;
  occasion?: string;
  notes?: string;
}

const timeOptions = [
  { value: '12:00', label: '12:00' },
  { value: '12:30', label: '12:30' },
  { value: '13:00', label: '13:00' },
  { value: '13:30', label: '13:30' },
  { value: '14:00', label: '14:00' },
  { value: '14:30', label: '14:30' },
  { value: '19:00', label: '19:00' },
  { value: '19:30', label: '19:30' },
  { value: '20:00', label: '20:00' },
  { value: '20:30', label: '20:30' },
  { value: '21:00', label: '21:00' },
  { value: '21:30', label: '21:30' },
  { value: '22:00', label: '22:00' },
  { value: '22:30', label: '22:30' },
  { value: '23:00', label: '23:00' },
];

const occasionOptions = [
  { value: '', label: 'Ninguna' },
  { value: 'birthday', label: 'Cumpleaños' },
  { value: 'anniversary', label: 'Aniversario' },
  { value: 'business', label: 'Reunión de Negocios' },
  { value: 'date', label: 'Cita Romántica' },
  { value: 'celebration', label: 'Celebración' },
  { value: 'other', label: 'Otra' },
];

export default function QuickReservationForm({
  isOpen,
  onClose,
  tableId,
  tableName,
  tableCapacity,
  onSubmit,
}: QuickReservationFormProps) {
  const { showSuccess, showError } = useNotifications();
  const { customers } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<ReservationData>({
    customerId: '',
    tableId,
    date: new Date(),
    startTime: '',
    partySize: Math.min(2, tableCapacity),
    specialRequests: '',
    occasion: '',
    notes: '',
  });

  // Update party size if it exceeds table capacity
  useEffect(() => {
    if (formData.partySize > tableCapacity) {
      setFormData(prev => ({ ...prev, partySize: tableCapacity }));
    }
  }, [tableCapacity, formData.partySize]);

  const handleInputChange = (field: keyof ReservationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Validate form
      if (!formData.customerId) {
        showError('Debes seleccionar un cliente');
        return;
      }
      
      if (!formData.startTime) {
        showError('Debes seleccionar una hora');
        return;
      }
      
      // Submit reservation
      await onSubmit(formData);
      
      showSuccess('Reserva creada correctamente');
      onClose();
      
      // Reset form
      setFormData({
        customerId: '',
        tableId,
        date: new Date(),
        startTime: '',
        partySize: Math.min(2, tableCapacity),
        specialRequests: '',
        occasion: '',
        notes: '',
      });
    } catch (error) {
      showError('Error al crear la reserva');
      console.error('Error creating reservation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate customer options
  const customerOptions = customers.map(customer => ({
    value: customer.id,
    label: `${customer.firstName} ${customer.lastName} (${customer.email})`,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        <h2 className="text-xl font-semibold">Crear Reserva Rápida</h2>
        <p className="text-sm text-gray-600">Mesa {tableName} (Capacidad: {tableCapacity})</p>
      </ModalHeader>
      
      <ModalBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <Select
                value={formData.customerId || ''}
                onChange={(value) => handleInputChange('customerId', value)}
                options={customerOptions}
                placeholder="Seleccionar cliente"
              />
            </div>

            {/* Party Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Personas
              </label>
              <Input
                type="number"
                min="1"
                max={tableCapacity}
                value={formData.partySize}
                onChange={(e) => handleInputChange('partySize', parseInt(e.target.value) || 1)}
                placeholder="Número de personas"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <DatePicker
                value={formData.date}
                onChange={(date) => handleInputChange('date', date || new Date())}
                placeholder="Seleccionar fecha"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora
              </label>
              <Select
                value={formData.startTime || ''}
                onChange={(value) => handleInputChange('startTime', value)}
                options={timeOptions}
                placeholder="Seleccionar hora"
              />
            </div>

            {/* Occasion */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ocasión
              </label>
              <Select
                value={formData.occasion || ''}
                onChange={(value) => handleInputChange('occasion', value)}
                options={occasionOptions}
                placeholder="Seleccionar ocasión"
              />
            </div>

            {/* Special Requests */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Solicitudes Especiales
              </label>
              <Input
                value={formData.specialRequests || ''}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                placeholder="Alguna solicitud especial o requisitos dietéticos"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas Adicionales
              </label>
              <Input
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notas adicionales"
              />
            </div>
          </div>
        </form>
      </ModalBody>
      
      <ModalFooter>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creando...' : 'Crear Reserva'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}