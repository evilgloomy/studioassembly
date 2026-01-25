import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Upload, Trash2, Copy, Check, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaFile {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, any> | null;
}

export default function AdminMedia() {
  const [uploading, setUploading] = useState(false);
  const [deleteFile, setDeleteFile] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const { user, isAdmin, isEditor } = useAuthContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: files, isLoading } = useQuery({
    queryKey: ['media-files'],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('media')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;
      return data as MediaFile[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileName: string) => {
      const { error } = await supabase.storage
        .from('media')
        .remove([fileName]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      toast({
        title: 'File deleted',
        description: 'The file has been removed from the media library.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete the file.',
      });
    },
  });

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an image file (JPEG, PNG, GIF, WebP, or SVG).',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload a file smaller than 5MB.',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      toast({
        title: 'File uploaded',
        description: 'Your file has been added to the media library.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload the file.',
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  }, [user, queryClient, toast]);

  const getPublicUrl = (fileName: string) => {
    const { data } = supabase.storage.from('media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const copyUrl = async (fileName: string) => {
    const url = getPublicUrl(fileName);
    await navigator.clipboard.writeText(url);
    setCopiedUrl(fileName);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast({
      title: 'URL copied',
      description: 'The image URL has been copied to your clipboard.',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Media Library</h1>
        <div>
          <Input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="file-upload" className="cursor-pointer tracking-widest uppercase">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </label>
          </Button>
        </div>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading media files...
        </div>
      ) : files?.length === 0 ? (
        <div className="border border-input border-dashed p-12 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No media files yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload your first image to get started.
          </p>
          <Button asChild variant="outline">
            <label htmlFor="file-upload" className="cursor-pointer tracking-widest uppercase">
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </label>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files?.map((file) => (
            <div
              key={file.id}
              className="group relative border border-input overflow-hidden"
            >
              <div className="aspect-square bg-secondary">
                <img
                  src={getPublicUrl(file.name)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => copyUrl(file.name)}
                >
                  {copiedUrl === file.name ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                {(isAdmin || isEditor) && (
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => setDeleteFile(file.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Info */}
              <div className="p-2 bg-background">
                <p className="text-xs truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize((file.metadata as any)?.size || 0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteFile) {
                  deleteMutation.mutate(deleteFile);
                  setDeleteFile(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
