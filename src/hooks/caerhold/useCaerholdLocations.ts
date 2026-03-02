import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CaerholdLocation, CaerholdLocationInput, CaerholdLocationType, CaerholdCanonRules } from '@/types/caerhold';
import type { Json } from '@/integrations/supabase/types';

const QUERY_KEY = ['caerhold', 'locations'];

// Helper to convert database row to typed CaerholdLocation
function mapLocation(row: any): CaerholdLocation {
  return {
    ...row,
    type: row.type as CaerholdLocationType,
    canon_rules: (row.canon_rules || {}) as CaerholdCanonRules,
    ai_locked_fields: row.ai_locked_fields || [],
    vibe_tags: row.vibe_tags || null,
    signature_items: row.signature_items || null,
    visitor_tips: row.visitor_tips || null,
    is_published: row.is_published ?? false,
  };
}

export function useCaerholdLocations(typeFilter?: CaerholdLocationType) {
  return useQuery({
    queryKey: [...QUERY_KEY, typeFilter],
    queryFn: async (): Promise<CaerholdLocation[]> => {
      let query = supabase
        .from('caerhold_locations')
        .select('*')
        .order('name');

      if (typeFilter) {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapLocation);
    },
  });
}

export function useCaerholdLocation(slug: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, slug],
    queryFn: async (): Promise<CaerholdLocation | null> => {
      const { data, error } = await supabase
        .from('caerhold_locations')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data ? mapLocation(data) : null;
    },
    enabled: !!slug,
  });
}

export function useCaerholdLocationById(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'id', id],
    queryFn: async (): Promise<CaerholdLocation | null> => {
      const { data, error } = await supabase
        .from('caerhold_locations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data ? mapLocation(data) : null;
    },
    enabled: !!id,
  });
}

export function useCreateCaerholdLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CaerholdLocationInput): Promise<CaerholdLocation> => {
      const { data, error } = await supabase
        .from('caerhold_locations')
        .insert({
          slug: input.slug,
          name: input.name,
          type: input.type,
          description: input.description || null,
          canon_rules: (input.canon_rules || {}) as Json,
          hero_media_id: input.hero_media_id || null,
          district_id: input.district_id || null,
          is_published: input.is_published ?? false,
          short_blurb: input.short_blurb || null,
          category: input.category || null,
          vibe_tags: input.vibe_tags || null,
          signature_items: input.signature_items || null,
          visitor_tips: input.visitor_tips || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return mapLocation(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateCaerholdLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CaerholdLocationInput> }): Promise<CaerholdLocation> => {
      const updateData: Record<string, any> = {};
      if (input.slug !== undefined) updateData.slug = input.slug;
      if (input.name !== undefined) updateData.name = input.name;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.canon_rules !== undefined) updateData.canon_rules = input.canon_rules as Json;
      if (input.hero_media_id !== undefined) updateData.hero_media_id = input.hero_media_id;
      if (input.district_id !== undefined) updateData.district_id = input.district_id;
      if (input.is_published !== undefined) updateData.is_published = input.is_published;
      if (input.hero_image_url !== undefined) updateData.hero_image_url = input.hero_image_url;
      if (input.short_blurb !== undefined) updateData.short_blurb = input.short_blurb;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.vibe_tags !== undefined) updateData.vibe_tags = input.vibe_tags;
      if (input.signature_items !== undefined) updateData.signature_items = input.signature_items;
      if (input.visitor_tips !== undefined) updateData.visitor_tips = input.visitor_tips;
      if (input.ai_locked_fields !== undefined) updateData.ai_locked_fields = input.ai_locked_fields;

      const { data, error } = await supabase
        .from('caerhold_locations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapLocation(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteCaerholdLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('caerhold_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
