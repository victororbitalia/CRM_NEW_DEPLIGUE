'use client';

import { useState, useEffect } from 'react';
import { 
  Restaurant, 
  CreateRestaurantData, 
  UpdateRestaurantData 
} from '@/types';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useNotifications } from '@/hooks/useNotifications';
import Form, { FormField, FormLabel, FormActions } from '@/components/ui/Form';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';

interface RestaurantFormProps {
  restaurant?: Restaurant | null;
  onSave?: (restaurant: Restaurant) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const initialFormData: CreateRestaurantData = {
  name: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Spain',
  phone: '',
  email: '',
  description: '',
  website: '',
  timezone: 'Europe/Madrid',
  currency: 'EUR',
};

export default function RestaurantForm({ 
  restaurant, 
  onSave, 
  onCancel,
  isLoading = false 
}: RestaurantFormProps) {
  const [formData, setFormData] = useState<CreateRestaurantData | UpdateRestaurantData>(
    restaurant ? { ...restaurant } : { ...initialFormData }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createRestaurant, updateRestaurant } = useRestaurant();
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    if (restaurant) {
      setFormData({ ...restaurant });
    } else {
      setFormData({ ...initialFormData });
    }
    setErrors({});
  }, [restaurant]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre del restaurante es obligatorio';
    }

    if (!formData.address?.trim()) {
      newErrors.address = 'La dirección es obligatoria';
    }

    if (!formData.city?.trim()) {
      newErrors.city = 'La ciudad es obligatoria';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    // Phone validation (simple Spanish phone format)
    if (formData.phone && !/^[6-9]\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'El formato del teléfono no es válido';
    }

    // Website validation if provided
    if (formData.website && formData.website.trim()) {
      try {
        new URL(formData.website);
      } catch {
        newErrors.website = 'El formato del sitio web no es válido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
      let result;
      
      if (restaurant) {
        // Update existing restaurant
        result = await updateRestaurant(restaurant.id, formData as UpdateRestaurantData);
        if (result) {
          showSuccess('Restaurante actualizado correctamente');
          onSave?.(result);
        }
      } else {
        // Create new restaurant
        result = await createRestaurant(formData as CreateRestaurantData);
        if (result) {
          showSuccess('Restaurante creado correctamente');
          onSave?.(result);
          // Reset form after successful creation
          setFormData({ ...initialFormData });
        }
      }
    } catch (error) {
      console.error('Error saving restaurant:', error);
      showError('Ha ocurrido un error al guardar el restaurante');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setErrors({});
    onCancel?.();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <Form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField>
            <FormLabel htmlFor="name" required>
              Nombre del Restaurante
            </FormLabel>
            <Input
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              placeholder="Ej: Mi Restaurante"
              error={errors.name}
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="email" required>
              Email
            </FormLabel>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              placeholder="info@restaurante.com"
              error={errors.email}
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="phone" required>
              Teléfono
            </FormLabel>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={handleInputChange}
              placeholder="912345678"
              error={errors.phone}
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="website">
              Sitio Web
            </FormLabel>
            <Input
              id="website"
              name="website"
              type="url"
              value={formData.website || ''}
              onChange={handleInputChange}
              placeholder="https://www.restaurante.com"
              error={errors.website}
              disabled={isSubmitting}
            />
          </FormField>
        </div>

        <FormField>
          <FormLabel htmlFor="address" required>
            Dirección
          </FormLabel>
          <Input
            id="address"
            name="address"
            value={formData.address || ''}
            onChange={handleInputChange}
            placeholder="Calle Principal 123"
            error={errors.address}
            disabled={isSubmitting}
            required
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField>
            <FormLabel htmlFor="city" required>
              Ciudad
            </FormLabel>
            <Input
              id="city"
              name="city"
              value={formData.city || ''}
              onChange={handleInputChange}
              placeholder="Madrid"
              error={errors.city}
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="state">
              Provincia
            </FormLabel>
            <Input
              id="state"
              name="state"
              value={formData.state || ''}
              onChange={handleInputChange}
              placeholder="Madrid"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="postalCode">
              Código Postal
            </FormLabel>
            <Input
              id="postalCode"
              name="postalCode"
              value={formData.postalCode || ''}
              onChange={handleInputChange}
              placeholder="28001"
              disabled={isSubmitting}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField>
            <FormLabel htmlFor="country">
              País
            </FormLabel>
            <Input
              id="country"
              name="country"
              value={formData.country || ''}
              onChange={handleInputChange}
              placeholder="Spain"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="timezone">
              Zona Horaria
            </FormLabel>
            <Input
              id="timezone"
              name="timezone"
              value={formData.timezone || ''}
              onChange={handleInputChange}
              placeholder="Europe/Madrid"
              disabled={isSubmitting}
            />
          </FormField>
        </div>

        <FormField>
          <FormLabel htmlFor="description">
            Descripción
          </FormLabel>
          <Input
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            placeholder="Breve descripción del restaurante"
            disabled={isSubmitting}
          />
        </FormField>

        {Object.keys(errors).length > 0 && (
          <Alert variant="error">
            Por favor, corrige los errores del formulario antes de continuar.
          </Alert>
        )}
      </div>

      <FormActions align="between" className="mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {restaurant ? 'Actualizar Restaurante' : 'Crear Restaurante'}
        </Button>
      </FormActions>
    </Form>
  );
}