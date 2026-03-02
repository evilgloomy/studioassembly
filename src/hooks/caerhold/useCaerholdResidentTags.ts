import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TagDefinition {
  id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
}

export interface TagAssignment {
  id: string;
  resident_id: string;
  tag_definition_id: string;
  tag?: TagDefinition;
}

const TAG_DEFS_KEY = ['caerhold', 'tag-definitions'];
const TAG_ASSIGNMENTS_KEY = ['caerhold', 'tag-assignments'];

export function useCaerholdTagDefinitions() {
  return useQuery({
    queryKey: TAG_DEFS_KEY,
    queryFn: async (): Promise<TagDefinition[]> => {
      const { data, error } = await (supabase as any)
        .from('caerhold_resident_tag_definitions')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCaerholdAllTagAssignments() {
  return useQuery({
    queryKey: TAG_ASSIGNMENTS_KEY,
    queryFn: async (): Promise<TagAssignment[]> => {
      const { data, error } = await (supabase as any)
        .from('caerhold_resident_tag_assignments')
        .select('*, tag:caerhold_resident_tag_definitions(*)');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCaerholdResidentTagAssignments(residentId: string) {
  return useQuery({
    queryKey: [...TAG_ASSIGNMENTS_KEY, residentId],
    queryFn: async (): Promise<TagAssignment[]> => {
      const { data, error } = await (supabase as any)
        .from('caerhold_resident_tag_assignments')
        .select('*, tag:caerhold_resident_tag_definitions(*)')
        .eq('resident_id', residentId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!residentId,
  });
}

export function useCreateTagDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; slug: string; color?: string }) => {
      const { data, error } = await (supabase as any)
        .from('caerhold_resident_tag_definitions')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as TagDefinition;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TAG_DEFS_KEY });
    },
  });
}

export function useDeleteTagDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('caerhold_resident_tag_definitions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TAG_DEFS_KEY });
      qc.invalidateQueries({ queryKey: TAG_ASSIGNMENTS_KEY });
    },
  });
}

export function useAssignTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { resident_id: string; tag_definition_id: string }) => {
      const { data, error } = await (supabase as any)
        .from('caerhold_resident_tag_assignments')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TAG_ASSIGNMENTS_KEY });
    },
  });
}

export function useUnassignTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('caerhold_resident_tag_assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TAG_ASSIGNMENTS_KEY });
    },
  });
}
