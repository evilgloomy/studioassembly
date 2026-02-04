import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  CaerholdPost, 
  CaerholdPostWithRelations, 
  CaerholdPostUpdate, 
  CaerholdPostStatus,
  CaerholdAuthorType,
  CaerholdToneProfile,
  CaerholdCanonRules,
  CaerholdLocationType,
} from '@/types/caerhold';

const QUERY_KEY = ['caerhold', 'posts'];

// Helper to map database row to typed post
function mapPost(row: any): CaerholdPost {
  return {
    ...row,
    author_type: row.author_type as CaerholdAuthorType,
    status: row.status as CaerholdPostStatus,
  };
}

// Helper to map post with relations
function mapPostWithRelations(row: any): CaerholdPostWithRelations {
  const post = mapPost(row);
  return {
    ...post,
    resident: row.caerhold_residents ? {
      ...row.caerhold_residents,
      tone_profile: (row.caerhold_residents.tone_profile || {}) as CaerholdToneProfile,
      canon_rules: (row.caerhold_residents.canon_rules || {}) as CaerholdCanonRules,
    } : null,
    location: row.caerhold_locations ? {
      ...row.caerhold_locations,
      type: row.caerhold_locations.type as CaerholdLocationType,
      canon_rules: (row.caerhold_locations.canon_rules || {}) as CaerholdCanonRules,
    } : null,
    media: row.caerhold_post_media?.map((pm: any) => pm.caerhold_media).filter(Boolean) || [],
  };
}

export function useCaerholdFeed(limit = 20) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'feed', limit],
    queryFn: async (): Promise<CaerholdPostWithRelations[]> => {
      const { data, error } = await supabase
        .from('caerhold_posts')
        .select(`
          *,
          caerhold_residents (*),
          caerhold_locations (*),
          caerhold_post_media (
            caerhold_media (*)
          )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map(mapPostWithRelations);
    },
  });
}

export function useCaerholdDrafts() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'drafts'],
    queryFn: async (): Promise<CaerholdPostWithRelations[]> => {
      const { data, error } = await supabase
        .from('caerhold_posts')
        .select(`
          *,
          caerhold_residents (*),
          caerhold_locations (*),
          caerhold_post_media (
            caerhold_media (*)
          )
        `)
        .in('status', ['draft', 'approved', 'scheduled'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapPostWithRelations);
    },
  });
}

export function useCaerholdPost(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: async (): Promise<CaerholdPostWithRelations | null> => {
      const { data, error } = await supabase
        .from('caerhold_posts')
        .select(`
          *,
          caerhold_residents (*),
          caerhold_locations (*),
          caerhold_post_media (
            caerhold_media (*)
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data ? mapPostWithRelations(data) : null;
    },
    enabled: !!id,
  });
}

export function useCaerholdResidentPosts(residentId: string, publishedOnly = true) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'resident', residentId, publishedOnly],
    queryFn: async (): Promise<CaerholdPostWithRelations[]> => {
      let query = supabase
        .from('caerhold_posts')
        .select(`
          *,
          caerhold_residents (*),
          caerhold_locations (*),
          caerhold_post_media (
            caerhold_media (*)
          )
        `)
        .eq('resident_id', residentId)
        .order('published_at', { ascending: false, nullsFirst: false });

      if (publishedOnly) {
        query = query.eq('status', 'published');
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapPostWithRelations);
    },
    enabled: !!residentId,
  });
}

export function useCaerholdLocationPosts(locationId: string, publishedOnly = true) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'location', locationId, publishedOnly],
    queryFn: async (): Promise<CaerholdPostWithRelations[]> => {
      let query = supabase
        .from('caerhold_posts')
        .select(`
          *,
          caerhold_residents (*),
          caerhold_locations (*),
          caerhold_post_media (
            caerhold_media (*)
          )
        `)
        .eq('location_id', locationId)
        .order('published_at', { ascending: false, nullsFirst: false });

      if (publishedOnly) {
        query = query.eq('status', 'published');
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapPostWithRelations);
    },
    enabled: !!locationId,
  });
}

export function useUpdateCaerholdPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, update }: { id: string; update: CaerholdPostUpdate }): Promise<CaerholdPost> => {
      const { data, error } = await supabase
        .from('caerhold_posts')
        .update({
          ...(update.caption !== undefined && { caption: update.caption }),
          ...(update.admin_notes !== undefined && { admin_notes: update.admin_notes }),
          ...(update.status !== undefined && { status: update.status }),
          ...(update.scheduled_at !== undefined && { scheduled_at: update.scheduled_at }),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapPost(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function usePublishCaerholdPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<CaerholdPost> => {
      // First check if post has media
      const { data: mediaData, error: mediaError } = await supabase
        .from('caerhold_post_media')
        .select('media_id')
        .eq('post_id', id);

      if (mediaError) throw mediaError;
      if (!mediaData || mediaData.length === 0) {
        throw new Error('Cannot publish post without media');
      }

      // Check rate limiting - max 1 post per resident per 24h
      const { data: post, error: postError } = await supabase
        .from('caerhold_posts')
        .select('resident_id')
        .eq('id', id)
        .single();

      if (postError) throw postError;

      if (post.resident_id) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data: recentPosts, error: recentError } = await supabase
          .from('caerhold_posts')
          .select('id')
          .eq('resident_id', post.resident_id)
          .eq('status', 'published')
          .gte('published_at', twentyFourHoursAgo)
          .neq('id', id);

        if (recentError) throw recentError;
        if (recentPosts && recentPosts.length > 0) {
          throw new Error('Rate limit: This resident already has a published post in the last 24 hours');
        }
      }

      // Publish the post
      const { data, error } = await supabase
        .from('caerhold_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapPost(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteCaerholdPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('caerhold_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
