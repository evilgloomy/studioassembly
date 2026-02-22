import { Link } from 'react-router-dom';
import { useCaerholdResidents } from '@/hooks/caerhold/useCaerholdResidents';
import { usePublishResident, useGenerateResidentProfile } from '@/hooks/caerhold/useCaerholdResidentImport';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, RefreshCw, Send, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ResidentDrafts() {
  const { data: allResidents, isLoading } = useCaerholdResidents();
  const publishMutation = usePublishResident();
  const { toast } = useToast();

  // Filter drafts only
  const drafts = allResidents?.filter((r: any) => r.profile_status === 'draft') || [];

  const handlePublish = async (id: string, name: string) => {
    try {
      await publishMutation.mutateAsync(id);
      toast({ title: 'Resident published', description: `${name} is now visible publicly.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Draft Residents</h1>
        <Button asChild variant="outline">
          <Link to="/admin/caerhold/residents/import">
            <Upload className="mr-2 h-4 w-4" /> Import More
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Loading drafts...</div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No draft residents.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/admin/caerhold/residents/import">Import from Photos</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drafts.map((resident: any) => (
            <div key={resident.id} className="border border-border bg-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                {resident.avatar_media_id ? (
                  <div className="h-16 w-16 bg-secondary flex-shrink-0 overflow-hidden">
                    {/* We'll show the avatar if we can get the URL */}
                    <div className="h-full w-full bg-secondary flex items-center justify-center text-2xl font-medium">
                      {resident.display_name?.[0] || '?'}
                    </div>
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-secondary flex-shrink-0 flex items-center justify-center text-2xl font-medium">
                    {resident.display_name?.[0] || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{resident.display_name}</h3>
                  <p className="text-sm text-muted-foreground">{resident.handle}</p>
                  {resident.role_title && (
                    <p className="text-xs text-muted-foreground mt-1">{resident.role_title}</p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">Draft</Badge>
              </div>

              {resident.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">{resident.bio}</p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link to={`/admin/caerhold/residents/${resident.id}`}>
                    <Pencil className="mr-1 h-3 w-3" /> Edit
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePublish(resident.id, resident.display_name)}
                  disabled={publishMutation.isPending}
                >
                  <Send className="mr-1 h-3 w-3" /> Publish
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
