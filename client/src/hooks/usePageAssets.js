import { useQuery } from '@tanstack/react-query';

export const usePageAssets = (slug) =>
  useQuery({
    queryKey: ['pageAssets', slug],
    queryFn: async () => {
      const res = await fetch(`/api/pages/${slug}`);
      if (!res.ok) throw new Error('Failed to load page assets');
      return res.json();
    },
    staleTime: 60_000,            // 1 min cache
    retry: 1,
  }); 