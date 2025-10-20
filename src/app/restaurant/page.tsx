'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useNotifications } from '@/hooks/useNotifications';
import RestaurantForm from '@/components/restaurant/RestaurantForm';
import RestaurantProfile from '@/components/restaurant/RestaurantProfile';
import OperatingHoursForm from '@/components/restaurant/OperatingHoursForm';
import AreaManager from '@/components/restaurant/AreaManager';
import BusinessRulesForm from '@/components/restaurant/BusinessRulesForm';

type TabType = 'list' | 'profile' | 'hours' | 'areas' | 'rules';

export default function RestaurantPage() {
  const router = useRouter();
  const { restaurants, loading, error, fetchRestaurants, deleteRestaurant } = useRestaurant();
  const { showSuccess, showError } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleSelectRestaurant = (restaurantId: string, tab: TabType = 'profile') => {
    setSelectedRestaurant(restaurantId);
    setActiveTab(tab);
  };

  const handleCreateRestaurant = () => {
    setShowCreateModal(true);
  };

  const handleRestaurantSaved = () => {
    setShowCreateModal(false);
    fetchRestaurants();
    showSuccess('Restaurante guardado correctamente');
  };

  const handleDeleteRestaurant = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el restaurante "${name}"?`)) {
      return;
    }

    try {
      const success = await deleteRestaurant(id);
      if (success) {
        showSuccess('Restaurante eliminado correctamente');
        if (selectedRestaurant === id) {
          setSelectedRestaurant(null);
          setActiveTab('list');
        }
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      showError('Ha ocurrido un error al eliminar el restaurante');
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'success' : 'secondary'}>
        {isActive ? 'Activo' : 'Inactivo'}
      </Badge>
    );
  };

  const getTabContent = () => {
    if (!selectedRestaurant) {
      return null;
    }

    switch (activeTab) {
      case 'profile':
        return (
          <RestaurantProfile
            restaurantId={selectedRestaurant}
            onEdit={() => setShowCreateModal(true)}
          />
        );
      case 'hours':
        return (
          <OperatingHoursForm
            restaurantId={selectedRestaurant}
            onSave={handleRestaurantSaved}
            onCancel={() => setActiveTab('profile')}
          />
        );
      case 'areas':
        return (
          <AreaManager
            restaurantId={selectedRestaurant}
            onSave={handleRestaurantSaved}
          />
        );
      case 'rules':
        return (
          <BusinessRulesForm
            restaurantId={selectedRestaurant}
            onSave={handleRestaurantSaved}
          />
        );
      default:
        return null;
    }
  };

  const selectedRestaurantData = restaurants.find(r => r.id === selectedRestaurant);

  if (loading && restaurants.length === 0) {
    return (
      <ProtectedRoute>
        <Layout title="Gestión de Restaurantes" subtitle="Cargando...">
          <div className="flex justify-center items-center h-64">
            <Loading size="lg" />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout
        title="Gestión de Restaurantes"
        subtitle="Administra la información de tus restaurantes"
        actions={
          <Button onClick={handleCreateRestaurant}>
            Nuevo Restaurante
          </Button>
        }
      >
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {activeTab === 'list' && (
          <div className="animate-fade-in">
            {restaurants.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-secondary-400 mb-4"
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
                    No hay restaurantes
                  </h3>
                  <p className="text-secondary-600 mb-4">
                    Comienza creando tu primer restaurante
                  </p>
                  <Button onClick={handleCreateRestaurant}>
                    Crear Restaurante
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                  <Card key={restaurant.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{restaurant.name}</span>
                        {getStatusBadge((restaurant as any).isActive)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-secondary-600 mb-4">
                        {(restaurant as any).address || 'Sin dirección'}
                      </p>
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-secondary-500">
                          {(restaurant as any).phone || 'Sin teléfono'}
                        </span>
                        <span className="text-sm text-secondary-500">
                          {(restaurant as any).email || 'Sin email'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectRestaurant(restaurant.id, 'profile')}
                        >
                          Ver Detalles
                        </Button>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSelectRestaurant(restaurant.id, 'hours')}
                          >
                            Horarios
                          </Button>
                          <Button
                            size="sm"
                            variant="error"
                            onClick={() => handleDeleteRestaurant(restaurant.id, restaurant.name)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab !== 'list' && selectedRestaurantData && (
          <div className="animate-fade-in">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('list')}
                >
                  ← Volver a la lista
                </Button>
                <h2 className="text-2xl font-bold text-secondary-900">
                  {selectedRestaurantData.name}
                </h2>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant={activeTab === 'profile' ? 'primary' : 'outline'}
                  onClick={() => setActiveTab('profile')}
                >
                  Perfil
                </Button>
                <Button
                  variant={activeTab === 'hours' ? 'primary' : 'outline'}
                  onClick={() => setActiveTab('hours')}
                >
                  Horarios
                </Button>
                <Button
                  variant={activeTab === 'areas' ? 'primary' : 'outline'}
                  onClick={() => setActiveTab('areas')}
                >
                  Áreas
                </Button>
                <Button
                  variant={activeTab === 'rules' ? 'primary' : 'outline'}
                  onClick={() => setActiveTab('rules')}
                >
                  Reglas
                </Button>
              </div>
            </div>

            {getTabContent()}
          </div>
        )}

        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          size="lg"
        >
          <ModalHeader>
            Nuevo Restaurante
          </ModalHeader>
          <ModalBody>
            <RestaurantForm
              onSave={handleRestaurantSaved}
              onCancel={() => setShowCreateModal(false)}
            />
          </ModalBody>
        </Modal>
      </Layout>
    </ProtectedRoute>
  );
}