import { useState, useEffect } from 'react';

export function useDynamicImport<T>(importFn: () => Promise<{ default: T }>) {
  const [component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        setLoading(true);
        const module = await importFn();
        setComponent(module.default);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadComponent();
  }, [importFn]);

  return { component, loading, error };
}
