import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const QUERY_KEY = ['caerhold', 'site_settings'];

export function useCaerholdSiteSettings(key: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, key],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('caerhold_site_settings')
        .select('*')
        .eq('key', key)
        .maybeSingle();

      if (error) throw error;
      return data?.value || null;
    },
    enabled: !!key,
  });
}

export function useUpdateCaerholdSiteSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, any> }) => {
      const { data, error } = await (supabase as any)
        .from('caerhold_site_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
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
