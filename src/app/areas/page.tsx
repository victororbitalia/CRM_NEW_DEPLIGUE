'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Form, { FormField, FormLabel, FormActions } from '@/components/ui/Form';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { useNotifications } from '@/hooks/useNotifications';
import { useAreas } from '@/hooks/useAreas';

export default function AreasPage() {
  // ID del restaurante (en una aplicación real, esto vendría del contexto o de la autenticación)
  const restaurantId = 'default-restaurant';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxCapacity: '',
    isActive: true,
  });
  
  const { showSuccess, showError } = useNotifications();
  const {
    areas,
    isLoading,
    error,
    createArea,
    updateArea,
    deleteArea,
    refetch,
  } = useAreas({ restaurantId });

  const handleCreateArea = () => {
    setEditingArea(null);
    setFormData({
      name: '',
      description: '',
      maxCapacity: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleEditArea = (area: any) => {
    setEditingArea(area);
    setFormData({
      name: area.name,
      description: area.description || '',
      maxCapacity: area.maxCapacity.toString(),
      isActive: area.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const areaData = {
        restaurantId,
        name: formData.name,
        description: formData.description,
        maxCapacity: parseInt(formData.maxCapacity, 10),
        isActive: formData.isActive,
      };
      
      if (editingArea) {
        // Editar área existente
        await updateArea({
          id: editingArea.id,
          ...areaData,
        });
      } else {
        // Crear nueva área
        await createArea(areaData);
      }
      
      setIsModalOpen(false);
      setEditingArea(null);
      setFormData({
        name: '',
        description: '',
        maxCapacity: '',
        isActive: true,
      });
    } catch (error) {
      showError('Ha ocurrido un error al guardar el área');
    }
  };

  const handleDeleteArea = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta área?')) {
      await deleteArea(id);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateArea({
      id,
      isActive,
    });
  };

  return (
    <ProtectedRoute>
      <Layout
        title="Gestión de Áreas"
        subtitle="Administra las áreas de tu restaurante"
        restaurantName="Mi Restaurante"
        actions={
          <Button onClick={handleCreateArea}>
            Nueva Área
          </Button>
        }
      >
        <div className="animate-fade-in">
          {/* Resumen de áreas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Total Áreas</p>
                    <p className="text-2xl font-semibold text-primary-600">{areas.length}</p>
                  </div>
                  <svg className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Áreas Activas</p>
                    <p className="text-2xl font-semibold text-success-600">
                      {areas.filter(area => area.isActive).length}
                    </p>
                  </div>
                  <svg className="h-8 w-8 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Capacidad Total</p>
                    <p className="text-2xl font-semibold text-info-600">
                      {areas.reduce((sum, area) => sum + area.maxCapacity, 0)}
                    </p>
                  </div>
                  <svg className="h-8 w-8 text-info-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de áreas */}
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-secondary-600">Cargando áreas...</p>
              </CardContent>
            </Card>
          ) : areas.length === 0 ? (
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
                  No hay áreas
                </h3>
                <p className="text-secondary-600 mb-4">
                  Comienza creando tu primera área
                </p>
                <Button onClick={handleCreateArea}>
                  Crear Área
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {areas.map((area) => (
                <Card key={area.id} className={area.isActive ? '' : 'opacity-60'}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{area.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleActive(area.id, !area.isActive)}
                          className={`p-1 rounded-full ${
                            area.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={area.isActive ? 'Desactivar' : 'Activar'}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditArea(area)}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-50"
                          title="Editar"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteArea(area.id)}
                          className="p-1 rounded-full text-red-600 hover:bg-red-50"
                          title="Eliminar"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {area.description && (
                      <p className="text-sm text-secondary-600 mb-3">{area.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-500">Capacidad:</span>
                      <span className="font-medium">{area.maxCapacity} personas</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-secondary-500">Estado:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        area.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {area.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            size="md"
          >
            <Form onSubmit={handleSubmit}>
              <ModalHeader>
                {editingArea ? 'Editar Área' : 'Nueva Área'}
              </ModalHeader>
              <ModalBody>
                <FormField>
                  <FormLabel>Nombre</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Interior, Terraza, Barra..."
                    required
                  />
                </FormField>
                
                <FormField>
                  <FormLabel>Descripción</FormLabel>
                  <Input
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del área (opcional)"
                  />
                </FormField>
                
                <FormField>
                  <FormLabel>Capacidad máxima</FormLabel>
                  <Input
                    name="maxCapacity"
                    type="number"
                    min="1"
                    max="200"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                    placeholder="Número de personas"
                    required
                  />
                </FormField>
              </ModalBody>
              <ModalFooter>
                <FormActions align="between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingArea ? 'Actualizar' : 'Crear'}
                  </Button>
                </FormActions>
              </ModalFooter>
            </Form>
          </Modal>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}