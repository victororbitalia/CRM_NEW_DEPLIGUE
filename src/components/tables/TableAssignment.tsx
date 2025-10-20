'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { Area } from '@/types';

// Extender el tipo Table para incluir propiedades adicionales
interface Table {
  id: string;
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

interface AssignmentRequest {
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  duration?: number;
  areaId?: string;
  isAccessible?: boolean;
  preferences?: {
    areaId?: string;
    shape?: string;
    location?: string;
  };
}

interface AssignmentResult {
  assigned: boolean;
  table?: Table;
  score?: number;
  reasons?: {
    capacityFit: number;
    areaMatch: number;
    shapeMatch: number;
    locationMatch: number;
    accessibility: number;
  };
  alternatives?: Table[];
  reason?: string;
  suggestions?: Array<{
    time: string;
    available: boolean;
    tablesCount: number;
  }>;
  reservationDetails?: {
    date: string;
    time: string;
    partySize: number;
    duration: number;
    startTime: string;
    endTime: string;
  };
}

interface TableAssignmentProps {
  restaurantId: string;
  areas: Area[];
  onAssignment?: (result: AssignmentResult) => void;
  onTableSelect?: (tableId: string) => void;
  className?: string;
}

const TableAssignment: React.FC<TableAssignmentProps> = ({
  restaurantId,
  areas,
  onAssignment,
  onTableSelect,
  className = '',
}) => {
  const [request, setRequest] = useState<AssignmentRequest>({
    restaurantId,
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    partySize: 2,
    duration: 120,
    isAccessible: false,
  });

  const [result, setResult] = useState<AssignmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Preparar opciones de áreas
  const areaOptions = [
    { value: '', label: 'Cualquier área' },
    ...areas.map(area => ({
      value: area.id,
      label: area.name,
    })),
  ];

  // Preparar opciones de formas
  const shapeOptions = [
    { value: '', label: 'Cualquier forma' },
    { value: 'rectangle', label: 'Rectangular' },
    { value: 'circle', label: 'Redonda' },
    { value: 'square', label: 'Cuadrada' },
  ];

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!request.date) {
      newErrors.date = 'La fecha es requerida';
    }

    if (!request.time) {
      newErrors.time = 'La hora es requerida';
    }

    if (!request.partySize || request.partySize < 1) {
      newErrors.partySize = 'El número de comensales debe ser al menos 1';
    }

