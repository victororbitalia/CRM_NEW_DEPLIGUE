'use client';

import React, { useState, useEffect } from 'react';
import Form, { FormField, FormLabel, FormActions } from '@/components/ui/Form';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import { Area } from '@/types';

interface AreaFormProps {
  area?: Area | null;
  onSubmit: (data: Partial<Area>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const AreaForm: React.FC<AreaFormProps> = ({
  area,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Area>>({
    name: '',
    description: '',
    maxCapacity: 20,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar formulario con datos del área si está editando
  useEffect(() => {
    if (area) {
      setFormData({
        name: area.name || '',
        description: area.description || '',
        maxCapacity: area.maxCapacity || 20,
        isActive: area.isActive !== undefined ? area.isActive : true,
      });
    }
  }, [area]);

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'El nombre del área es requerido';
    }

    if (!formData.maxCapacity || formData.maxCapacity < 1) {
      newErrors.maxCapacity = 'La capacidad máxima debe ser al menos 1';
    }

    if (formData.maxCapacity && formData.maxCapacity > 200) {
      newErrors.maxCapacity = 'La capacidad máxima no puede exceder 200';
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <Form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información del área</h3>
              
              <FormField>
                <FormLabel htmlFor="name">Nombre del área *</FormLabel>
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Terraza, Interior, Sala Privada..."
                  error={errors.name}
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="description">Descripción</FormLabel>
                <Input
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción breve del área (opcional)"
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="maxCapacity">Capacidad máxima *</FormLabel>
                <Input
                  id="maxCapacity"
                  name="maxCapacity"
                  type="number"
                  min="1"
                  max="200"
                  value={formData.maxCapacity || ''}
                  onChange={(e) => handleInputChange('maxCapacity', parseInt(e.target.value, 10) || 0)}
                  error={errors.maxCapacity}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Número máximo de personas que pueden sentarse simultáneamente en esta área
                </p>
              </FormField>

              {area && (
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
                    Área activa
                  </FormLabel>
                  <p className="text-sm text-gray-500 ml-2">
                    Las áreas inactivas no se mostrarán en las reservas
                  </p>
                </FormField>
              )}
            </div>

            {/* Información adicional */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Información útil</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• El nombre del área debe ser único dentro del restaurante</li>
                <li>• La capacidad máxima se usa para calcular la ocupación del área</li>
                <li>• Puedes desactivar un área temporalmente si está en renovación</li>
                <li>• Las mesas se asignan a un área específica</li>
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
              {isLoading ? 'Guardando...' : (area ? 'Actualizar' : 'Crear')}
            </Button>
          </FormActions>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AreaForm;