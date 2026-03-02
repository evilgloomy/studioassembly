import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCaerholdDistricts, useCreateCaerholdDistrict, useDeleteCaerholdDistrict } from '@/hooks/caerhold/useCaerholdDistricts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CaerholdAdminDistricts() {
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', tagline: '', description: '', hero_image_url: '',
    sort_order: 0, is_published: true,
  });

  const { data: districts, isLoading } = useCaerholdDistricts(false);
  const createMutation = useCreateCaerholdDistrict();
  const deleteMutation = useDeleteCaerholdDistrict();
  const { toast } = useToast();

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        tagline: form.tagline || null,
        description: form.description || null,
        hero_image_url: form.hero_image_url || null,
        sort_order: form.sort_order,
        is_published: form.is_published,
      });
      toast({ title: 'District created' });
      setShowCreate(false);
      setForm({ name: '', slug: '', tagline: '', description: '', hero_image_url: '', sort_order: 0, is_published: true });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast({ title: 'District deleted' });
      setDeleteId(null);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Districts</h1>
        <Button onClick={() => setShowCreate(true)} className="tracking-widest uppercase">
          <Plus className="mr-2 h-4 w-4" /> Add District
        </Button>
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs tracking-widest uppercase">Order</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Name</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Tagline</TableHead>
              <TableHead className="text-xs tracking-widest uppercase">Status</TableHead>
              <TableHead className="text-xs tracking-widest uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !districts?.length ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No districts yet.</TableCell></TableRow>
            ) : (
              districts.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.sort_order}</TableCell>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{d.tagline || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={d.is_published ? 'default' : 'secondary'}>
                      {d.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/admin/caerhold/districts/${d.id}`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)}>
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="tracking-widest uppercase">Add District</DialogTitle>
            <DialogDescription>Create a new district in Caerhold.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs tracking-widest uppercase">Name</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Riverside Terrace" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs tracking-widest uppercase">Slug</Label>
                <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="riverside-terrace" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Tagline</Label>
              <Input value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))} placeholder="Where the river meets the city" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Hero Image URL</Label>
              <Input value={form.hero_image_url} onChange={e => setForm(p => ({ ...p, hero_image_url: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs tracking-widest uppercase">Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.is_published} onCheckedChange={v => setForm(p => ({ ...p, is_published: v }))} />
                <Label className="text-xs tracking-widest uppercase">Published</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete District</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Residents and locations in this district will be unlinked.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
