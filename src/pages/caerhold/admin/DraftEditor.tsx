import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCaerholdPost, useUpdateCaerholdPost, usePublishCaerholdPost, useDeleteCaerholdPost } from '@/hooks/caerhold/useCaerholdPosts';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Save, Send, Trash2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CaerholdPostStatus } from '@/types/caerhold';

const statusColors: Record<CaerholdPostStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  scheduled: 'bg-purple-100 text-purple-800',
  published: 'bg-green-100 text-green-800',
};

export default function CaerholdDraftEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: post, isLoading } = useCaerholdPost(id || '');
  const updateMutation = useUpdateCaerholdPost();
  const publishMutation = usePublishCaerholdPost();
  const deleteMutation = useDeleteCaerholdPost();

  const [caption, setCaption] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form values when post loads
  if (post && !initialized) {
    setCaption(post.caption || '');
    setAdminNotes(post.admin_notes || '');
    setInitialized(true);
  }

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({
        id,
        update: { caption, admin_notes: adminNotes },
      });
      toast({ title: 'Saved', description: 'Draft updated successfully.' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save draft.',
      });
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({
        id,
        update: { caption, admin_notes: adminNotes, status: 'approved' },
      });
      toast({ title: 'Approved', description: 'Post has been approved and is ready to publish.' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to approve post.',
      });
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    try {
      // Save first
      await updateMutation.mutateAsync({
        id,
        update: { caption, admin_notes: adminNotes },
      });
      // Then publish
      await publishMutation.mutateAsync(id);
      toast({ title: 'Published!', description: 'Post is now live.' });
      navigate('/admin/caerhold/drafts');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to publish post.',
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: 'Deleted', description: 'Post has been deleted.' });
      navigate('/admin/caerhold/drafts');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete post.',
      });
    }
  };

  const handleGenerateCaption = async () => {
    toast({
      title: 'Coming Soon',
      description: 'AI caption generation will be available soon.',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-muted-foreground">Loading draft...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Draft Not Found</h1>
        <Link to="/admin/caerhold/drafts" className="text-primary hover:underline">
          Back to Drafts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/caerhold/drafts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-widest uppercase">Edit Draft</h1>
          <Badge className={`${statusColors[post.status]} tracking-widest uppercase`}>
            {post.status}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Media & Info */}
        <div className="space-y-6">
          {/* Resident Info */}
          <div className="border border-border p-4">
            <Label className="text-xs tracking-widest uppercase text-muted-foreground">
              Resident
            </Label>
            <div className="flex items-center gap-3 mt-2">
              <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center font-medium">
                {post.resident?.display_name?.[0] || '?'}
              </div>
              <div>
                <div className="font-medium">{post.resident?.display_name || 'Unknown'}</div>
                <div className="text-xs text-muted-foreground">{post.resident?.handle}</div>
              </div>
            </div>
          </div>

          {/* Location */}
          {post.location && (
            <div className="border border-border p-4">
              <Label className="text-xs tracking-widest uppercase text-muted-foreground">
                Location
              </Label>
              <div className="mt-2 font-medium">{post.location.name}</div>
            </div>
          )}

          {/* Media Preview */}
          <div className="border border-border p-4">
            <Label className="text-xs tracking-widest uppercase text-muted-foreground mb-4 block">
              Attached Media ({post.media?.length || 0})
            </Label>
            {post.media && post.media.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {post.media.map((media) => (
                  <div key={media.id} className="aspect-square bg-secondary overflow-hidden">
                    {media.type === 'image' ? (
                      <img src={media.public_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <video src={media.public_url} className="w-full h-full object-cover" controls />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No media attached</p>
            )}
          </div>
        </div>

        {/* Right Column - Caption Editor */}
        <div className="space-y-6">
          {/* Caption */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="caption" className="text-xs tracking-widest uppercase">
                Caption
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateCaption}
                className="tracking-widest uppercase"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </div>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption for this post..."
              rows={8}
            />
          </div>

          {/* AI Caption (if exists) */}
          {post.ai_caption && (
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-muted-foreground">
                Last AI-Generated Caption
              </Label>
              <div className="p-3 bg-secondary/50 text-sm text-muted-foreground whitespace-pre-wrap">
                {post.ai_caption}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="admin_notes" className="text-xs tracking-widest uppercase">
              Admin Notes (for AI context)
            </Label>
            <Textarea
              id="admin_notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add context for AI caption generation..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="tracking-widest uppercase"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            {post.status === 'draft' && (
              <Button
                variant="outline"
                onClick={handleApprove}
                disabled={updateMutation.isPending}
                className="tracking-widest uppercase"
              >
                Approve
              </Button>
            )}
            <Button
              onClick={handlePublish}
              disabled={publishMutation.isPending || !post.media?.length}
              className="tracking-widest uppercase"
            >
              <Send className="mr-2 h-4 w-4" />
              Publish Now
            </Button>
          </div>

          {!post.media?.length && (
            <p className="text-sm text-destructive">
              Cannot publish: No media attached to this post.
            </p>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
