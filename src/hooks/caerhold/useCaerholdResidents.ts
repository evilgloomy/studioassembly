import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CaerholdResident, CaerholdResidentInput, CaerholdToneProfile, CaerholdCanonRules } from '@/types/caerhold';
import type { Json } from '@/integrations/supabase/types';

const QUERY_KEY = ['caerhold', 'residents'];

// Helper to convert database row to typed CaerholdResident
function mapResident(row: any): CaerholdResident {
  return {
    ...row,
    tone_profile: (row.tone_profile || {}) as CaerholdToneProfile,
    canon_rules: (row.canon_rules || {}) as CaerholdCanonRules,
  };
}

export function useCaerholdResidents() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<CaerholdResident[]> => {
      const { data, error } = await supabase
        .from('caerhold_residents')
        .select('*')
        .order('display_name');

      if (error) throw error;
      return (data || []).map(mapResident);
    },
  });
}

export function useCaerholdResident(slug: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, slug],
    queryFn: async (): Promise<CaerholdResident | null> => {
      const { data, error } = await supabase
        .from('caerhold_residents')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data ? mapResident(data) : null;
    },
    enabled: !!slug,
  });
}

export function useCaerholdResidentById(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'id', id],
    queryFn: async (): Promise<CaerholdResident | null> => {
      const { data, error } = await supabase
        .from('caerhold_residents')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data ? mapResident(data) : null;
    },
    enabled: !!id,
  });
}

export function useCreateCaerholdResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CaerholdResidentInput): Promise<CaerholdResident> => {
      const { data, error } = await supabase
        .from('caerhold_residents')
        .insert({
          slug: input.slug,
          display_name: input.display_name,
          handle: input.handle,
          role_title: input.role_title || null,
          bio: input.bio || null,
          tone_profile: (input.tone_profile || {}) as Json,
          canon_rules: (input.canon_rules || {}) as Json,
          posting_enabled: input.posting_enabled ?? true,
          avatar_media_id: input.avatar_media_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return mapResident(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateCaerholdResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CaerholdResidentInput> }): Promise<CaerholdResident> => {
      const updateData: Record<string, any> = {};
      if (input.slug !== undefined) updateData.slug = input.slug;
      if (input.display_name !== undefined) updateData.display_name = input.display_name;
      if (input.handle !== undefined) updateData.handle = input.handle;
      if (input.role_title !== undefined) updateData.role_title = input.role_title;
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.tone_profile !== undefined) updateData.tone_profile = input.tone_profile as Json;
      if (input.canon_rules !== undefined) updateData.canon_rules = input.canon_rules as Json;
      if (input.posting_enabled !== undefined) updateData.posting_enabled = input.posting_enabled;
      if (input.avatar_media_id !== undefined) updateData.avatar_media_id = input.avatar_media_id;

      const { data, error } = await supabase
        .from('caerhold_residents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapResident(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteCaerholdResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('caerhold_residents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
