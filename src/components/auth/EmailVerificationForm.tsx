'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';

interface EmailVerificationFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({
  onSuccess,
  redirectTo = '/login',
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      handleVerifyEmail();
    }
  }, [token]);

  const handleVerifyEmail = async () => {
    if (!token) {
      setError('Verification token is missing');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Email verification failed');
      }

      setSuccess(true);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Redirect to login page after a delay
      setTimeout(() => {
        router.push(redirectTo);
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Email verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setResendError('Email is required to resend verification');
      return;
    }

    setResending(true);
    setResendError(null);
    setResendSuccess(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      setResendSuccess('Verification email sent. Please check your inbox.');
    } catch (error) {
      setResendError(error instanceof Error ? error.message : 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-sm text-gray-600">Verifying your email...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-4">
        <div className="text-sm text-green-700">
          <h3 className="font-medium">Email verified successfully!</h3>
          <p className="mt-1">You will be redirected to the login page shortly.</p>
        </div>
        <div className="mt-4">
          <Button
            type="button"
            onClick={() => router.push(redirectTo)}
            variant="primary"
            size="sm"
          >
            Go to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            <h3 className="font-medium">Verification failed</h3>
            <p className="mt-1">{error}</p>
          </div>
          {email && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                Need a new verification link?
              </p>
              <Button
                type="button"
                onClick={handleResendVerification}
                variant="secondary"
                size="sm"
                disabled={resending}
                isLoading={resending}
              >
                Resend verification email
              </Button>
            </div>
          )}
        </div>
      )}

      {resendSuccess && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">{resendSuccess}</div>
        </div>
      )}

      {resendError && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{resendError}</div>
        </div>
      )}

      {!token && !error && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Check your email
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            We've sent a verification link to your email address.
          </p>
          {email && (
            <Button
              type="button"
              onClick={handleResendVerification}
              variant="secondary"
              size="sm"
              disabled={resending}
              isLoading={resending}
            >
              Resend verification email
            </Button>
          )}
        </div>
      )}
    </div>
  );
};