'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Form, { FormField, FormLabel, FormMessage, FormActions } from '@/components/ui/Form';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import { useNotifications } from '@/hooks/useNotifications';

interface ReservationFormData {
  customerId: string;
  date: Date;
  startTime: string;
  partySize: number;
  tableId?: string;
  areaId?: string;
  specialRequests?: string;
  occasion?: string;
  notes?: string;
}

interface ReservationFormProps {
  initialData?: Partial<ReservationFormData>;
  onSubmit: (data: ReservationFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  selectedDate?: Date;
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

export default function ReservationForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  selectedDate = new Date(),
}: ReservationFormProps) {
  const { showSuccess, showError } = useNotifications();
  // For now, we'll use empty arrays until we create the hooks
  const [customers, setCustomers] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredTables, setFilteredTables] = useState<any[]>([]);

  const [formData, setFormData] = useState<ReservationFormData>({
    customerId: '',
    date: selectedDate,
    startTime: '',
    partySize: 2,
    tableId: '',
    areaId: '',
    specialRequests: '',
    occasion: '',
    notes: '',
    ...initialData,
  });

  const handleInputChange = (field: keyof ReservationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Filter tables by area and capacity
  useEffect(() => {
    if (tables && areas) {
      let filtered = tables || [];
      
      // Filter by area if selected
      if (formData.areaId) {
        filtered = filtered.filter((table: any) => table.areaId === formData.areaId);
      }
      
      // Filter by capacity
      if (formData.partySize) {
        filtered = filtered.filter((table: any) => table.capacity >= formData.partySize);
      }
      
      setFilteredTables(filtered);
    }
  }, [tables, areas, formData.areaId, formData.partySize]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      showSuccess('Reserva guardada correctamente');
      setFormData({
        customerId: '',
        date: selectedDate,
        startTime: '',
        partySize: 2,
        tableId: '',
        areaId: '',
        specialRequests: '',
        occasion: '',
        notes: '',
        ...initialData,
      });
    } catch (error) {
      showError('Error al guardar la reserva');
      console.error('Error saving reservation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock data for now
  const customerOptions = [
    { value: '1', label: 'Juan Pérez (juan@example.com)' },
    { value: '2', label: 'María García (maria@example.com)' },
  ];

  const areaOptions = [
    { value: '', label: 'Todas las Áreas' },
    { value: '1', label: 'Interior' },
    { value: '2', label: 'Terraza' },
  ];

  const tableOptions = [
    { value: '', label: 'Seleccionar Mesa' },
    { value: '1', label: 'Mesa 1 (Capacidad: 4)' },
    { value: '2', label: 'Mesa 2 (Capacidad: 2)' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? 'Editar Reserva' : 'Crear Nueva Reserva'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Selection */}
            <FormField>
              <FormLabel>Cliente</FormLabel>
              <Select
                value={formData.customerId || ''}
                onChange={(value) => handleInputChange('customerId', value)}
                options={customerOptions}
                placeholder="Seleccionar un cliente"
              />
            </FormField>

            {/* Party Size */}
            <FormField>
              <FormLabel>Nº de Comensales</FormLabel>
              <Input
                type="number"
                min="1"
                max="20"
                value={formData.partySize}
                onChange={(e) => handleInputChange('partySize', parseInt(e.target.value) || 1)}
                placeholder="Número de comensales"
              />
            </FormField>

            {/* Date */}
            <FormField>
              <FormLabel>Fecha</FormLabel>
              <DatePicker
                value={formData.date}
                onChange={(date) => handleInputChange('date', date || new Date())}
                placeholder="Seleccionar fecha"
              />
            </FormField>

            {/* Time */}
            <FormField>
              <FormLabel>Hora</FormLabel>
              <Select
                value={formData.startTime || ''}
                onChange={(value) => handleInputChange('startTime', value)}
                options={timeOptions}
                placeholder="Seleccionar hora"
              />
            </FormField>

            {/* Area */}
            <FormField>
              <FormLabel>Área</FormLabel>
              <Select
                value={formData.areaId || ''}
                onChange={(value) => handleInputChange('areaId', value)}
                options={areaOptions}
                placeholder="Seleccionar área"
              />
            </FormField>

            {/* Table */}
            <FormField>
              <FormLabel>Mesa</FormLabel>
              <Select
                value={formData.tableId || ''}
                onChange={(value) => handleInputChange('tableId', value)}
                options={tableOptions}
                placeholder="Seleccionar mesa"
                disabled={filteredTables.length === 0}
              />
            </FormField>

            {/* Occasion */}
            <FormField>
              <FormLabel>Ocasión</FormLabel>
              <Select
                value={formData.occasion || ''}
                onChange={(value) => handleInputChange('occasion', value)}
                options={occasionOptions}
                placeholder="Seleccionar ocasión"
              />
            </FormField>

            {/* Special Requests */}
            <FormField className="md:col-span-2">
              <FormLabel>Peticiones Especiales</FormLabel>
              <Input
                value={formData.specialRequests || ''}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                placeholder="Alguna petición especial o requisito dietético"
              />
            </FormField>

            {/* Notes */}
            <FormField className="md:col-span-2">
              <FormLabel>Notas</FormLabel>
              <Input
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notas adicionales"
              />
            </FormField>
          </div>

          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'} Reserva
            </Button>
          </FormActions>
        </Form>
      </CardContent>
    </Card>
  );
}