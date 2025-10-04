import { useState, useCallback } from 'react';

export interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseApiReturn<T, TArgs extends unknown[] = unknown[]> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: TArgs) => Promise<T>;
  reset: () => void;
}

/**
 * API 호출을 위한 훅
 */
function useApi<T, TArgs extends unknown[] = unknown[]>(
  apiFunction: (...args: TArgs) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, TArgs> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (...args: TArgs): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      setData(result);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
}

export default useApi;