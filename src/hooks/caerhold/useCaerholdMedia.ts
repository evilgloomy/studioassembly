import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  CaerholdMedia, 
  CaerholdMediaWithTags,
  CaerholdTaggingResult,
  CaerholdToneProfile,
  CaerholdCanonRules,
  CaerholdLocationType,
} from '@/types/caerhold';

const QUERY_KEY = ['caerhold', 'media'];

// Helper to map database row to typed CaerholdMedia
function mapMedia(row: any): CaerholdMedia {
  return {
    ...row,
    type: row.type as 'image' | 'video',
  };
}

export function useCaerholdMedia() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<CaerholdMedia[]> => {
      const { data, error } = await supabase
        .from('caerhold_media')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapMedia);
    },
  });
}

export function useCaerholdMediaWithTags() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'with-tags'],
    queryFn: async (): Promise<CaerholdMediaWithTags[]> => {
      const { data, error } = await supabase
        .from('caerhold_media')
        .select(`
          *,
          caerhold_media_resident_tags (
            caerhold_residents (*)
          ),
          caerhold_media_location_tags (
            caerhold_locations (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        ...row,
        resident_tags: row.caerhold_media_resident_tags?.map((t: any) => ({
          ...t.caerhold_residents,
          tone_profile: (t.caerhold_residents?.tone_profile || {}) as CaerholdToneProfile,
          canon_rules: (t.caerhold_residents?.canon_rules || {}) as CaerholdCanonRules,
        })).filter(Boolean) || [],
        location_tags: row.caerhold_media_location_tags?.map((t: any) => ({
          ...t.caerhold_locations,
          type: t.caerhold_locations?.type as CaerholdLocationType,
          canon_rules: (t.caerhold_locations?.canon_rules || {}) as CaerholdCanonRules,
        })).filter(Boolean) || [],
      }));
    },
  });
}

export function useCaerholdMediaByBatch(batchId: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'batch', batchId],
    queryFn: async (): Promise<CaerholdMedia[]> => {
      const { data, error } = await supabase
        .from('caerhold_media')
        .select('*')
        .eq('upload_batch_id', batchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapMedia);
    },
    enabled: !!batchId,
  });
}

export function useUploadCaerholdMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      files, 
      batchId 
    }: { 
      files: File[]; 
      batchId: string;
    }): Promise<CaerholdMedia[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const uploadedMedia: CaerholdMedia[] = [];

      for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const fileType = isVideo ? 'video' : 'image';
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const storagePath = `caerhold/${batchId}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(storagePath);

        // Insert media record
        const { data: mediaData, error: insertError } = await supabase
          .from('caerhold_media')
          .insert({
            type: fileType,
            storage_path: storagePath,
            public_url: urlData.publicUrl,
            upload_batch_id: batchId,
            uploaded_by: user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        uploadedMedia.push(mapMedia(mediaData));
      }

      return uploadedMedia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useTagCaerholdMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      mediaId, 
      residentIds, 
      locationIds 
    }: { 
      mediaId: string; 
      residentIds?: string[]; 
      locationIds?: string[];
    }): Promise<CaerholdTaggingResult> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let draftsCreated = 0;
      let draftsUpdated = 0;

      // Tag locations first (affects draft generation for residents)
      if (locationIds && locationIds.length > 0) {
        for (const locationId of locationIds) {
          const { error } = await supabase
            .from('caerhold_media_location_tags')
            .insert({
              media_id: mediaId,
              location_id: locationId,
              tagged_by: user.id,
            })
            .select()
            .maybeSingle();

          // Ignore unique constraint violations (already tagged)
          if (error && !error.message.includes('duplicate key')) {
            throw error;
          }
        }
      }

      // Tag residents (this triggers draft creation)
      if (residentIds && residentIds.length > 0) {
        for (const residentId of residentIds) {
          // Check if tag already exists
          const { data: existingTag } = await supabase
            .from('caerhold_media_resident_tags')
            .select('id')
            .eq('media_id', mediaId)
            .eq('resident_id', residentId)
            .maybeSingle();

          if (existingTag) {
            draftsUpdated++;
            continue;
          }

          // Insert new tag (triggers draft creation via database trigger)
          const { error } = await supabase
            .from('caerhold_media_resident_tags')
            .insert({
              media_id: mediaId,
              resident_id: residentId,
              tagged_by: user.id,
            });

          if (error) throw error;
          draftsCreated++;
        }
      }

      return {
        drafts_created: draftsCreated,
        drafts_updated: draftsUpdated,
        success: true,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['caerhold', 'posts'] });
    },
  });
}

export function useDeleteCaerholdMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Get storage path first
      const { data: media, error: fetchError } = await supabase
        .from('caerhold_media')
        .select('storage_path')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([media.storage_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error } = await supabase
        .from('caerhold_media')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
