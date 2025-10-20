'use client';

import { useState } from 'react';
import { useApiTokens } from '@/hooks/useApiTokens';
import { useNotifications } from '@/hooks/useNotifications';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Form, { FormField, FormLabel, FormActions } from '@/components/ui/Form';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

const ApiTokensSection = () => {
  const { tokens, isLoading, error, createToken, revokeToken, updateToken } = useApiTokens();
  const { showSuccess, showError } = useNotifications();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    expiresIn: '90d' as '30d' | '90d' | '1y',
  });

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showError('El nombre del token es requerido');
      return;
    }

    try {
      const result = await createToken({
        name: formData.name,
        expiresIn: formData.expiresIn,
      });

      if (result) {
        setNewToken(result.token);
        showSuccess('Token de API creado correctamente');
        setFormData({ name: '', expiresIn: '90d' });
      }
    } catch (err) {
      showError('Error al crear el token de API');
    }
  };

  const handleRevokeToken = async (tokenId: string, tokenName: string) => {
    if (!confirm(`¿Estás seguro de que quieres revocar el token "${tokenName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const success = await revokeToken(tokenId);
      if (success) {
        showSuccess('Token revocado correctamente');
      }
    } catch (err) {
      showError('Error al revocar el token');
    }
  };

  const copyTokenToClipboard = (token: string) => {
    navigator.clipboard.writeText(token);
    showSuccess('Token copiado al portapapeles');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTokenExpirationColor = (expiresAt: string | null) => {
    if (!expiresAt) return 'bg-gray-100 text-gray-800';
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 7) return 'bg-red-100 text-red-800';
    if (daysUntilExpiry < 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      <Alert variant="info">
        Los tokens de API permiten que aplicaciones externas accedan a tu cuenta de forma segura. 
        Guarda tus tokens en un lugar seguro y nunca los compartas públicamente.
      </Alert>

      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-secondary-900">Tokens de API</h3>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Crear nuevo token
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Tokens list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : tokens.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-secondary-500">No tienes tokens de API creados</p>
            <p className="text-sm text-secondary-400 mt-2">
              Crea tu primer token para comenzar a usar la API
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tokens.map((token) => (
            <Card key={token.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-secondary-900">{token.name}</h4>
                      {token.expiresAt && (
                        <Badge className={getTokenExpirationColor(token.expiresAt)}>
                          Expira: {formatDate(token.expiresAt)}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-secondary-600 space-y-1">
                      <p>Creado: {formatDate(token.createdAt)}</p>
                      <p>Último uso: {formatDate(token.lastUsedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        showSuccess('Por seguridad, los tokens solo se muestran durante la creación. Debes crear un nuevo token si perdiste el actual.');
                      }}
                    >
                      Ver token
                    </Button>
                    <Button
                      size="sm"
                      variant="error"
                      onClick={() => handleRevokeToken(token.id, token.name)}
                    >
                      Revocar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create token modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        size="md"
      >
        <Form onSubmit={handleCreateToken}>
          <ModalHeader>
            Crear nuevo token de API
          </ModalHeader>
          <ModalBody>
            {newToken ? (
              <div className="space-y-4">
                <Alert variant="success">
                  ¡Token creado correctamente!
                </Alert>
                <div>
                  <FormLabel>Tu token de API</FormLabel>
                  <div className="mt-1 p-3 bg-secondary-50 border border-secondary-200 rounded-md">
                    <code className="text-sm break-all">{newToken}</code>
                  </div>
                  <p className="text-xs text-secondary-500 mt-2">
                    Copia este token ahora. No podrás volver a verlo por razones de seguridad.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyTokenToClipboard(newToken)}
                  className="w-full"
                >
                  Copiar token
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <FormField>
                  <FormLabel>Nombre del token</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Token para mi app móvil"
                    required
                  />
                </FormField>
                
                <FormField>
                  <FormLabel>Período de expiración</FormLabel>
                  <select
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={formData.expiresIn}
                    onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value as any })}
                  >
                    <option value="30d">30 días</option>
                    <option value="90d">90 días</option>
                    <option value="1y">1 año</option>
                  </select>
                </FormField>

                <Alert variant="warning">
                  <strong>Importante:</strong> Guarda este token en un lugar seguro. 
                  No podrás volver a verlo después de cerrar esta ventana.
                </Alert>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <FormActions align="between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewToken(null);
                  setFormData({ name: '', expiresIn: '90d' });
                }}
              >
                {newToken ? 'Cerrar' : 'Cancelar'}
              </Button>
              {!newToken && (
                <Button type="submit" disabled={!formData.name.trim()}>
                  Crear token
                </Button>
              )}
            </FormActions>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};

export default ApiTokensSection;