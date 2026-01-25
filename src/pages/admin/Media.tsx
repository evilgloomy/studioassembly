import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Copy, Check, Image as ImageIcon, Tag, Plus, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaFile {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, any> | null;
}

interface MediaTag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface MediaFileRecord {
  id: string;
  storage_path: string;
  filename: string;
  original_filename: string | null;
  alt_text: string | null;
  tags?: MediaTag[];
}

export default function AdminMedia() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [deleteFile, setDeleteFile] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [editFileOpen, setEditFileOpen] = useState<string | null>(null);
  const [editAltText, setEditAltText] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, isAdmin, isEditor } = useAuthContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch storage files
  const { data: files, isLoading } = useQuery({
    queryKey: ['media-files'],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('media')
        .list('', {
          limit: 200,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;
      return data as MediaFile[];
    },
  });

  // Fetch tags
  const { data: tags } = useQuery({
    queryKey: ['media-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as MediaTag[];
    },
  });

  // Fetch media file records with tags
  const { data: fileRecords } = useQuery({
    queryKey: ['media-file-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_files')
        .select(`
          *,
          media_file_tags(
            tag_id,
            media_tags(id, name, slug, color)
          )
        `);

      if (error) throw error;
      
      return data?.map(record => ({
        ...record,
        tags: record.media_file_tags?.map((t: any) => t.media_tags).filter(Boolean) || []
      })) as MediaFileRecord[];
    },
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (name: string) => {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { error } = await supabase
        .from('media_tags')
        .insert({ name, slug });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-tags'] });
      setNewTagName('');
      toast({ title: 'Tag created' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('media_tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-tags'] });
      toast({ title: 'Tag deleted' });
    },
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileName: string) => {
      // Delete from storage
      const { error } = await supabase.storage.from('media').remove([fileName]);
      if (error) throw error;
      
      // Delete record from database
      await supabase.from('media_files').delete().eq('storage_path', fileName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      queryClient.invalidateQueries({ queryKey: ['media-file-records'] });
      toast({ title: 'File deleted' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  // Update file record mutation
  const updateFileMutation = useMutation({
    mutationFn: async ({ storagePath, altText, tagIds }: { storagePath: string; altText: string; tagIds: string[] }) => {
      // Get or create file record
      let record = fileRecords?.find(r => r.storage_path === storagePath);
      
      if (!record) {
        const { data, error } = await supabase
          .from('media_files')
          .insert({
            storage_path: storagePath,
            filename: storagePath,
            uploaded_by: user?.id,
          })
          .select()
          .single();
        if (error) throw error;
        record = data;
      }

      // Update alt text
      await supabase
        .from('media_files')
        .update({ alt_text: altText })
        .eq('storage_path', storagePath);

      // Update tags - delete existing and add new
      await supabase.from('media_file_tags').delete().eq('media_file_id', record.id);
      
      if (tagIds.length > 0) {
        await supabase.from('media_file_tags').insert(
          tagIds.map(tagId => ({ media_file_id: record!.id, tag_id: tagId }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-file-records'] });
      setEditFileOpen(null);
      toast({ title: 'File updated' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const handleMultiUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0 || !user) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const validFiles: File[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!allowedTypes.includes(file.type)) {
        toast({ variant: 'destructive', title: 'Invalid file type', description: `${file.name} is not a supported image format.` });
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'File too large', description: `${file.name} exceeds 5MB limit.` });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress([]);

    try {
      for (const file of validFiles) {
        setUploadProgress(prev => [...prev, `Uploading ${file.name}...`]);
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error } = await supabase.storage.from('media').upload(fileName, file);
        if (error) throw error;

        // Create database record
        await supabase.from('media_files').insert({
          storage_path: fileName,
          filename: fileName,
          original_filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          uploaded_by: user.id,
        });

        setUploadProgress(prev => prev.map(p => p === `Uploading ${file.name}...` ? `✓ ${file.name}` : p));
      }

      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      queryClient.invalidateQueries({ queryKey: ['media-file-records'] });
      toast({ title: 'Upload complete', description: `${validFiles.length} file(s) uploaded.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress([]), 3000);
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
    toast({ title: 'URL copied' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openEditDialog = (fileName: string) => {
    const record = fileRecords?.find(r => r.storage_path === fileName);
    setEditAltText(record?.alt_text || '');
    setEditTags(record?.tags?.map(t => t.id) || []);
    setEditFileOpen(fileName);
  };

  const getFileTags = (fileName: string) => {
    const record = fileRecords?.find(r => r.storage_path === fileName);
    return record?.tags || [];
  };

  // Filter files by selected tag
  const filteredFiles = selectedTag
    ? files?.filter(file => {
        const record = fileRecords?.find(r => r.storage_path === file.name);
        return record?.tags?.some(t => t.id === selectedTag);
      })
    : files;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Media Library</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTagDialogOpen(true)} className="tracking-widest uppercase">
            <Tag className="h-4 w-4 mr-2" />
            Manage Tags
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleMultiUpload}
            disabled={uploading}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="tracking-widest uppercase">
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Images'}
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="border border-input p-4 space-y-1">
          {uploadProgress.map((msg, i) => (
            <p key={i} className="text-sm text-muted-foreground">{msg}</p>
          ))}
        </div>
      )}

      {/* Tag Filter */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedTag === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedTag(null)}
          >
            All
          </Badge>
          {tags.map(tag => (
            <Badge
              key={tag.id}
              variant={selectedTag === tag.id ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedTag(tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Media Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading media files...</div>
      ) : filteredFiles?.length === 0 ? (
        <div className="border border-input border-dashed p-12 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No media files</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload images to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFiles?.map((file) => (
            <div key={file.id} className="group relative border border-input overflow-hidden">
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
                <Button size="icon" variant="secondary" onClick={() => copyUrl(file.name)}>
                  {copiedUrl === file.name ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="secondary" onClick={() => openEditDialog(file.name)}>
                  <Tag className="h-4 w-4" />
                </Button>
                {(isAdmin || isEditor) && (
                  <Button size="icon" variant="destructive" onClick={() => setDeleteFile(file.name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Tags */}
              {getFileTags(file.name).length > 0 && (
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {getFileTags(file.name).slice(0, 2).map(tag => (
                    <Badge key={tag.id} variant="secondary" className="text-[10px] px-1 py-0">
                      {tag.name}
                    </Badge>
                  ))}
                  {getFileTags(file.name).length > 2 && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      +{getFileTags(file.name).length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Info */}
              <div className="p-2 bg-background">
                <p className="text-xs truncate" title={file.name}>{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize((file.metadata as any)?.size || 0)}</p>
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
            <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteFile) { deleteMutation.mutate(deleteFile); setDeleteFile(null); } }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit File Dialog */}
      <Dialog open={!!editFileOpen} onOpenChange={() => setEditFileOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="tracking-widest uppercase">Edit Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Alt Text</Label>
              <Input
                value={editAltText}
                onChange={(e) => setEditAltText(e.target.value)}
                placeholder="Describe this image for accessibility..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags?.map(tag => (
                  <Badge
                    key={tag.id}
                    variant={editTags.includes(tag.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setEditTags(prev =>
                      prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                    )}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFileOpen(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (editFileOpen) {
                  updateFileMutation.mutate({ storagePath: editFileOpen, altText: editAltText, tagIds: editTags });
                }
              }}
              disabled={updateFileMutation.isPending}
            >
              {updateFileMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Tags Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="tracking-widest uppercase">Manage Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag name..."
                onKeyDown={(e) => { if (e.key === 'Enter' && newTagName.trim()) createTagMutation.mutate(newTagName.trim()); }}
              />
              <Button
                onClick={() => newTagName.trim() && createTagMutation.mutate(newTagName.trim())}
                disabled={!newTagName.trim() || createTagMutation.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tags?.map(tag => (
                <div key={tag.id} className="flex items-center justify-between p-2 border border-input">
                  <span className="text-sm">{tag.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteTagMutation.mutate(tag.id)}
                    className="h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {(!tags || tags.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No tags yet</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
