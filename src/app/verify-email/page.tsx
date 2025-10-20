'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { EmailVerificationForm } from '@/components/auth/EmailVerificationForm';

export default function VerifyEmailPage() {
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
            Verify your email
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
          <EmailVerificationForm
            onSuccess={() => {
              // Navigation is handled by the form component
            }}
          />
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 text-sm"
            >
              Already verified? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}