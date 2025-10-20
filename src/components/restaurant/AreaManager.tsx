'use client';

import { useState, useEffect } from 'react';
import { Area, CreateAreaData, UpdateAreaData } from '@/types';
import { useAreas } from '@/hooks/useAreas';
import { useNotifications } from '@/hooks/useNotifications';
import Form, { FormField, FormLabel, FormActions } from '@/components/ui/Form';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';

// Type for update operations that includes the ID
interface AreaUpdateData extends UpdateAreaData {
  id: string;
}

interface AreaManagerProps {
  restaurantId: string;
  onSave?: () => void;
}

interface AreaFormData {
  name: string;
  description: string;
  maxCapacity: string;
  isActive: boolean;
}

export default function AreaManager({ restaurantId, onSave }: AreaManagerProps) {
  const { areas, loading, error, fetchAreas, createArea, updateAreas, deleteArea } = useAreas(restaurantId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [formData, setFormData] = useState<AreaFormData>({
    name: '',
    description: '',
    maxCapacity: '',
    isActive: true,
  });
  
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    if (restaurantId) {
      fetchAreas(restaurantId);
    }
  }, [restaurantId, fetchAreas]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      maxCapacity: '',
      isActive: true,
    });
    setErrors({});
    setEditingArea(null);
  };

  const handleOpenModal = (area?: Area) => {
    if (area) {
      setEditingArea(area);
      setFormData({
        name: area.name,
        description: area.description || '',
        maxCapacity: area.maxCapacity.toString(),
        isActive: area.isActive,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del área es obligatorio';
    }

    if (!formData.maxCapacity.trim() || isNaN(Number(formData.maxCapacity))) {
      newErrors.maxCapacity = 'La capacidad máxima debe ser un número válido';
    } else if (Number(formData.maxCapacity) <= 0) {
      newErrors.maxCapacity = 'La capacidad máxima debe ser mayor que 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingArea) {
        // Update existing area
        const updateData: UpdateAreaData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          maxCapacity: Number(formData.maxCapacity),
          isActive: formData.isActive,
        };

        const result = await updateAreas(restaurantId, [{ ...updateData, id: editingArea.id } as AreaUpdateData]);
        
        if (result) {
          showSuccess('Área actualizada correctamente');
          handleCloseModal();
          onSave?.();
        }
      } else {
        // Create new area
        const createData: CreateAreaData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          maxCapacity: Number(formData.maxCapacity),
          isActive: formData.isActive,
        };

        const result = await createArea(restaurantId, createData);
        
        if (result) {
          showSuccess('Área creada correctamente');
          handleCloseModal();
          onSave?.();
        }
      }
    } catch (error) {
      console.error('Error saving area:', error);
      showError('Ha ocurrido un error al guardar el área');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArea = async (area: Area) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el área "${area.name}"?`)) {
      return;
    }

    try {
      const success = await deleteArea(restaurantId, area.id);
      
      if (success) {
        showSuccess('Área eliminada correctamente');
        onSave?.();
      }
    } catch (error) {
      console.error('Error deleting area:', error);
      showError('Ha ocurrido un error al eliminar el área');
    }
  };

  const handleToggleActive = async (area: Area) => {
    try {
      const updateData: UpdateAreaData = {
        isActive: !area.isActive,
      };

      const result = await updateAreas(restaurantId, [{ ...updateData, id: area.id } as AreaUpdateData]);
      
      if (result) {
        showSuccess(`Área ${area.isActive ? 'desactivada' : 'activada'} correctamente`);
        onSave?.();
      }
    } catch (error) {
      console.error('Error toggling area status:', error);
      showError('Ha ocurrido un error al cambiar el estado del área');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        Error al cargar las áreas: {error}
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Gestión de Áreas</h3>
        <Button onClick={() => handleOpenModal()}>
          Nueva Área
        </Button>
      </div>

      {areas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No hay áreas configuradas
            </h3>
            <p className="text-secondary-600 mb-4">
              Comienza creando tu primera área
            </p>
            <Button onClick={() => handleOpenModal()}>
              Crear Área
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((area) => (
            <Card key={area.id} className={!area.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{area.name}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant={area.isActive ? 'success' : 'secondary'}>
                      {area.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <Badge variant="secondary">
                      {area.maxCapacity} personas
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {area.description && (
                  <p className="text-sm text-secondary-600 mb-4">
                    {area.description}
                  </p>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenModal(area)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggleActive(area)}
                    >
                      {area.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="error"
                    onClick={() => handleDeleteArea(area)}
                  >
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        size="md"
      >
        <Form onSubmit={handleSubmit}>
          <ModalHeader>
            {editingArea ? 'Editar Área' : 'Nueva Área'}
          </ModalHeader>
          <ModalBody>
            <FormField>
              <FormLabel htmlFor="name" required>
                Nombre del Área
              </FormLabel>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Terraza"
                error={errors.name}
                disabled={isSubmitting}
                required
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="description">
                Descripción
              </FormLabel>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descripción del área (opcional)"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="maxCapacity" required>
                Capacidad Máxima
              </FormLabel>
              <Input
                id="maxCapacity"
                name="maxCapacity"
                type="number"
                min="1"
                value={formData.maxCapacity}
                onChange={handleInputChange}
                placeholder="Ej: 20"
                error={errors.maxCapacity}
                disabled={isSubmitting}
                required
              />
            </FormField>

            <FormField>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-secondary-700">
                  Área activa
                </span>
              </label>
            </FormField>

            {Object.keys(errors).length > 0 && (
              <Alert variant="error">
                Por favor, corrige los errores del formulario antes de continuar.
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <FormActions align="between">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {editingArea ? 'Actualizar' : 'Crear'}
              </Button>
            </FormActions>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
}