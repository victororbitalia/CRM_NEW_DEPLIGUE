'use client';

import { useState, useEffect } from 'react';
import { BusinessRule, CreateBusinessRuleData, UpdateBusinessRuleData } from '@/types';
import { useBusinessRules } from '@/hooks/useBusinessRules';
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
interface BusinessRuleUpdateData extends UpdateBusinessRuleData {
  id: string;
}

interface BusinessRulesFormProps {
  restaurantId: string;
  onSave?: () => void;
}

interface RuleFormData {
  name: string;
  description: string;
  ruleType: string;
  conditions: string;
  actions: string;
  isActive: boolean;
  priority: string;
}

const RULE_TYPES = [
  { value: 'CANCELLATION_POLICY', label: 'Política de Cancelación' },
  { value: 'NO_SHOW_POLICY', label: 'Política de No Presentación' },
  { value: 'BOOKING_LIMITS', label: 'Límites de Reserva' },
  { value: 'RESERVATION_DURATION', label: 'Duración de Reserva' },
  { value: 'PAYMENT_POLICY', label: 'Política de Pago' },
  { value: 'CUSTOM', label: 'Personalizada' },
];

export default function BusinessRulesForm({ restaurantId, onSave }: BusinessRulesFormProps) {
  const { businessRules, loading, error, fetchBusinessRules, createBusinessRule, updateBusinessRules, deleteBusinessRule } = useBusinessRules(restaurantId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    description: '',
    ruleType: 'BOOKING_LIMITS',
    conditions: '{}',
    actions: '{}',
    isActive: true,
    priority: '0',
  });
  
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    if (restaurantId) {
      fetchBusinessRules(restaurantId);
    }
  }, [restaurantId, fetchBusinessRules]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      ruleType: 'BOOKING_LIMITS',
      conditions: '{}',
      actions: '{}',
      isActive: true,
      priority: '0',
    });
    setErrors({});
    setEditingRule(null);
  };

  const handleOpenModal = (rule?: BusinessRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        description: rule.description || '',
        ruleType: rule.ruleType,
        conditions: JSON.stringify(rule.conditions, null, 2),
        actions: JSON.stringify(rule.actions, null, 2),
        isActive: rule.isActive,
        priority: rule.priority.toString(),
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
      newErrors.name = 'El nombre de la regla es obligatorio';
    }

    if (!formData.ruleType) {
      newErrors.ruleType = 'El tipo de regla es obligatorio';
    }

    try {
      JSON.parse(formData.conditions);
    } catch {
      newErrors.conditions = 'Las condiciones deben ser un JSON válido';
    }

    try {
      JSON.parse(formData.actions);
    } catch {
      newErrors.actions = 'Las acciones deben ser un JSON válido';
    }

    if (!formData.priority.trim() || isNaN(Number(formData.priority))) {
      newErrors.priority = 'La prioridad debe ser un número válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checkbox = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? checkbox.checked : value,
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
      let conditions, actions;
      
      try {
        conditions = JSON.parse(formData.conditions);
        actions = JSON.parse(formData.actions);
      } catch (error) {
        showError('Error en el formato JSON de condiciones o acciones');
        setIsSubmitting(false);
        return;
      }

      if (editingRule) {
        // Update existing rule
        const updateData: UpdateBusinessRuleData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          ruleType: formData.ruleType,
          conditions,
          actions,
          isActive: formData.isActive,
          priority: Number(formData.priority),
        };

        const result = await updateBusinessRules(restaurantId, [{ ...updateData, id: editingRule.id } as BusinessRuleUpdateData]);
        
        if (result) {
          showSuccess('Regla actualizada correctamente');
          handleCloseModal();
          onSave?.();
        }
      } else {
        // Create new rule
        const createData: CreateBusinessRuleData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          ruleType: formData.ruleType,
          conditions,
          actions,
          isActive: formData.isActive,
          priority: Number(formData.priority),
        };

        const result = await createBusinessRule(restaurantId, createData);
        
        if (result) {
          showSuccess('Regla creada correctamente');
          handleCloseModal();
          onSave?.();
        }
      }
    } catch (error) {
      console.error('Error saving business rule:', error);
      showError('Ha ocurrido un error al guardar la regla');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (rule: BusinessRule) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la regla "${rule.name}"?`)) {
      return;
    }

    try {
      const success = await deleteBusinessRule(restaurantId, rule.id);
      
      if (success) {
        showSuccess('Regla eliminada correctamente');
        onSave?.();
      }
    } catch (error) {
      console.error('Error deleting business rule:', error);
      showError('Ha ocurrido un error al eliminar la regla');
    }
  };

  const handleToggleActive = async (rule: BusinessRule) => {
    try {
      const updateData: UpdateBusinessRuleData = {
        isActive: !rule.isActive,
      };

      const result = await updateBusinessRules(restaurantId, [{ ...updateData, id: rule.id } as BusinessRuleUpdateData]);
      
      if (result) {
        showSuccess(`Regla ${rule.isActive ? 'desactivada' : 'activada'} correctamente`);
        onSave?.();
      }
    } catch (error) {
      console.error('Error toggling rule status:', error);
      showError('Ha ocurrido un error al cambiar el estado de la regla');
    }
  };

  const getRuleTypeLabel = (type: string) => {
    const ruleType = RULE_TYPES.find(rt => rt.value === type);
    return ruleType ? ruleType.label : type;
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
        Error al cargar las reglas de negocio: {error}
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Reglas de Negocio</h3>
        <Button onClick={() => handleOpenModal()}>
          Nueva Regla
        </Button>
      </div>

      {businessRules.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No hay reglas de negocio configuradas
            </h3>
            <p className="text-secondary-600 mb-4">
              Comienza creando tu primera regla de negocio
            </p>
            <Button onClick={() => handleOpenModal()}>
              Crear Regla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {businessRules
            .sort((a, b) => a.priority - b.priority)
            .map((rule) => (
              <Card key={rule.id} className={!rule.isActive ? 'opacity-60' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <span>{rule.name}</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={rule.isActive ? 'success' : 'secondary'}>
                          {rule.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                        <Badge variant="primary">
                          {getRuleTypeLabel(rule.ruleType)}
                        </Badge>
                        <Badge variant="default">
                          Prioridad: {rule.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rule.description && (
                    <p className="text-sm text-secondary-600 mb-4">
                      {rule.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenModal(rule)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleToggleActive(rule)}
                      >
                        {rule.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="error"
                      onClick={() => handleDeleteRule(rule)}
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
        size="lg"
      >
        <Form onSubmit={handleSubmit}>
          <ModalHeader>
            {editingRule ? 'Editar Regla de Negocio' : 'Nueva Regla de Negocio'}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField>
                <FormLabel htmlFor="name" required>
                  Nombre de la Regla
                </FormLabel>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Límite de anticipación"
                  error={errors.name}
                  disabled={isSubmitting}
                  required
                />
              </FormField>

              <FormField>
                <FormLabel htmlFor="ruleType" required>
                  Tipo de Regla
                </FormLabel>
                <select
                  id="ruleType"
                  name="ruleType"
                  value={formData.ruleType}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {RULE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.ruleType && (
                  <p className="mt-1 text-sm text-red-600">{errors.ruleType}</p>
                )}
              </FormField>
            </div>

            <FormField>
              <FormLabel htmlFor="description">
                Descripción
              </FormLabel>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descripción de la regla (opcional)"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="priority" required>
                Prioridad
              </FormLabel>
              <Input
                id="priority"
                name="priority"
                type="number"
                value={formData.priority}
                onChange={handleInputChange}
                placeholder="0 (más alta) - 100 (más baja)"
                error={errors.priority}
                disabled={isSubmitting}
                required
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="conditions" required>
                Condiciones (JSON)
              </FormLabel>
              <textarea
                id="conditions"
                name="conditions"
                value={formData.conditions}
                onChange={handleInputChange}
                rows={5}
                placeholder='{"minAdvanceHours": 2, "maxPartySize": 10}'
                className="w-full px-3 py-2 border border-secondary-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                disabled={isSubmitting}
              />
              {errors.conditions && (
                <p className="mt-1 text-sm text-red-600">{errors.conditions}</p>
              )}
            </FormField>

            <FormField>
              <FormLabel htmlFor="actions" required>
                Acciones (JSON)
              </FormLabel>
              <textarea
                id="actions"
                name="actions"
                value={formData.actions}
                onChange={handleInputChange}
                rows={5}
                placeholder='{"allowBooking": false, "message": "Debe reservar con al menos 2 horas de antelación"}'
                className="w-full px-3 py-2 border border-secondary-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                disabled={isSubmitting}
              />
              {errors.actions && (
                <p className="mt-1 text-sm text-red-600">{errors.actions}</p>
              )}
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
                  Regla activa
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
                {editingRule ? 'Actualizar' : 'Crear'}
              </Button>
            </FormActions>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
}