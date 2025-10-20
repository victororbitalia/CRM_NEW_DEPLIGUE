'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Form, { FormField, FormLabel, FormActions } from '@/components/ui/Form';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import TableCard from '@/components/restaurant/TableCard';
import { TableStatusIndicator } from '@/components/restaurant/StatusIndicator';
import TableForm from '@/components/tables/TableForm';
import { useNotifications } from '@/hooks/useNotifications';
import { useTables } from '@/hooks/useTables';
import { Table as TableType } from '@/hooks/useTables';
import { useAreas } from '@/hooks/useAreas';
import { Area } from '@/types';
// Componentes de layout deshabilitados temporalmente
// import TableLayout from '@/components/tables/TableLayout';
// import UnifiedTableLayout from '@/components/tables/UnifiedTableLayout';
// import ImprovedTableLayout from '@/components/tables/ImprovedTableLayout';

// Datos de ejemplo
const tablesData = [
  {
    id: '1',
    number: '1',
    capacity: 4,
    status: 'available' as const,
    location: 'Terraza',
    shape: 'square' as const,
  },
  {
    id: '2',
    number: '2',
    capacity: 2,
    status: 'occupied' as const,
    location: 'Interior',
    shape: 'round' as const,
    currentReservation: {
      id: 'res1',
      customerName: 'Juan Pérez',
      time: '20:00',
    },
  },
  {
    id: '3',
    number: '3',
    capacity: 6,
    status: 'reserved' as const,
    location: 'Interior',
    shape: 'rectangle' as const,
    currentReservation: {
      id: 'res2',
      customerName: 'María García',
      time: '21:30',
    },
  },
  {
    id: '4',
    number: '4',
    capacity: 4,
    status: 'available' as const,
    location: 'Terraza',
    shape: 'square' as const,
  },
  {
    id: '5',
    number: '5',
    capacity: 8,
    status: 'maintenance' as const,
    location: 'Interior',
    shape: 'rectangle' as const,
  },
  {
    id: '6',
    number: '6',
    capacity: 2,
    status: 'available' as const,
    location: 'Barra',
    shape: 'round' as const,
  },
];

const locationOptions = [
  { value: 'interior', label: 'Interior' },
  { value: 'terraza', label: 'Terraza' },
  { value: 'barra', label: 'Barra' },
  { value: 'privado', label: 'Sala Privada' },
];

const shapeOptions = [
  { value: 'round', label: 'Redonda' },
  { value: 'square', label: 'Cuadrada' },
  { value: 'rectangle', label: 'Rectangular' },
];

