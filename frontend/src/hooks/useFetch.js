import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Small data-fetching hook.
 * const { data, meta, loading, error, reload } = useFetch(() => getRooms(params), [params]);
 */
export default function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async (silent = false) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetcherRef.current();
      setState({ data: res?.data ?? res, meta: res?.meta ?? null, loading: false, error: null });
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error: error.message }));
    }
  }, []);

  useEffect(() => {
    load();
  }, deps);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload: () => load(true), setData };
}
