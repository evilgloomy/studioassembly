import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCaerholdResidents, useCreateCaerholdResident, useDeleteCaerholdResident } from '@/hooks/caerhold/useCaerholdResidents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CaerholdAdminResidents() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    handle: '',
    slug: '',
    role_title: '',
    bio: '',
  });

  const { data: residents, isLoading } = useCaerholdResidents();
  const createMutation = useCreateCaerholdResident();
  const deleteMutation = useDeleteCaerholdResident();
  const { toast } = useToast();

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        display_name: formData.display_name,
        handle: formData.handle.startsWith('@') ? formData.handle : `@${formData.handle}`,
        slug: formData.slug || formData.handle.replace('@', '').toLowerCase().replace(/\s+/g, '-'),
        role_title: formData.role_title || null,
        bio: formData.bio || null,
      });
      toast({
        title: 'Resident created',
        description: `${formData.display_name} has been added to Caerhold.`,
      });
      setShowCreateDialog(false);
      setFormData({ display_name: '', handle: '', slug: '', role_title: '', bio: '' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create resident.',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast({
        title: 'Resident deleted',
        description: 'The resident has been removed from Caerhold.',
      });
      setDeleteId(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete resident.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Residents</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/caerhold/residents/import">
              <Upload className="mr-2 h-4 w-4" /> Import from Photos
            </Link>
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="tracking-widest uppercase">
            <Plus className="mr-2 h-4 w-4" />
            Add Resident
          </Button>
        </div>
      </div>

      {/* Residents Table */}
      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs tracking-widest uppercase w-12"></TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Name</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Handle</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Role</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Status</TableHead>
              <TableHead className="text-xs tracking-widest uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading residents...
                </TableCell>
              </TableRow>
            ) : residents?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No residents yet. Add your first resident!
                </TableCell>
              </TableRow>
            ) : (
              residents?.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell className="w-12 pr-0">
                    {(resident as any).avatar_url ? (
                      <img src={(resident as any).avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                        {resident.display_name[0]}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link to={`/caerhold/residents/${resident.slug}`} className="hover:underline">
                      {resident.display_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{resident.handle}</TableCell>
                  <TableCell className="text-muted-foreground">{resident.role_title || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant={(resident as any).profile_status === 'published' ? 'default' : 'secondary'}>
                        {(resident as any).profile_status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                      <Badge variant={resident.posting_enabled ? 'default' : 'secondary'}>
                        {resident.posting_enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/admin/caerhold/residents/${resident.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setDeleteId(resident.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="tracking-widest uppercase">Add Resident</DialogTitle>
            <DialogDescription>
              Create a new character for the City of Caerhold.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_name" className="text-xs tracking-widest uppercase">
                  Display Name
                </Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Noah Caldwell"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="handle" className="text-xs tracking-widest uppercase">
                  Handle
                </Label>
                <Input
                  id="handle"
                  value={formData.handle}
                  onChange={(e) => setFormData(prev => ({ ...prev, handle: e.target.value }))}
                  placeholder="@noah_caldwell"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role_title" className="text-xs tracking-widest uppercase">
                Role / Title
              </Label>
              <Input
                id="role_title"
                value={formData.role_title}
                onChange={(e) => setFormData(prev => ({ ...prev, role_title: e.target.value }))}
                placeholder="Blacksmith at Iron Gate Forge"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-xs tracking-widest uppercase">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="A brief description of this resident..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Resident'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resident</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resident? This will also remove all their posts and drafts.
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
