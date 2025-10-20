import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ApiToken {
  id: string;
  name: string;
  permissions: any;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface CreateTokenData {
  name: string;
  permissions?: any;
  expiresIn?: '30d' | '90d' | '1y';
}

export const useApiTokens = () => {
  const { isAuthenticated } = useAuth();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all API tokens
  const fetchTokens = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/api-tokens', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch API tokens');
      }

      const data = await response.json();
      setTokens(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new API token
  const createToken = async (tokenData: CreateTokenData): Promise<{ token: string } | null> => {
    if (!isAuthenticated) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/api-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(tokenData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create API token');
      }

      const data = await response.json();
      
      // Refresh the tokens list
      await fetchTokens();
      
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Revoke an API token
  const revokeToken = async (tokenId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/api-tokens/${tokenId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revoke API token');
      }

      // Remove the token from the local state
      setTokens(prev => prev.filter(token => token.id !== tokenId));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an API token
  const updateToken = async (tokenId: string, updateData: Partial<CreateTokenData>): Promise<boolean> => {
    if (!isAuthenticated) return false;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/api-tokens/${tokenId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update API token');
      }

      const data = await response.json();
      
      // Update the token in the local state
      setTokens(prev => 
        prev.map(token => 
          token.id === tokenId ? { ...token, ...data.data } : token
        )
      );
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tokens on component mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchTokens();
    } else {
      setTokens([]);
    }
  }, [isAuthenticated]);

  return {
    tokens,
    isLoading,
    error,
    fetchTokens,
    createToken,
    revokeToken,
    updateToken,
  };
};