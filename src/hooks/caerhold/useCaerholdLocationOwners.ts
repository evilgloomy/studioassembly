import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CaerholdLocationOwnerWithResident } from '@/types/caerhold';

const QUERY_KEY = ['caerhold', 'location-owners'];

export function useCaerholdLocationOwners(locationId: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, locationId],
    queryFn: async (): Promise<CaerholdLocationOwnerWithResident[]> => {
      const { data, error } = await (supabase as any)
        .from('caerhold_location_owners')
        .select('*, resident:caerhold_residents!caerhold_location_owners_resident_id_fkey(id, slug, display_name, handle, role_title, avatar_media_id)')
        .eq('location_id', locationId)
        .order('created_at');
      if (error) throw error;
      return data || [];
    },
    enabled: !!locationId,
  });
}

export function useAddLocationOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ location_id, resident_id, role, note }: { location_id: string; resident_id: string; role?: string; note?: string }) => {
      const { data, error } = await (supabase as any)
        .from('caerhold_location_owners')
        .insert({ location_id, resident_id, role: role || 'owner', note: note || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemoveLocationOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('caerhold_location_owners')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