export default function TablesPage() {
  // ID del restaurante (en una aplicación real, esto vendría del contexto o de la autenticación)
  const restaurantId = 'default-restaurant';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableType | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('');
  // viewMode deshabilitado temporalmente - solo vista de grid disponible
  // const [viewMode, setViewMode] = useState<'grid' | 'layout'>('grid');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    areaId: '',
    number: '',
    capacity: '',
    shape: 'square',
  });
  
  const { showSuccess, showError } = useNotifications();
  const {
    tables,
    isLoading,
    error,
    createTable,
    updateTable,
    deleteTable,
    changeTableStatus,
    getTableStats,
    updateTablePosition,
    refetch,
  } = useTables({
    restaurantId,
    autoRefresh: true,
    refreshInterval: 30000,
    // viewMode deshabilitado temporalmente
    // viewMode,
  });

  const { areas } = useAreas(restaurantId);

  const handleCreateTable = () => {
    setEditingTable(null);
    setFormData({
      areaId: '',
      number: '',
      capacity: '',
      shape: 'square',
    });
    setIsModalOpen(true);
  };

  const handleEditTable = (table: TableType) => {
    setEditingTable(table);
    setFormData({
      areaId: table.areaId,
      number: table.number,
      capacity: table.capacity.toString(),
      shape: table.shape || 'square',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      const tableData = {
        areaId: data.areaId,
        number: data.number,
        capacity: data.capacity,
        shape: data.shape,
      };
      
      if (editingTable) {
        // Editar mesa existente
        await updateTable({
          id: editingTable.id,
          ...tableData,
        });
      } else {
        // Crear nueva mesa
        await createTable(tableData);
      }
      
      setIsModalOpen(false);
      setEditingTable(null);
      setFormData({
        areaId: '',
        number: '',
        capacity: '',
        shape: 'square',
      });
    } catch (error) {
      showError('Ha ocurrido un error al guardar la mesa');
    }
  };

  const handleReserveTable = async (table: TableType) => {
    if (table.currentStatus === 'available') {
      await changeTableStatus(table.id, 'reserved');
      showSuccess(`Mesa ${table.number} reservada correctamente`);
    }
  };

  const handleReleaseTable = async (table: TableType) => {
    await changeTableStatus(table.id, 'available');
    showSuccess(`Mesa ${table.number} liberada correctamente`);
  };

  const handleDeleteTable = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta mesa?')) {
      await deleteTable(id);
    }
  };

  // Filtrar mesas
  const filteredTables = tables.filter(table => {
    const statusMatch = filterStatus === 'all' || table.currentStatus === filterStatus;
    const areaMatch = !filterArea || table.areaId === filterArea;
    return statusMatch && areaMatch;
  });

  // Obtener estadísticas
  const stats = getTableStats();

  // Manejar selección de mesa
  const handleTableSelect = (tableId: string) => {
    setSelectedTableId(tableId === selectedTableId ? null : tableId);
  };

  // Manejar movimiento de mesa
  const handleTableMove = async (tableId: string, positionX: number, positionY: number) => {
    await updateTablePosition(tableId, positionX, positionY);
  };

  return (
    <ProtectedRoute>
      <Layout
        title="Gestión de Mesas"
        subtitle="Administra las mesas de tu restaurante"
        restaurantName="Mi Restaurante"
        actions={
          <div className="flex space-x-2">
            {/* Botones de vista deshabilitados temporalmente - solo vista de grid disponible
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              onClick={() => setViewMode('grid')}
            >
              Vista Grid
            </Button>
            <Button
              variant={viewMode === 'layout' ? 'primary' : 'outline'}
              onClick={() => setViewMode('layout')}
            >
              Vista Layout
            </Button>
            */}
            <Button
              variant="outline"
              onClick={() => window.location.href = '/areas'}
            >
              Gestionar Áreas
            </Button>
            <Button onClick={handleCreateTable}>
              Nueva Mesa
            </Button>
          </div>
        }
      >
        <div className="animate-fade-in">
          {/* Resumen de estados */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Disponibles</p>
                  <p className="text-2xl font-semibold text-green-600">{stats.available}</p>
                  <div className="mt-3">
                    <TableStatusIndicator status="available" />
                  </div>
                </div>
              </CardContent>
            </Card>
           
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Ocupadas</p>
                  <p className="text-2xl font-semibold text-red-600">{stats.occupied}</p>
                  <div className="mt-3">
                    <TableStatusIndicator status="occupied" />
                  </div>
                </div>
              </CardContent>
            </Card>
           
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Reservadas</p>
                  <p className="text-2xl font-semibold text-yellow-600">{stats.reserved}</p>
                  <div className="mt-3">
                    <TableStatusIndicator status="reserved" />
                  </div>
                </div>
              </CardContent>
            </Card>
           
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Mantenimiento</p>
                  <p className="text-2xl font-semibold text-gray-600">{stats.maintenance}</p>
                  <div className="mt-3">
                    <TableStatusIndicator status="maintenance" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant={filterStatus === 'all' ? 'primary' : 'outline'}
                      onClick={() => setFilterStatus('all')}
                    >
                      Todas
                    </Button>
                    <Button
                      size="sm"
                      variant={filterStatus === 'available' ? 'primary' : 'outline'}
                      onClick={() => setFilterStatus('available')}
                    >
                      Disponibles
                    </Button>
                    <Button
                      size="sm"
                      variant={filterStatus === 'occupied' ? 'primary' : 'outline'}
                      onClick={() => setFilterStatus('occupied')}
                    >
                      Ocupadas
                    </Button>
                    <Button
                      size="sm"
                      variant={filterStatus === 'reserved' ? 'primary' : 'outline'}
                      onClick={() => setFilterStatus('reserved')}
                    >
                      Reservadas
                    </Button>
                    <Button
                      size="sm"
                      variant={filterStatus === 'maintenance' ? 'primary' : 'outline'}
                      onClick={() => setFilterStatus('maintenance')}
                    >
                      Mantenimiento
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Mostrando {filteredTables.length} de {tables.length} mesas
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vista de mesas */}
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando mesas...</p>
              </CardContent>
            </Card>
          ) : filteredTables.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                {areas.length === 0 ? (
                  <>
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-secondary-900 mb-2">
                      No hay áreas
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Primero necesitas crear áreas antes de poder añadir mesas
                    </p>
                    <Button onClick={() => window.location.href = '/areas'}>
                      Crear Área
                    </Button>
                  </>
                ) : (
                  <>
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-secondary-900 mb-2">
                      No hay mesas
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {filterStatus === 'all'
                        ? 'Comienza creando tu primera mesa'
                        : 'No hay mesas con los filtros seleccionados'
                      }
                    </p>
                    {filterStatus === 'all' && (
                      <Button onClick={handleCreateTable}>
                        Crear Mesa
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            // Solo vista de grid disponible - vista de layout deshabilitada temporalmente
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTables.map((table) => {
                // Adaptar el formato de la mesa al esperado por TableCard
                const adaptedTable = {
                  id: table.id,
                  number: table.number,
                  capacity: table.capacity,
                  status: (table.currentStatus as any) || 'available',
                  location: table.area?.name || 'Sin área',
                  shape: (table.shape as any) || 'square',
                  currentReservation: table.currentReservation ? {
                    id: table.currentReservation.id,
                    customerName: table.currentReservation.customerName,
                    time: table.currentReservation.startTime,
                  } : undefined,
                };
                
                return (
                  <TableCard
                    key={table.id}
                    table={adaptedTable}
                    onEdit={(table) => handleEditTable(table as any)}
                    onReserve={(table) => handleReserveTable(table as any)}
                    onRelease={(table) => handleReleaseTable(table as any)}
                    onSelect={(table) => setSelectedTable(table.id)}
                    selected={selectedTable === table.id}
                    selectable={true}
                  />
                );
              })}
            </div>
          )}
          {/* Vista de layout deshabilitada temporalmente
          ) : (
            // Vista de layout mejorado
            <div className="h-96 md:h-[600px]">
              <ImprovedTableLayout
                areas={areas as any}
                tables={tables as any}
                selectedTableId={selectedTableId || undefined}
                onTableSelect={handleTableSelect}
                onTableMove={handleTableMove}
                onAreaMove={(areaId, x, y) => {
                  // Por ahora, solo mostramos un mensaje
                  // En una implementación completa, esto guardaría la posición del área
                  showSuccess(`Área ${areaId} movida a (${x}, ${y})`);
                }}
                onAreaResize={(areaId, width, height) => {
                  // Por ahora, solo mostramos un mensaje
                  // En una implementación completa, esto guardaría el tamaño del área
                  showSuccess(`Área ${areaId} redimensionada a ${width}x${height}`);
                }}
                editable={true}
                className="h-full"
              />
            </div>
          */}
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          size="lg"
        >
          <TableForm
            table={editingTable}
            areas={areas as any}
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
            onDelete={editingTable ? () => handleDeleteTable(editingTable.id) : undefined}
            isLoading={false}
          />
        </Modal>
      </Layout>
    </ProtectedRoute>
  );
}