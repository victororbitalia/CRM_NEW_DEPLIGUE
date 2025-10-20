'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface ForgotPasswordFormData {
  email: string;
}

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
}) => {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });
  const [errors, setErrors] = useState<Partial<ForgotPasswordFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof ForgotPasswordFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<ForgotPasswordFormData> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      // The API always returns success for security reasons
      setSuccessMessage(
        'If an account with this email exists, password reset instructions have been sent to your email.'
      );

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to send reset instructions'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{submitError}</div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">{successMessage}</div>
        </div>
      )}

      <div className="text-sm text-gray-600 mb-4">
        Enter your email address and we'll send you a link to reset your password.
      </div>

      <Input
        type="email"
        name="email"
        label="Email address"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="Enter your email"
        disabled={isLoading || !!successMessage}
        autoComplete="email"
        required
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !!successMessage}
        isLoading={isLoading}
      >
        Send reset instructions
      </Button>
    </form>
  );
};