'use client';

import React, { useState, useEffect } from 'react';
import Form, { FormField, FormLabel, FormActions } from '@/components/ui/Form';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';

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
}

interface MaintenanceRecord {
  id?: string;
  tableId: string;
  reason: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  status?: string;
  notes?: string;
}

interface MaintenanceFormProps {
  table?: Table | null;
  maintenance?: MaintenanceRecord | null;
  tables: Table[];
  onSubmit: (data: Partial<MaintenanceRecord>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

const maintenanceStatuses = [
  { value: 'scheduled', label: 'Programado', color: 'warning' },
  { value: 'in_progress', label: 'En progreso', color: 'error' },
  { value: 'completed', label: 'Completado', color: 'success' },
  { value: 'cancelled', label: 'Cancelado', color: 'secondary' },
];

const commonReasons = [
  'Limpieza profunda',
  'Reparación de sillas',
  'Mantenimiento de iluminación',
  'Reparación de mesa',
  'Pintura o renovación',
  'Revisión de seguridad',
  'Otro',
];

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  table,
  maintenance,
  tables,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
}) => {
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({
    tableId: '',
    reason: '',
    scheduledStart: '',
    scheduledEnd: '',
    actualStart: '',
    actualEnd: '',
    status: 'scheduled',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Preparar opciones de tablas
  const tableOptions = tables.map(t => ({
    value: t.id,
    label: `Mesa ${t.number} - ${t.area?.name || 'Sin área'} (${t.capacity} pers.)`,
  }));

  // Inicializar formulario con datos si está editando
  useEffect(() => {
    if (maintenance) {
      setFormData({
        tableId: maintenance.tableId || '',
        reason: maintenance.reason || '',
        scheduledStart: maintenance.scheduledStart 
          ? new Date(maintenance.scheduledStart).toISOString().slice(0, 16) 
          : '',
        scheduledEnd: maintenance.scheduledEnd 
          ? new Date(maintenance.scheduledEnd).toISOString().slice(0, 16) 
          : '',
        actualStart: maintenance.actualStart 
          ? new Date(maintenance.actualStart).toISOString().slice(0, 16) 
          : '',
        actualEnd: maintenance.actualEnd 
          ? new Date(maintenance.actualEnd).toISOString().slice(0, 16) 
          : '',
        status: maintenance.status || 'scheduled',
        notes: maintenance.notes || '',
      });
    } else if (table) {
      setFormData(prev => ({
        ...prev,
        tableId: table.id,
      }));
    }
  }, [maintenance, table]);

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tableId) {
      newErrors.tableId = 'Debe seleccionar una mesa';
    }

    if (!formData.reason || formData.reason.trim() === '') {
      newErrors.reason = 'El motivo del mantenimiento es requerido';
    }

    if (!formData.scheduledStart) {
      newErrors.scheduledStart = 'La fecha y hora de inicio es requerida';
    }

    if (!formData.scheduledEnd) {
      newErrors.scheduledEnd = 'La fecha y hora de fin es requerida';
    }

    if (formData.scheduledStart && formData.scheduledEnd) {
      const startDate = new Date(formData.scheduledStart);
      const endDate = new Date(formData.scheduledEnd);
      
      if (endDate <= startDate) {
        newErrors.scheduledEnd = 'La fecha de fin debe ser posterior a la de inicio';
      }

      // Verificar que no sea en el pasado (solo para creación)
      if (mode === 'create' && startDate < new Date()) {
        newErrors.scheduledStart = 'La fecha de inicio no puede ser en el pasado';
      }
    }

    if (formData.status === 'in_progress' && !formData.actualStart) {
      newErrors.actualStart = 'Debe registrar la hora de inicio real';
    }

    if (formData.status === 'completed' && (!formData.actualStart || !formData.actualEnd)) {
      newErrors.actualEnd = 'Debe registrar las horas reales de inicio y fin';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  // Manejar cambios en los campos
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Manejar cambio de estado
  const handleStatusChange = (newStatus: string) => {
    setFormData(prev => {
      const updated = { ...prev, status: newStatus };
      
      // Auto-registrar horas según el estado
      const now = new Date().toISOString().slice(0, 16);
      
      if (newStatus === 'in_progress' && !prev.actualStart) {
        updated.actualStart = now;
      }
      
      if (newStatus === 'completed' && prev.actualStart && !prev.actualEnd) {
        updated.actualEnd = now;
      }
      
      return updated;
    });

    // Limpiar error del campo
    if (errors.status) {
      setErrors(prev => ({
        ...prev,
        status: '',
      }));
    }
  };

  // Obtener el estado actual del mantenimiento
  const currentStatus = formData.status || 'scheduled';
  const currentStatusConfig = maintenanceStatuses.find(s => s.value === currentStatus);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <Form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información del mantenimiento</h3>
              
              <FormField>
                <FormLabel htmlFor="tableId">Mesa *</FormLabel>
                <Select
                  value={formData.tableId || ''}
                  onChange={(value) => handleInputChange('tableId', value)}
                  options={tableOptions}
                  placeholder="Selecciona una mesa"
                  error={errors.tableId}
                  disabled={!!table || mode === 'edit'}
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="reason">Motivo del mantenimiento *</FormLabel>
                <Select
                  value={formData.reason || ''}
                  onChange={(value) => handleInputChange('reason', value)}
                  options={[
                    { value: '', label: 'Selecciona un motivo o escribe uno personalizado' },
                    ...commonReasons.map(reason => ({ value: reason, label: reason })),
                  ]}
                  placeholder="Selecciona un motivo"
                  error={errors.reason}
                />
                <Input
                  className="mt-2"
                  value={formData.reason || ''}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  placeholder="O escribe un motivo personalizado"
                  error={errors.reason}
                />
              </FormField>
            </div>

            {/* Programación */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Programación</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField>
                  <FormLabel htmlFor="scheduledStart">Fecha y hora de inicio *</FormLabel>
                  <Input
                    id="scheduledStart"
                    name="scheduledStart"
                    type="datetime-local"
                    value={formData.scheduledStart || ''}
                    onChange={(e) => handleInputChange('scheduledStart', e.target.value)}
                    error={errors.scheduledStart}
                    disabled={mode === 'edit'}
                  />
                </FormField>

                <FormField>
                  <FormLabel htmlFor="scheduledEnd">Fecha y hora de fin *</FormLabel>
                  <Input
                    id="scheduledEnd"
                    name="scheduledEnd"
                    type="datetime-local"
                    value={formData.scheduledEnd || ''}
                    onChange={(e) => handleInputChange('scheduledEnd', e.target.value)}
                    error={errors.scheduledEnd}
                    disabled={mode === 'edit'}
                  />
                </FormField>
              </div>
            </div>

            {/* Estado y seguimiento (solo para edición) */}
            {mode === 'edit' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Seguimiento</h3>
                
                <FormField>
                  <FormLabel htmlFor="status">Estado</FormLabel>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={formData.status || ''}
                      onChange={(value) => handleStatusChange(value as string)}
                      options={maintenanceStatuses}
                      placeholder="Selecciona un estado"
                    />
                    {currentStatusConfig && (
                      <Badge color={currentStatusConfig.color as any}>
                        {currentStatusConfig.label}
                      </Badge>
                    )}
                  </div>
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField>
                    <FormLabel htmlFor="actualStart">Hora de inicio real</FormLabel>
                    <Input
                      id="actualStart"
                      name="actualStart"
                      type="datetime-local"
                      value={formData.actualStart || ''}
                      onChange={(e) => handleInputChange('actualStart', e.target.value)}
                      disabled={currentStatus === 'scheduled'}
                    />
                  </FormField>

                  <FormField>
                    <FormLabel htmlFor="actualEnd">Hora de fin real</FormLabel>
                    <Input
                      id="actualEnd"
                      name="actualEnd"
                      type="datetime-local"
                      value={formData.actualEnd || ''}
                      onChange={(e) => handleInputChange('actualEnd', e.target.value)}
                      disabled={currentStatus !== 'completed'}
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* Notas adicionales */}
            <FormField>
              <FormLabel htmlFor="notes">Notas adicionales</FormLabel>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Añade cualquier información adicional relevante sobre el mantenimiento..."
              />
            </FormField>

            {/* Información útil */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Información importante</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Durante el mantenimiento, la mesa no estará disponible para reservas</li>
                <li>• El sistema verificará automáticamente si hay conflictos con reservas existentes</li>
                <li>• Podrás actualizar el estado del mantenimiento a medida que avance</li>
                <li>• Las horas reales se registran automáticamente al cambiar de estado</li>
              </ul>
            </div>
          </div>

          <FormActions align="right" className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : (maintenance ? 'Actualizar' : 'Programar')}
            </Button>
          </FormActions>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MaintenanceForm;