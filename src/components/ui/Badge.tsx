import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  dot?: boolean;
  icon?: ReactNode;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, children, variant = 'default', size = 'md', rounded = false, dot = false, icon, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center font-medium';
    
    const variantClasses = {
      default: 'bg-secondary-100 text-secondary-800',
      primary: 'bg-primary-100 text-primary-800',
      secondary: 'bg-secondary-100 text-secondary-800',
      success: 'bg-success-100 text-success-800',
      warning: 'bg-warning-100 text-warning-800',
      error: 'bg-error-100 text-error-800',
      info: 'bg-blue-100 text-blue-800',
    };
    
    const sizeClasses = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-xs px-2.5 py-0.5',
      lg: 'text-sm px-3 py-1',
    };
    
    const roundedClasses = rounded ? 'rounded-full' : 'rounded';

    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          roundedClasses,
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'mr-1.5 h-2 w-2 rounded-full',
              variant === 'success' && 'bg-success-400',
              variant === 'warning' && 'bg-warning-400',
              variant === 'error' && 'bg-error-400',
              variant === 'info' && 'bg-blue-400',
              variant === 'primary' && 'bg-primary-400',
              variant === 'default' && 'bg-secondary-400'
            )}
          />
        )}
        {icon && <span className="mr-1">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'available' | 'occupied' | 'reserved' | 'pending' | 'completed' | 'cancelled';
}

export function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const getStatusVariant = (): BadgeProps['variant'] => {
    switch (status) {
      case 'available':
        return 'success';
      case 'occupied':
        return 'error';
      case 'reserved':
        return 'warning';
      case 'pending':
        return 'info';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Ocupado';
      case 'reserved':
        return 'Reservado';
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <Badge variant={getStatusVariant()} {...props}>
      {getStatusText()}
    </Badge>
  );
}

export default Badge;