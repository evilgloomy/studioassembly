import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CaerholdLocationMedia } from '@/types/caerhold';

const QUERY_KEY = ['caerhold', 'location-media'];

export function useCaerholdLocationMedia(locationId: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, locationId],
    queryFn: async (): Promise<(CaerholdLocationMedia & { media?: { public_url: string; type: string } })[]> => {
      const { data, error } = await (supabase as any)
        .from('caerhold_location_media')
        .select('*, media:caerhold_media!caerhold_location_media_media_id_fkey(public_url, type)')
        .eq('location_id', locationId)
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!locationId,
  });
}

export function useAddLocationMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ location_id, media_id, sort_order }: { location_id: string; media_id: string; sort_order?: number }) => {
      const { data, error } = await (supabase as any)
        .from('caerhold_location_media')
        .insert({ location_id, media_id, sort_order: sort_order ?? 0 })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemoveLocationMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('caerhold_location_media')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
