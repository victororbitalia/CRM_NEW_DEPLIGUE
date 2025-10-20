'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface UseProtectedRouteOptions {
  requiredRoles?: string[];
  requiredPermissions?: string[];
  redirectTo?: string;
}

export const useProtectedRoute = ({
  requiredRoles = [],
  requiredPermissions = [],
  redirectTo = '/login',
}: UseProtectedRouteOptions = {}) => {
  const { user, isLoading, isAuthenticated, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Check if user has required roles
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => hasRole(role));
      if (!hasRequiredRole) {
        router.push('/unauthorized');
        return;
      }
    }

    // Check if user has required permissions
    if (requiredPermissions.length > 0) {
      const hasRequiredPermission = requiredPermissions.some(permission => hasPermission(permission));
      if (!hasRequiredPermission) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isLoading, isAuthenticated, hasRole, hasPermission, router, redirectTo, requiredRoles, requiredPermissions]);

  return { user, isLoading, isAuthenticated };
};