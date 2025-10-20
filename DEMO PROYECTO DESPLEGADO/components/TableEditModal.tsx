'use client';

import { useState, useEffect } from 'react';
import { Table, Zone } from '@/types';

interface TableEditModalProps {
  table: Table | null;
  zones: Zone[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (table: Table) => void;
  onDelete?: (tableId: string) => void;
}

export default function TableEditModal({
  table,
  zones,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: TableEditModalProps) {
  const [formData, setFormData] = useState({
    number: '',
    capacity: '',
    location: 'interior' as Table['location'],
    positionX: '',
    positionY: '',
    zoneId: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (table) {
      setFormData({
        number: table.number.toString(),
        capacity: table.capacity.toString(),
        location: table.location,
        positionX: table.positionX?.toString() || '',
        positionY: table.positionY?.toString() || '',
        zoneId: table.zoneId || '',
      });
    }
  }, [table]);

  if (!isOpen || !table) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedTable: Table = {
      ...table,
      number: parseInt(formData.number, 10),
      capacity: parseInt(formData.capacity, 10),
      location: formData.location,
      positionX: formData.positionX ? parseFloat(formData.positionX) : undefined,
      positionY: formData.positionY ? parseFloat(formData.positionY) : undefined,
      zoneId: formData.zoneId || undefined,
    };

    onSave(updatedTable);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la mesa ${table.number}?`)) {
      setIsDeleting(true);
      onDelete?.(table.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Editar Mesa {table.number}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Mesa
            </label>
            <input
              type="number"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacidad
            </label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value as Table['location'] })}
            >
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
              <option value="terraza">Terraza</option>
              <option value="privado">Privado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zona
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.zoneId}
              onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
            >
              <option value="">Sin asignar</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posición X (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.positionX}
                onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                placeholder="Horizontal (%)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posición Y (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.positionY}
                onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                placeholder="Vertical (%)"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
            >
              Eliminar
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}