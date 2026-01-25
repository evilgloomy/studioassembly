import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type JournalPost = Database['public']['Tables']['journal_posts']['Row'];
type JournalPostInsert = Database['public']['Tables']['journal_posts']['Insert'];
type JournalPostUpdate = Database['public']['Tables']['journal_posts']['Update'];
type PostStatus = Database['public']['Enums']['post_status'];

interface AuthorProfile {
  display_name: string | null;
  avatar_url: string | null;
}

interface PostWithAuthor extends JournalPost {
  author_profile?: AuthorProfile | null;
}

interface PostFilters {
  status?: PostStatus | 'all';
  authorId?: string;
  search?: string;
}

async function fetchAuthorProfile(authorId: string | null): Promise<AuthorProfile | null> {
  if (!authorId) return null;
  
  const { data } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('user_id', authorId)
    .maybeSingle();
  
  return data;
}

export function usePosts(filters?: PostFilters) {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: async () => {
      let query = supabase
        .from('journal_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.authorId) {
        query = query.eq('author_id', filters.authorId);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch author profiles for all posts
      const postsWithAuthors: PostWithAuthor[] = await Promise.all(
        (data || []).map(async (post) => ({
          ...post,
          author_profile: await fetchAuthorProfile(post.author_id),
        }))
      );

      return postsWithAuthors;
    },
  });
}

export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('journal_posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const author_profile = await fetchAuthorProfile(data.author_id);
      
      return { ...data, author_profile } as PostWithAuthor;
    },
    enabled: !!id,
  });
}

export function usePostBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['post', 'slug', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('journal_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const author_profile = await fetchAuthorProfile(data.author_id);
      
      return { ...data, author_profile } as PostWithAuthor;
    },
    enabled: !!slug,
  });
}

export function usePublishedPosts(limit?: number) {
  return useQuery({
    queryKey: ['posts', 'published', limit],
    queryFn: async () => {
      let query = supabase
        .from('journal_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      const postsWithAuthors: PostWithAuthor[] = await Promise.all(
        (data || []).map(async (post) => ({
          ...post,
          author_profile: await fetchAuthorProfile(post.author_id),
        }))
      );

      return postsWithAuthors;
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: JournalPostInsert) => {
      const { data, error } = await supabase
        .from('journal_posts')
        .insert(post)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: JournalPostUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('journal_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', data.id] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('journal_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// Helper function to generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