    if (request.partySize && request.partySize > 20) {
      newErrors.partySize = 'El número de comensales no puede exceder 20';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Realizar asignación automática
  const handleAssign = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/tables/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        onAssignment && onAssignment(data.data);
      } else {
        setResult({
          assigned: false,
          reason: data.error || 'Error al realizar la asignación',
        });
      }
    } catch (error) {
      console.error('Error en asignación automática:', error);
      setResult({
        assigned: false,
        reason: 'Error de conexión. Inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (field: string, value: any) => {
    setRequest(prev => ({
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

  // Obtener color según puntuación
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'secondary';
  };

  // Renderizar resultado de asignación
  const renderResult = () => {
    if (!result) return null;

    if (!result.assigned) {
      return (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-red-900">No hay mesas disponibles</h3>
            </div>
            
            <p className="text-red-700 mb-4">{result.reason}</p>

            {/* Mostrar sugerencias alternativas */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-900 mb-2">Horarios alternativos:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {result.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded border text-sm ${
                        suggestion.available
                          ? 'bg-green-100 border-green-300 text-green-800'
                          : 'bg-gray-100 border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="font-medium">{suggestion.time}</div>
                      <div className="text-xs">
                        {suggestion.available
                          ? `${suggestion.tablesCount} mesas disponibles`
                          : 'No disponible'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mt-6 border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-green-900">Mesa asignada correctamente</h3>
          </div>

          {/* Información de la mesa asignada */}
          {result.table && (
            <div className="bg-white p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">
                  Mesa {result.table.number}
                </h4>
                {result.score && (
                  <Badge color={getScoreColor(result.score) as any}>
                    {result.score}% de coincidencia
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span>Capacidad:</span>
                  <span className="ml-1 font-medium">{result.table.capacity} personas</span>
                </div>
                <div>
                  <span>Área:</span>
                  <span className="ml-1 font-medium">
                    {areas.find(a => a.id === (result.table as any)?.areaId)?.name || 'Sin asignar'}
                  </span>
                </div>
              </div>

              {/* Detalles de la reserva */}
              {result.reservationDetails && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <p>
                      <span>Fecha:</span>
                      <span className="ml-1 font-medium">
                        {new Date(result.reservationDetails.date).toLocaleDateString('es-ES')}
                      </span>
                    </p>
                    <p>
                      <span>Hora:</span>
                      <span className="ml-1 font-medium">
                        {result.reservationDetails.time} ({result.reservationDetails.duration} min)
                      </span>
                    </p>
                    <p>
                      <span>Comensales:</span>
                      <span className="ml-1 font-medium">{result.reservationDetails.partySize}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Alternativas */}
          {result.alternatives && result.alternatives.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Otras opciones disponibles:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {result.alternatives.map((table, index) => (
                  <div
                    key={table.id}
                    className="bg-white p-3 rounded border border-gray-200 text-sm"
                  >
                    <div className="font-medium">Mesa {table.number}</div>
                    <div className="text-gray-600">
                      {table.capacity} personas • {areas.find(a => a.id === (table as any).areaId)?.name}
                    </div>
                    {onTableSelect && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() => onTableSelect(table.id)}
                      >
                        Seleccionar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="mt-4 flex justify-end space-x-2">
            {onTableSelect && result.table && (
              <Button
                variant="outline"
                onClick={() => onTableSelect(result.table!.id)}
              >
                Ver detalles de la mesa
              </Button>
            )}
            <Button onClick={() => setResult(null)}>
              Nueva búsqueda
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Asignación automática de mesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <Input
                type="date"
                value={request.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                error={errors.date}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Hora */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora *
              </label>
              <Input
                type="time"
                value={request.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                error={errors.time}
              />
            </div>

            {/* Número de comensales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comensales *
              </label>
              <Input
                type="number"
                min="1"
                max="20"
                value={request.partySize}
                onChange={(e) => handleInputChange('partySize', parseInt(e.target.value, 10) || 0)}
                error={errors.partySize}
              />
            </div>

            {/* Duración */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración (minutos)
              </label>
              <Select
                value={request.duration?.toString() || '120'}
                onChange={(value) => handleInputChange('duration', value)}
                options={[
                  { value: '60', label: '60 min' },
                  { value: '90', label: '90 min' },
                  { value: '120', label: '120 min' },
                  { value: '150', label: '150 min' },
                  { value: '180', label: '180 min' },
                ]}
              />
            </div>

            {/* Área preferida */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Área preferida
              </label>
              <Select
                value={request.areaId || ''}
                onChange={(value) => handleInputChange('areaId', value || undefined)}
                options={areaOptions}
              />
            </div>

            {/* Accesibilidad */}
            <div className="flex items-center space-x-2 pt-6">
              <input
                id="isAccessible"
                type="checkbox"
                checked={request.isAccessible || false}
                onChange={(e) => handleInputChange('isAccessible', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isAccessible" className="text-sm text-gray-700">
                Requiere accesibilidad
              </label>
            </div>
          </div>

          {/* Preferencias adicionales */}
          <div className="mt-6 border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Preferencias adicionales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forma de mesa
                </label>
                <Select
                  value={request.preferences?.shape || ''}
                  onChange={(value) => handleInputChange('preferences', {
                    ...request.preferences,
                    shape: value || undefined,
                  })}
                  options={shapeOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación específica
                </label>
                <Input
                  placeholder="Ej: cerca de la ventana, en el centro..."
                  value={request.preferences?.location || ''}
                  onChange={(e) => handleInputChange('preferences', {
                    ...request.preferences,
                    location: e.target.value || undefined,
                  })}
                />
              </div>
            </div>
          </div>

          {/* Botón de búsqueda */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleAssign}
              disabled={isLoading}
              className="min-w-[150px]"
            >
              {isLoading ? 'Buscando...' : 'Asignar mesa'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      {renderResult()}
    </div>
  );
};

export default TableAssignment;