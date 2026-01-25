import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PageSection {
  id: string;
  page_slug: string;
  section_key: string;
  section_type: string;
  title: string | null;
  content: Record<string, any>;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export function usePageSections(pageSlug: string) {
  return useQuery({
    queryKey: ['page-sections', pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_slug', pageSlug)
        .order('sort_order');

      if (error) throw error;
      return data as PageSection[];
    },
  });
}

export function useUpdatePageSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content, title, is_visible }: { 
      id: string; 
      content?: Record<string, any>; 
      title?: string;
      is_visible?: boolean;
    }) => {
      const updates: Record<string, any> = {};
      if (content !== undefined) updates.content = content;
      if (title !== undefined) updates.title = title;
      if (is_visible !== undefined) updates.is_visible = is_visible;

      const { error } = await supabase
        .from('page_sections')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-sections'] });
    },
  });
}

export function useReorderPageSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sections: { id: string; sort_order: number }[]) => {
      for (const section of sections) {
        const { error } = await supabase
          .from('page_sections')
          .update({ sort_order: section.sort_order })
          .eq('id', section.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-sections'] });
    },
  });
}

export function useCreatePageSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (section: {
      page_slug: string;
      section_key: string;
      section_type: string;
      title: string;
      content: Record<string, any>;
      sort_order: number;
    }) => {
      const { data, error } = await supabase
        .from('page_sections')
        .insert(section)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-sections'] });
    },
  });
}

export function useDeletePageSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('page_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-sections'] });
    },
  });
}
