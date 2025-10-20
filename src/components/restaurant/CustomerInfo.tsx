import { ReactNode } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday?: string;
  preferences?: string[];
  notes?: string;
  totalReservations: number;
  totalSpent: number;
  lastVisit?: string;
  loyaltyPoints?: number;
  vipStatus?: 'none' | 'silver' | 'gold' | 'platinum';
}

interface CustomerInfoProps {
  customer: Customer;
  onEdit?: (customer: Customer) => void;
  onReserve?: (customer: Customer) => void;
  onViewHistory?: (customer: Customer) => void;
  className?: string;
  compact?: boolean;
  showActions?: boolean;
  showStats?: boolean;
}

export default function CustomerInfo({
  customer,
  onEdit,
  onReserve,
  onViewHistory,
  className,
  compact = false,
  showActions = true,
  showStats = true,
}: CustomerInfoProps) {
  const getVipVariant = () => {
    switch (customer.vipStatus) {
      case 'platinum':
        return 'error';
      case 'gold':
        return 'warning';
      case 'silver':
        return 'secondary';
      case 'none':
      default:
        return 'default';
    }
  };

  const getVipText = () => {
    switch (customer.vipStatus) {
      case 'platinum':
        return 'Platino';
      case 'gold':
        return 'Oro';
      case 'silver':
        return 'Plata';
      case 'none':
      default:
        return 'Estándar';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getInitials = () => {
    return `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toUpperCase();
  };

  const renderActions = () => {
    if (!showActions) return null;

    return (
      <div className="flex gap-2 mt-4">
        <Button size="sm" onClick={() => onReserve?.(customer)}>
          Hacer Reserva
        </Button>
        <Button size="sm" variant="outline" onClick={() => onViewHistory?.(customer)}>
          Ver Historial
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit?.(customer)}>
          Editar
        </Button>
      </div>
    );
  };

  if (compact) {
    return (
      <div className={cn('border border-secondary-200 rounded-lg p-4 bg-white', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-medium">{getInitials()}</span>
            </div>
            <div>
              <h3 className="font-medium text-secondary-900">
                {customer.firstName} {customer.lastName}
              </h3>
              <p className="text-sm text-secondary-600">{customer.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={getVipVariant()}>{getVipText()}</Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-medium text-lg">{getInitials()}</span>
            </div>
            <div>
              <CardTitle className="text-lg">
                {customer.firstName} {customer.lastName}
              </CardTitle>
              <div className="flex items-center mt-1 space-x-2">
                <Badge variant={getVipVariant()}>{getVipText()}</Badge>
                {customer.loyaltyPoints && (
                  <span className="text-sm text-secondary-600">
                    {customer.loyaltyPoints} puntos
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{customer.email}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{customer.phone}</span>
            </div>
            
            {customer.birthday && (
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 mr-2 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(customer.birthday)}</span>
              </div>
            )}
            
            {customer.lastVisit && (
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 mr-2 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Última visita: {formatDate(customer.lastVisit)}</span>
              </div>
            )}
          </div>
          
          {customer.preferences && customer.preferences.length > 0 && (
            <div>
              <p className="text-sm font-medium text-secondary-700 mb-1">Preferencias:</p>
              <div className="flex flex-wrap gap-1">
                {customer.preferences.map((preference, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    {preference}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {customer.notes && (
            <div>
              <p className="text-sm font-medium text-secondary-700 mb-1">Notas:</p>
              <p className="text-sm text-secondary-600 bg-secondary-50 p-2 rounded">
                {customer.notes}
              </p>
            </div>
          )}
          
          {showStats && (
            <div className="pt-3 border-t border-secondary-200">
              <h4 className="text-sm font-medium text-secondary-700 mb-2">Estadísticas</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-secondary-500">Total de reservas</p>
                  <p className="text-lg font-semibold text-secondary-900">{customer.totalReservations}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Gasto total</p>
                  <p className="text-lg font-semibold text-secondary-900">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {renderActions()}
      </CardContent>
    </Card>
  );
}