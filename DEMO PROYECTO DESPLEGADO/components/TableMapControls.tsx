'use client';

import { Zone } from '@/types';

interface TableMapControlsProps {
  zones: Zone[];
  selectedZoneId?: string;
  onZoneFilterChange: (zoneId: string | undefined) => void;
  onAddTable: () => void;
  onAddZone: () => void;
  onEditZones: () => void;
  isAddingTable: boolean;
  isEditingZones: boolean;
}

export default function TableMapControls({
  zones,
  selectedZoneId,
  onZoneFilterChange,
  onAddTable,
  onAddZone,
  onEditZones,
  isAddingTable,
  isEditingZones,
}: TableMapControlsProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Mapa de Mesas</h3>
          
          <div className="flex items-center gap-2">
            <label htmlFor="zone-filter" className="text-sm font-medium">
              Filtrar por zona:
            </label>
            <select
              id="zone-filter"
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedZoneId || ''}
              onChange={(e) => onZoneFilterChange(e.target.value || undefined)}
            >
              <option value="">Todas las zonas</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onAddTable}
            disabled={isAddingTable}
            className={`
              px-4 py-2 rounded-md font-medium transition-colors
              ${isAddingTable
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }
            `}
          >
            {isAddingTable ? 'Selecciona una zona...' : 'Añadir Mesa'}
          </button>
          
          <button
            onClick={onAddZone}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium transition-colors"
          >
            Añadir Zona
          </button>
          
          <button
            onClick={onEditZones}
            className={`
              px-4 py-2 rounded-md font-medium transition-colors
              ${isEditingZones
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-500 text-white hover:bg-gray-600'
              }
            `}
          >
            {isEditingZones ? 'Guardando Zonas' : 'Editar Zonas'}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>Ocupada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
          <span>Reservada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span>Seleccionada</span>
        </div>
      </div>
    </div>
  );
}