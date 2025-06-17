// src/hooks/useApiQuery.ts
import { useState, useEffect, useCallback } from 'react';

interface ApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useApiQuery<T>(apiCall: () => Promise<T>, dependencies: unknown[] = []): ApiQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    // Individual dependencies from the spread array should be listed
    // instead of using ...dependencies
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
}

interface ApiMutationResult<T, P> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  mutate: (params: P) => Promise<T>;
}

export function useApiMutation<T, P>(
  apiCall: (params: P) => Promise<T>
): ApiMutationResult<T, P> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (params: P) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall(params);
      setData(result);
      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, mutate };
}