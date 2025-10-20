'use client';

import { useState, useEffect } from 'react';
import { RestaurantWithRelations, RestaurantSettings } from '@/types';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';

interface RestaurantProfileProps {
  restaurantId: string;
  onEdit?: () => void;
}

export default function RestaurantProfile({ restaurantId, onEdit }: RestaurantProfileProps) {
  const { restaurant, loading: restaurantLoading, error: restaurantError } = useRestaurant(restaurantId);
  const { settings, loading: settingsLoading, error: settingsError } = useRestaurantSettings(restaurantId);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  if (restaurantLoading || settingsLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loading size="lg" />
      </div>
    );
  }

  if (restaurantError || settingsError) {
    return (
      <Alert variant="error">
        Error al cargar la información del restaurante: {restaurantError || settingsError}
      </Alert>
    );
  }

  if (!restaurant) {
    return (
      <Alert variant="error">
        No se encontró información del restaurante
      </Alert>
    );
  }

  const formatAddress = () => {
    const parts = [restaurant.address];
    if ((restaurant as any).city) parts.push((restaurant as any).city);
    if ((restaurant as any).state) parts.push((restaurant as any).state);
    if ((restaurant as any).postalCode) parts.push((restaurant as any).postalCode);
    if ((restaurant as any).country) parts.push((restaurant as any).country);
    return parts.join(', ');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: (restaurant as any).currency || 'EUR',
    }).format(amount);
  };

  const getOperatingHoursSummary = () => {
    if (!restaurant.operatingHours || restaurant.operatingHours.length === 0) {
      return 'No hay horarios configurados';
    }

    const regularHours = restaurant.operatingHours.filter((h: any) => !h.isSpecialDay);
    if (regularHours.length === 0) {
      return 'No hay horarios regulares configurados';
    }

    // Group by day and get the most common schedule
    const dayGroups: Record<number, typeof regularHours> = {};
    regularHours.forEach((hour: any) => {
      if (!dayGroups[hour.dayOfWeek]) {
        dayGroups[hour.dayOfWeek] = [];
      }
      dayGroups[hour.dayOfWeek].push(hour);
    });

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let summary = '';

    for (let day = 1; day <= 6; day++) { // Monday to Saturday
      const dayHours = dayGroups[day];
      if (dayHours && dayHours.length > 0) {
        const openHours = dayHours.filter((h: any) => !h.isClosed);
        if (openHours.length > 0) {
          summary += `${dayNames[day]}: `;
          const timeRanges = openHours.map((h: any) => `${h.openTime} - ${h.closeTime}`);
          summary += timeRanges.join(', ');
          summary += '\n';
        } else {
          summary += `${dayNames[day]}: Cerrado\n`;
        }
      }
    }

    return summary.trim();
  };

  const getAreasSummary = () => {
    if (!restaurant.areas || restaurant.areas.length === 0) {
      return 'No hay áreas configuradas';
    }

    const activeAreas = restaurant.areas.filter((a: any) => a.isActive);
    const totalCapacity = activeAreas.reduce((sum: number, area: any) => sum + area.maxCapacity, 0);

    return `${activeAreas.length} áreas activas con capacidad para ${totalCapacity} personas`;
  };

  const getBusinessRulesSummary = () => {
    if (!restaurant.businessRules || restaurant.businessRules.length === 0) {
      return 'No hay reglas de negocio configuradas';
    }

    const activeRules = restaurant.businessRules.filter((r: any) => r.isActive);
    const ruleTypes = [...new Set(activeRules.map((r: any) => r.ruleType))];

    return `${activeRules.length} reglas activas de ${ruleTypes.length} tipos diferentes`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-secondary-900">Perfil del Restaurante</h2>
        <Button onClick={onEdit}>
          Editar Información
        </Button>
      </div>

      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            Información General
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            Configuración
          </button>
        </nav>
      </div>

      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Nombre</h3>
                  <p className="mt-1 text-sm text-secondary-900">{restaurant.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Estado</h3>
                  <div className="mt-1">
                    <Badge variant={(restaurant as any).isActive ? 'success' : 'secondary'}>
                      {(restaurant as any).isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-secondary-500">Dirección</h3>
                  <p className="mt-1 text-sm text-secondary-900">{formatAddress()}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Teléfono</h3>
                  <p className="mt-1 text-sm text-secondary-900">{restaurant.phone}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Email</h3>
                  <p className="mt-1 text-sm text-secondary-900">{restaurant.email}</p>
                </div>
                
                {(restaurant as any).website && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-secondary-500">Sitio Web</h3>
                    <p className="mt-1 text-sm text-secondary-900">
                      <a
                        href={(restaurant as any).website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-500"
                      >
                        {(restaurant as any).website}
                      </a>
                    </p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Zona Horaria</h3>
                  <p className="mt-1 text-sm text-secondary-900">{restaurant.timezone}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Moneda</h3>
                  <p className="mt-1 text-sm text-secondary-900">{(restaurant as any).currency}</p>
                </div>
                
                {restaurant.description && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-secondary-500">Descripción</h3>
                    <p className="mt-1 text-sm text-secondary-900">{restaurant.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horarios de Operación</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm text-secondary-900">
                {getOperatingHoursSummary()}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Áreas y Capacidades</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-secondary-900">{getAreasSummary()}</p>
              
              {restaurant.areas && restaurant.areas.length > 0 && (
                <div className="mt-4 space-y-2">
                  {restaurant.areas
                    .filter((area: any) => area.isActive)
                    .map((area: any) => (
                      <div key={area.id} className="flex justify-between items-center py-2 border-b border-secondary-100">
                        <span className="text-sm font-medium text-secondary-900">{area.name}</span>
                        <Badge variant="secondary">{area.maxCapacity} personas</Badge>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reglas de Negocio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-secondary-900">{getBusinessRulesSummary()}</p>
              
              {restaurant.businessRules && restaurant.businessRules.length > 0 && (
                <div className="mt-4 space-y-2">
                  {restaurant.businessRules
                    .filter((rule: any) => rule.isActive)
                    .sort((a: any, b: any) => a.priority - b.priority)
                    .map((rule: any) => (
                      <div key={rule.id} className="flex justify-between items-center py-2 border-b border-secondary-100">
                        <div>
                          <span className="text-sm font-medium text-secondary-900">{rule.name}</span>
                          {rule.description && (
                            <p className="text-xs text-secondary-500">{rule.description}</p>
                          )}
                        </div>
                        <Badge variant="default">{rule.ruleType}</Badge>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && settings && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Duración por Defecto</h3>
                  <p className="mt-1 text-sm text-secondary-900">
                    {settings.defaultReservationDuration} minutos
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Máximo Anticipación</h3>
                  <p className="mt-1 text-sm text-secondary-900">
                    {settings.maxAdvanceBookingDays} días
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Mínimo Anticipación</h3>
                  <p className="mt-1 text-sm text-secondary-900">
                    {settings.minAdvanceBookingHours} horas
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Tamaño Máximo Grupo</h3>
                  <p className="mt-1 text-sm text-secondary-900">
                    {settings.maxPartySize} personas
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Reservas Online</h3>
                  <div className="mt-1">
                    <Badge variant={settings.enableOnlineBookings ? 'success' : 'secondary'}>
                      {settings.enableOnlineBookings ? 'Habilitadas' : 'Deshabilitadas'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Lista de Espera</h3>
                  <div className="mt-1">
                    <Badge variant={settings.enableWaitlist ? 'success' : 'secondary'}>
                      {settings.enableWaitlist ? 'Habilitada' : 'Deshabilitada'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Email de Confirmación</h3>
                  <div className="mt-1">
                    <Badge variant={settings.confirmationEmailEnabled ? 'success' : 'secondary'}>
                      {settings.confirmationEmailEnabled ? 'Habilitado' : 'Deshabilitado'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Email de Recordatorio</h3>
                  <div className="mt-1">
                    <Badge variant={settings.reminderEmailEnabled ? 'success' : 'secondary'}>
                      {settings.reminderEmailEnabled ? 'Habilitado' : 'Deshabilitado'}
                    </Badge>
                  </div>
                  {settings.reminderEmailEnabled && (
                    <p className="mt-1 text-xs text-secondary-500">
                      {settings.reminderEmailHoursBefore} horas antes
                    </p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Email de Cancelación</h3>
                  <div className="mt-1">
                    <Badge variant={settings.cancellationEmailEnabled ? 'success' : 'secondary'}>
                      {settings.cancellationEmailEnabled ? 'Habilitado' : 'Deshabilitado'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Cancelación Automática</h3>
                  <div className="mt-1">
                    <Badge variant="default">
                      {settings.autoCancelNoShowMinutes} minutos
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración Regional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Idioma</h3>
                  <p className="mt-1 text-sm text-secondary-900">
                    {settings.language === 'es' ? 'Español' : settings.language}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Formato de Fecha</h3>
                  <p className="mt-1 text-sm text-secondary-900">{settings.dateFormat}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Formato de Hora</h3>
                  <p className="mt-1 text-sm text-secondary-900">
                    {settings.timeFormat === '24h' ? '24 horas' : '12 horas'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}