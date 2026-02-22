import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const JOBS_KEY = ['caerhold', 'profile-jobs'];
const RESIDENTS_KEY = ['caerhold', 'residents'];

export function useCaerholdProfileJobs() {
  return useQuery({
    queryKey: JOBS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caerhold_resident_profile_jobs')
        .select('*, caerhold_media(*), caerhold_residents(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useImportResidents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ files, batchId }: { files: File[]; batchId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const results: Array<{ mediaId: string; jobId: string }> = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const storagePath = `caerhold/${batchId}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(storagePath, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(storagePath);

        // Create media record
        const { data: media, error: mediaError } = await supabase
          .from('caerhold_media')
          .insert({
            type: 'image',
            storage_path: storagePath,
            public_url: urlData.publicUrl,
            upload_batch_id: batchId,
            uploaded_by: user.id,
          })
          .select('id')
          .single();
        if (mediaError) throw mediaError;

        // Create job with hash
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(media.id));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const jobHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Upsert job (idempotent)
        const { data: existingJob } = await supabase
          .from('caerhold_resident_profile_jobs')
          .select('id')
          .eq('job_hash', jobHash)
          .maybeSingle();

        let jobId: string;

        if (existingJob) {
          await supabase
            .from('caerhold_resident_profile_jobs')
            .update({ status: 'queued', upload_batch_id: batchId })
            .eq('id', existingJob.id);
          jobId = existingJob.id;
        } else {
          const { data: job, error: jobError } = await supabase
            .from('caerhold_resident_profile_jobs')
            .insert({
              job_hash: jobHash,
              upload_batch_id: batchId,
              media_id: media.id,
              status: 'queued',
              created_by: user.id,
            })
            .select('id')
            .single();
          if (jobError) throw jobError;
          jobId = job.id;
        }

        results.push({ mediaId: media.id, jobId });
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY });
      queryClient.invalidateQueries({ queryKey: ['caerhold', 'media'] });
    },
  });
}

export function useGenerateResidentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-resident-profile', {
        body: { job_id: jobId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY });
      queryClient.invalidateQueries({ queryKey: RESIDENTS_KEY });
    },
  });
}

export function usePublishResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (residentId: string) => {
      const { error } = await supabase
        .from('caerhold_residents')
        .update({ profile_status: 'published', posting_enabled: true } as any)
        .eq('id', residentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESIDENTS_KEY });
    },
  });
}

export function useUnpublishResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (residentId: string) => {
      const { error } = await supabase
        .from('caerhold_residents')
        .update({ profile_status: 'draft', posting_enabled: false } as any)
        .eq('id', residentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESIDENTS_KEY });
    },
  });
}
