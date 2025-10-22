'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

// Componente que envuelve el formulario con Suspense
function ResetPasswordContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              back to sign in
            </Link>
          </p>
        </div>
        <div className="mt-8 bg-white py-8 px-6 shadow rounded-lg">
          <ResetPasswordForm
            onSuccess={() => {
              // Navigation is handled by the form component
            }}
          />
          <div className="mt-6 text-center">
            <Link
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500 text-sm"
            >
              Need another reset link?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}