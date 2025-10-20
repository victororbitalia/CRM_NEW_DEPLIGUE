'use client';

import React, { useState, useEffect } from 'react';
import Form, { FormField, FormLabel, FormActions } from '@/components/ui/Form';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import { Area } from '@/types';

// Extender el tipo Table para el formulario
interface Table {
  id?: string;
  areaId: string;
  number: string;
  capacity: number;
  minCapacity?: number;
  positionX?: number | null;
  positionY?: number | null;
  width?: number | null;
  height?: number | null;
  shape?: string | null;
  isAccessible?: boolean;
  isActive?: boolean;
}

interface TableFormProps {
  table?: Table | null;
  areas: Area[];
  onSubmit: (data: Partial<Table>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

const shapeOptions = [
  { value: 'rectangle', label: 'Rectangular' },
  { value: 'circle', label: 'Redonda' },
  { value: 'square', label: 'Cuadrada' },
];

const TableForm: React.FC<TableFormProps> = ({
  table,
  areas,
  onSubmit,
  onCancel,
  onDelete,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Table>>({
    areaId: '',
    number: '',
    capacity: 4,
    minCapacity: 1,
    positionX: 0,
    positionY: 0,
    width: 80,
    height: 80,
    shape: 'rectangle',
    isAccessible: false,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar formulario con datos de la mesa si está editando
  useEffect(() => {
    if (table) {
      setFormData({
        areaId: table.areaId || '',
        number: table.number || '',
        capacity: table.capacity || 4,
        minCapacity: table.minCapacity || 1,
        positionX: table.positionX || 0,
        positionY: table.positionY || 0,
        width: table.width || 80,
        height: table.height || 80,
        shape: table.shape || 'rectangle',
        isAccessible: table.isAccessible || false,
        isActive: table.isActive !== undefined ? table.isActive : true,
      });
    }
  }, [table]);

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.areaId) {
      newErrors.areaId = 'Debe seleccionar un área';
    }

    if (!formData.number || formData.number.trim() === '') {
      newErrors.number = 'El número de mesa es requerido';
    }

    if (!formData.capacity || formData.capacity < 1) {
      newErrors.capacity = 'La capacidad debe ser al menos 1';
    }

    if (!formData.minCapacity || formData.minCapacity < 1) {
      newErrors.minCapacity = 'La capacidad mínima debe ser al menos 1';
    }

    if (formData.minCapacity && formData.capacity && formData.minCapacity > formData.capacity) {
      newErrors.minCapacity = 'La capacidad mínima no puede ser mayor que la capacidad máxima';
    }

    if (formData.width && formData.width < 40) {
      newErrors.width = 'El ancho debe ser al menos 40px';
    }

    if (formData.height && formData.height < 40) {
      newErrors.height = 'La altura debe ser al menos 40px';
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

  // Manejar eliminación de mesa
  const handleDelete = () => {
    if (table && onDelete) {
      if (confirm(`¿Estás seguro de que quieres eliminar la mesa ${table.number}? Esta acción no se puede deshacer.`)) {
        onDelete();
      }
    }
  };

  // Preparar opciones de áreas para el select
  const areaOptions = areas.map(area => ({
    value: area.id,
    label: area.name,
  }));

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <Form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información básica</h3>
              
              <FormField>
                <FormLabel htmlFor="areaId">Área *</FormLabel>
                <Select
                  value={formData.areaId || ''}
                  onChange={(value) => handleInputChange('areaId', value)}
                  options={areaOptions}
                  placeholder="Selecciona un área"
                  error={errors.areaId}
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="number">Número de mesa *</FormLabel>
                <Input
                  id="number"
                  name="number"
                  value={formData.number || ''}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  placeholder="Ej: 1, 2, A1..."
                  error={errors.number}
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="capacity">Capacidad máxima *</FormLabel>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.capacity || ''}
                  onChange={(e) => handleInputChange('capacity', parseInt(e.target.value, 10) || 0)}
                  error={errors.capacity}
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="minCapacity">Capacidad mínima</FormLabel>
                <Input
                  id="minCapacity"
                  name="minCapacity"
                  type="number"
                  min="1"
                  max={formData.capacity || 20}
                  value={formData.minCapacity || ''}
                  onChange={(e) => handleInputChange('minCapacity', parseInt(e.target.value, 10) || 0)}
                  error={errors.minCapacity}
                />
              </FormField>

              <FormField className="flex items-center space-x-2">
                <input
                  id="isAccessible"
                  name="isAccessible"
                  type="checkbox"
                  checked={formData.isAccessible || false}
                  onChange={(e) => handleInputChange('isAccessible', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <FormLabel htmlFor="isAccessible" className="ml-2">
                  Mesa accesible
                </FormLabel>
              </FormField>

              {table && (
                <FormField className="flex items-center space-x-2">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive !== undefined ? formData.isActive : true}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <FormLabel htmlFor="isActive" className="ml-2">
                    Mesa activa
                  </FormLabel>
                </FormField>
              )}
            </div>

            {/* Apariencia y posición */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Apariencia y posición</h3>
              
              <FormField>
                <FormLabel htmlFor="shape">Forma</FormLabel>
                <Select
                  value={formData.shape || ''}
                  onChange={(value) => handleInputChange('shape', value)}
                  options={shapeOptions}
                  placeholder="Selecciona una forma"
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="width">Ancho (px)</FormLabel>
                <Input
                  id="width"
                  name="width"
                  type="number"
                  min="40"
                  max="200"
                  value={formData.width || ''}
                  onChange={(e) => handleInputChange('width', parseInt(e.target.value, 10) || 80)}
                  error={errors.width}
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="height">Alto (px)</FormLabel>
                <Input
                  id="height"
                  name="height"
                  type="number"
                  min="40"
                  max="200"
                  value={formData.height || ''}
                  onChange={(e) => handleInputChange('height', parseInt(e.target.value, 10) || 80)}
                  error={errors.height}
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="positionX">Posición X</FormLabel>
                <Input
                  id="positionX"
                  name="positionX"
                  type="number"
                  min="0"
                  value={formData.positionX || ''}
                  onChange={(e) => handleInputChange('positionX', parseInt(e.target.value, 10) || 0)}
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="positionY">Posición Y</FormLabel>
                <Input
                  id="positionY"
                  name="positionY"
                  type="number"
                  min="0"
                  value={formData.positionY || ''}
                  onChange={(e) => handleInputChange('positionY', parseInt(e.target.value, 10) || 0)}
                />
              </FormField>
            </div>
          </div>

          <FormActions align="between" className="mt-6">
            <div>
              {table && onDelete && (
                <Button
                  type="button"
                  variant="error"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  Eliminar Mesa
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
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
                {isLoading ? 'Guardando...' : (table ? 'Actualizar' : 'Crear')}
              </Button>
            </div>
          </FormActions>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TableForm;