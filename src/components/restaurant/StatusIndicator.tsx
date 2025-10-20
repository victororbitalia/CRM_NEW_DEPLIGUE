import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface StatusIndicatorProps {
  status: 'available' | 'occupied' | 'reserved' | 'pending' | 'completed' | 'cancelled' | 'maintenance' | 'confirmed' | 'seated';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  text?: string;
  className?: string;
  variant?: 'dot' | 'badge' | 'pill';
  animated?: boolean;
}

export default function StatusIndicator({
  status,
  size = 'md',
  showText = true,
  text,
  className,
  variant = 'dot',
  animated = false,
}: StatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'bg-success-500';
      case 'occupied':
        return 'bg-error-500';
      case 'reserved':
        return 'bg-warning-500';
      case 'pending':
        return 'bg-info-500';
      case 'confirmed':
        return 'bg-primary-500';
      case 'seated':
        return 'bg-primary-600';
      case 'completed':
        return 'bg-secondary-500';
      case 'cancelled':
        return 'bg-secondary-600';
      case 'maintenance':
        return 'bg-secondary-700';
      default:
        return 'bg-secondary-500';
    }
  };

  const getStatusBgColor = () => {
    switch (status) {
      case 'available':
        return 'bg-success-100 text-success-800';
      case 'occupied':
        return 'bg-error-100 text-error-800';
      case 'reserved':
        return 'bg-warning-100 text-warning-800';
      case 'pending':
        return 'bg-info-100 text-info-800';
      case 'confirmed':
        return 'bg-primary-100 text-primary-800';
      case 'seated':
        return 'bg-primary-100 text-primary-900';
      case 'completed':
        return 'bg-secondary-100 text-secondary-800';
      case 'cancelled':
        return 'bg-secondary-100 text-secondary-800';
      case 'maintenance':
        return 'bg-secondary-100 text-secondary-900';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  const getStatusText = () => {
    if (text) return text;
    
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Ocupado';
      case 'reserved':
        return 'Reservado';
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmada';
      case 'seated':
        return 'En mesa';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return status;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          dot: 'h-2 w-2',
          badge: 'text-xs px-2 py-0.5',
          pill: 'text-xs px-2.5 py-0.5',
        };
      case 'md':
        return {
          dot: 'h-3 w-3',
          badge: 'text-xs px-2.5 py-0.5',
          pill: 'text-sm px-3 py-1',
        };
      case 'lg':
        return {
          dot: 'h-4 w-4',
          badge: 'text-sm px-3 py-1',
          pill: 'text-base px-4 py-1.5',
        };
      default:
        return {
          dot: 'h-3 w-3',
          badge: 'text-xs px-2.5 py-0.5',
          pill: 'text-sm px-3 py-1',
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (variant === 'dot') {
    return (
      <div className={cn('flex items-center', className)}>
        <div
          className={cn(
            'rounded-full',
            sizeClasses.dot,
            getStatusColor(),
            animated && 'animate-pulse'
          )}
        />
        {showText && (
          <span className="ml-2 text-sm font-medium text-gray-700">
            {getStatusText()}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          sizeClasses.badge,
          getStatusBgColor(),
          className
        )}
      >
        {showText && getStatusText()}
      </span>
    );
  }

  // pill variant
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap overflow-hidden',
        sizeClasses.pill,
        getStatusBgColor(),
        className
      )}
    >
      <div
        className={cn(
          'rounded-full mr-2',
          sizeClasses.dot,
          getStatusColor(),
          animated && 'animate-pulse'
        )}
      />
      {showText && getStatusText()}
    </div>
  );
}

// Component for table status with specific styling
export interface TableStatusIndicatorProps {
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function TableStatusIndicator({
  status,
  size = 'md',
  showText = true,
  className,
}: TableStatusIndicatorProps) {
  return (
    <StatusIndicator
      status={status}
      size={size}
      showText={showText}
      variant="pill"
      animated={status === 'occupied'}
      className={className}
    />
  );
}

// Component for reservation status with specific styling
export interface ReservationStatusIndicatorProps {
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function ReservationStatusIndicator({
  status,
  size = 'md',
  showText = true,
  className,
}: ReservationStatusIndicatorProps) {
  return (
    <StatusIndicator
      status={status}
      size={size}
      showText={showText}
      variant="badge"
      animated={status === 'pending'}
      className={className}
    />
  );
}