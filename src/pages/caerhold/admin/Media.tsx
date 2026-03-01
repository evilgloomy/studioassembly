import { useState, useRef } from 'react';
import { useCaerholdMedia, useUploadCaerholdMedia, useTagCaerholdMedia, useDeleteCaerholdMedia } from '@/hooks/caerhold/useCaerholdMedia';
import { useCaerholdResidents } from '@/hooks/caerhold/useCaerholdResidents';
import { useCaerholdLocations } from '@/hooks/caerhold/useCaerholdLocations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Tag, Image, Check, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CaerholdAdminMedia() {
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [deleteMediaId, setDeleteMediaId] = useState<string | null>(null);
  const [selectedResidents, setSelectedResidents] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: media, isLoading: mediaLoading } = useCaerholdMedia();
  const { data: residents } = useCaerholdResidents();
  const { data: locations } = useCaerholdLocations();
  const uploadMutation = useUploadCaerholdMedia();
  const tagMutation = useTagCaerholdMedia();
  const deleteMutation = useDeleteCaerholdMedia();
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const batchId = crypto.randomUUID();

    try {
      await uploadMutation.mutateAsync({
        files: Array.from(files),
        batchId,
      });
      toast({
        title: 'Upload complete',
        description: `${files.length} file(s) uploaded successfully.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload files.',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTag = async () => {
    if (!selectedMediaId) return;

    try {
      const result = await tagMutation.mutateAsync({
        mediaId: selectedMediaId,
        residentIds: selectedResidents,
        locationIds: selectedLocation ? [selectedLocation] : [],
      });

      toast({
        title: 'Tagging complete',
        description: `${result.drafts_created} draft(s) created, ${result.drafts_updated} updated.`,
      });

      setSelectedMediaId(null);
      setSelectedResidents([]);
      setSelectedLocation('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Tagging failed',
        description: error.message || 'Failed to tag media.',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteMediaId) return;

    try {
      await deleteMutation.mutateAsync(deleteMediaId);
      toast({
        title: 'Media deleted',
        description: 'The media file has been permanently removed.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: error.message || 'Failed to delete media. It may be in use by posts or residents.',
      });
    } finally {
      setDeleteMediaId(null);
    }
  };

  const toggleResident = (residentId: string) => {
    setSelectedResidents(prev =>
      prev.includes(residentId)
        ? prev.filter(id => id !== residentId)
        : [...prev, residentId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Media Library</h1>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="media-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="tracking-widest uppercase"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload Media'}
          </Button>
        </div>
      </div>

      {/* Media Grid */}
      {mediaLoading ? (
        <div className="text-center py-16 text-muted-foreground">
          Loading media...
        </div>
      ) : media && media.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square bg-secondary overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer group"
              onClick={() => setSelectedMediaId(item.id)}
            >
              {item.type === 'image' ? (
                <img
                  src={item.public_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={item.public_url}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
                <Tag className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-destructive/80 hover:bg-destructive text-destructive-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteMediaId(item.id);
                  }}
                  title="Delete media"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border">
          <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No media yet. Upload some files to get started.</p>
          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload Media
          </Button>
        </div>
      )}

      {/* Tagging Dialog */}
      <Dialog open={!!selectedMediaId} onOpenChange={() => setSelectedMediaId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="tracking-widest uppercase">Tag Media</DialogTitle>
            <DialogDescription>
              Select residents and a location to tag in this media. Tagging a resident will create or update a draft post.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">
                Tag Residents
              </Label>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-border p-2">
                {residents?.map((resident) => (
                  <div key={resident.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`resident-${resident.id}`}
                      checked={selectedResidents.includes(resident.id)}
                      onCheckedChange={() => toggleResident(resident.id)}
                    />
                    <label
                      htmlFor={`resident-${resident.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {resident.display_name}
                      <span className="text-muted-foreground ml-2">{resident.handle}</span>
                    </label>
                  </div>
                ))}
                {!residents?.length && (
                  <p className="text-sm text-muted-foreground">No residents yet. Create some first.</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">
                Tag Location (Optional)
              </Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMediaId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleTag}
              disabled={selectedResidents.length === 0 || tagMutation.isPending}
            >
              {tagMutation.isPending ? 'Tagging...' : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Tag Media
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteMediaId} onOpenChange={() => setDeleteMediaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the media file and remove it from storage. If this media is used as a resident avatar or in posts, those references will be broken.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
