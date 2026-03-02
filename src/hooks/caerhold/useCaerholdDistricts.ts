import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CaerholdDistrict, CaerholdDistrictInput } from '@/types/caerhold';

const QUERY_KEY = ['caerhold', 'districts'];

function mapDistrict(row: any): CaerholdDistrict {
  return {
    ...row,
    map_hotspot: row.map_hotspot || null,
  };
}

export function useCaerholdDistricts(publishedOnly = true) {
  return useQuery({
    queryKey: [...QUERY_KEY, publishedOnly],
    queryFn: async (): Promise<CaerholdDistrict[]> => {
      let query = (supabase as any)
        .from('caerhold_districts')
        .select('*')
        .order('sort_order');

      if (publishedOnly) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapDistrict);
    },
  });
}

export function useCaerholdDistrict(slug: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, slug],
    queryFn: async (): Promise<CaerholdDistrict | null> => {
      const { data, error } = await (supabase as any)
        .from('caerhold_districts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data ? mapDistrict(data) : null;
    },
    enabled: !!slug,
  });
}

export function useCreateCaerholdDistrict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CaerholdDistrictInput): Promise<CaerholdDistrict> => {
      const { data, error } = await (supabase as any)
        .from('caerhold_districts')
        .insert({
          slug: input.slug,
          name: input.name,
          tagline: input.tagline || null,
          description: input.description || null,
          hero_image_url: input.hero_image_url || null,
          sort_order: input.sort_order ?? 0,
          is_published: input.is_published ?? true,
          map_hotspot: input.map_hotspot || null,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDistrict(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateCaerholdDistrict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CaerholdDistrictInput> }): Promise<CaerholdDistrict> => {
      const updateData: Record<string, any> = {};
      if (input.slug !== undefined) updateData.slug = input.slug;
      if (input.name !== undefined) updateData.name = input.name;
      if (input.tagline !== undefined) updateData.tagline = input.tagline;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.hero_image_url !== undefined) updateData.hero_image_url = input.hero_image_url;
      if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;
      if (input.is_published !== undefined) updateData.is_published = input.is_published;
      if (input.map_hotspot !== undefined) updateData.map_hotspot = input.map_hotspot;

      const { data, error } = await (supabase as any)
        .from('caerhold_districts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDistrict(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteCaerholdDistrict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await (supabase as any)
        .from('caerhold_districts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
