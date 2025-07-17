import { useQuery } from '@tanstack/react-query';

export const usePageAssets = (slug) => {
  const query = useQuery({
    queryKey: ['pageAssets', slug],
    queryFn: async () => {
      console.log('[DEBUG] usePageAssets fetching for', slug);
      const res = await fetch(`/api/pages/${slug}`);
      console.log('[DEBUG] fetch status', res.status);
      if (!res.ok) throw new Error('Failed to load page assets');
      const data = await res.json();
      console.log('[DEBUG] fetch json', data);
      console.log('[DEBUG] usePageAssets returning data:', data);
      return data;
    },
    staleTime: 60_000,            // 1 min cache
    retry: 1,
  });
  
  console.log('[DEBUG] usePageAssets hook state:', {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isError: query.isError
  });
  
  return query;
}; 