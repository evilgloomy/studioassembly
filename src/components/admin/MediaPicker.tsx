import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Image as ImageIcon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaFile {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, any> | null;
}

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export function MediaPicker({ open, onOpenChange, onSelect }: MediaPickerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

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
    enabled: open,
  });

  const getPublicUrl = (fileName: string) => {
    const { data } = supabase.storage.from('media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(getPublicUrl(selectedFile));
      onOpenChange(false);
      setSelectedFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="tracking-widest uppercase">
            Media Library
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 p-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : files?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No media files</h3>
              <p className="text-sm text-muted-foreground">
                Upload images first using the Upload button above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 p-1">
              {files?.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setSelectedFile(file.name)}
                  className={cn(
                    "relative aspect-square overflow-hidden border-2 transition-all",
                    selectedFile === file.name
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-input hover:border-primary/50"
                  )}
                >
                  <img
                    src={getPublicUrl(file.name)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selectedFile === file.name && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="tracking-widest uppercase"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedFile}
            className="tracking-widest uppercase"
          >
            Select Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
