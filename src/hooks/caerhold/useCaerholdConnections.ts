import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CaerholdResidentConnection } from '@/types/caerhold';

const QUERY_KEY = ['caerhold', 'connections'];

export function useCaerholdResidentConnections(residentId: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, residentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('caerhold_resident_connections')
        .select('*, connected_resident:caerhold_residents!caerhold_resident_connections_connected_resident_id_fkey(id, slug, display_name, handle, avatar_media_id, avatar_media:caerhold_media!fk_avatar_media(public_url))')
        .eq('resident_id', residentId);

      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        connected_resident: row.connected_resident ? {
          ...row.connected_resident,
          avatar_url: row.connected_resident.avatar_media?.public_url || null,
        } : null,
      }));
    },
    enabled: !!residentId,
  });
}

export function useCreateConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { resident_id: string; connected_resident_id: string; relation_type: string; note?: string }) => {
      const { data, error } = await (supabase as any)
        .from('caerhold_resident_connections')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('caerhold_resident_connections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
