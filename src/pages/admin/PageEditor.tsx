import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageSections, useUpdatePageSection, useReorderPageSections, useCreatePageSection, useDeletePageSection, PageSection } from '@/hooks/usePageSections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ArrowLeft, Save, GripVertical, Eye, EyeOff, Plus, Trash2, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MediaPicker } from '@/components/admin/MediaPicker';

const PAGE_TITLES: Record<string, string> = {
  home: 'Homepage',
  about: 'About Page',
};

const SECTION_TYPES = [
  { value: 'hero', label: 'Hero Section' },
  { value: 'text', label: 'Text Block' },
  { value: 'text_image', label: 'Text + Image' },
  { value: 'feature_grid', label: 'Feature Grid' },
  { value: 'product_grid', label: 'Product Grid' },
];

export default function PageEditor() {
  const { pageSlug } = useParams<{ pageSlug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: sections, isLoading } = usePageSections(pageSlug || '');
  const updateSection = useUpdatePageSection();
  const reorderSections = useReorderPageSections();
  const createSection = useCreatePageSection();
  const deleteSection = useDeletePageSection();

  const [editingSection, setEditingSection] = useState<PageSection | null>(null);
  const [editContent, setEditContent] = useState<Record<string, any>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSectionType, setNewSectionType] = useState('text');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerField, setMediaPickerField] = useState<string>('');

  const handleEdit = (section: PageSection) => {
    setEditingSection(section);
    setEditContent(section.content);
  };

  const handleSave = async () => {
    if (!editingSection) return;
    
    try {
      await updateSection.mutateAsync({
        id: editingSection.id,
        content: editContent,
      });
      toast({ title: 'Section updated' });
      setEditingSection(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleToggleVisibility = async (section: PageSection) => {
    try {
      await updateSection.mutateAsync({
        id: section.id,
        is_visible: !section.is_visible,
      });
      toast({ title: section.is_visible ? 'Section hidden' : 'Section visible' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    if (!sections) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];

    try {
      await reorderSections.mutateAsync(
        newSections.map((s, i) => ({ id: s.id, sort_order: i + 1 }))
      );
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleAddSection = async () => {
    if (!pageSlug || !newSectionTitle.trim()) return;

    const sectionKey = newSectionTitle.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const maxOrder = sections?.reduce((max, s) => Math.max(max, s.sort_order), 0) || 0;

    let defaultContent: Record<string, any> = {};
    switch (newSectionType) {
      case 'hero':
        defaultContent = { headline: '', subheadline: '', background_image: '', cta_text: '', cta_link: '' };
        break;
      case 'text':
        defaultContent = { body: '' };
        break;
      case 'text_image':
        defaultContent = { title: '', body: '', image: '', image_position: 'right' };
        break;
      case 'feature_grid':
        defaultContent = { features: [] };
        break;
      case 'product_grid':
        defaultContent = { title: '', show_count: 3 };
        break;
    }

    try {
      await createSection.mutateAsync({
        page_slug: pageSlug,
        section_key: sectionKey,
        section_type: newSectionType,
        title: newSectionTitle,
        content: defaultContent,
        sort_order: maxOrder + 1,
      });
      toast({ title: 'Section added' });
      setAddDialogOpen(false);
      setNewSectionTitle('');
      setNewSectionType('text');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDeleteSection = async (id: string) => {
    try {
      await deleteSection.mutateAsync(id);
      toast({ title: 'Section deleted' });
      setDeleteConfirm(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const openMediaPicker = (field: string) => {
    setMediaPickerField(field);
    setMediaPickerOpen(true);
  };

  const handleMediaSelect = (url: string) => {
    setEditContent(prev => ({ ...prev, [mediaPickerField]: url }));
    setMediaPickerOpen(false);
  };

  const renderContentEditor = () => {
    if (!editingSection) return null;

    switch (editingSection.section_type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Headline</Label>
              <Input
                value={editContent.headline || ''}
                onChange={(e) => setEditContent(prev => ({ ...prev, headline: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Subheadline</Label>
              <Textarea
                value={editContent.subheadline || ''}
                onChange={(e) => setEditContent(prev => ({ ...prev, subheadline: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Background Image</Label>
              <div className="flex gap-2">
                <Input
                  value={editContent.background_image || ''}
                  onChange={(e) => setEditContent(prev => ({ ...prev, background_image: e.target.value }))}
                  placeholder="Image URL..."
                />
                <Button variant="outline" onClick={() => openMediaPicker('background_image')}>Browse</Button>
              </div>
              {editContent.background_image && (
                <img src={editContent.background_image} alt="Preview" className="h-24 object-cover mt-2" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs tracking-widest uppercase">CTA Text</Label>
                <Input
                  value={editContent.cta_text || ''}
                  onChange={(e) => setEditContent(prev => ({ ...prev, cta_text: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs tracking-widest uppercase">CTA Link</Label>
                <Input
                  value={editContent.cta_link || ''}
                  onChange={(e) => setEditContent(prev => ({ ...prev, cta_link: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">Content</Label>
            <Textarea
              value={editContent.body || ''}
              onChange={(e) => setEditContent(prev => ({ ...prev, body: e.target.value }))}
              rows={8}
            />
          </div>
        );

      case 'text_image':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Title</Label>
              <Input
                value={editContent.title || ''}
                onChange={(e) => setEditContent(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Content</Label>
              <Textarea
                value={editContent.body || ''}
                onChange={(e) => setEditContent(prev => ({ ...prev, body: e.target.value }))}
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Image</Label>
              <div className="flex gap-2">
                <Input
                  value={editContent.image || ''}
                  onChange={(e) => setEditContent(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="Image URL..."
                />
                <Button variant="outline" onClick={() => openMediaPicker('image')}>Browse</Button>
              </div>
              {editContent.image && (
                <img src={editContent.image} alt="Preview" className="h-24 object-cover mt-2" />
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Image Position</Label>
              <Select
                value={editContent.image_position || 'right'}
                onValueChange={(value) => setEditContent(prev => ({ ...prev, image_position: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'feature_grid':
        const features = editContent.features || [];
        return (
          <div className="space-y-4">
            {features.map((feature: any, index: number) => (
              <div key={index} className="border border-input p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs tracking-widest uppercase text-muted-foreground">Feature {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditContent(prev => ({
                      ...prev,
                      features: features.filter((_: any, i: number) => i !== index)
                    }))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  placeholder="Icon name (e.g., Ruler, Layers)"
                  value={feature.icon || ''}
                  onChange={(e) => {
                    const newFeatures = [...features];
                    newFeatures[index] = { ...feature, icon: e.target.value };
                    setEditContent(prev => ({ ...prev, features: newFeatures }));
                  }}
                />
                <Input
                  placeholder="Title"
                  value={feature.title || ''}
                  onChange={(e) => {
                    const newFeatures = [...features];
                    newFeatures[index] = { ...feature, title: e.target.value };
                    setEditContent(prev => ({ ...prev, features: newFeatures }));
                  }}
                />
                <Textarea
                  placeholder="Description"
                  value={feature.description || ''}
                  onChange={(e) => {
                    const newFeatures = [...features];
                    newFeatures[index] = { ...feature, description: e.target.value };
                    setEditContent(prev => ({ ...prev, features: newFeatures }));
                  }}
                  rows={2}
                />
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => setEditContent(prev => ({
                ...prev,
                features: [...features, { icon: '', title: '', description: '' }]
              }))}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </div>
        );

      case 'product_grid':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Section Title</Label>
              <Input
                value={editContent.title || ''}
                onChange={(e) => setEditContent(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Number of Products</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={editContent.show_count || 3}
                onChange={(e) => setEditContent(prev => ({ ...prev, show_count: parseInt(e.target.value) }))}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-muted-foreground text-sm">
            Unknown section type. Edit the raw JSON:
            <Textarea
              value={JSON.stringify(editContent, null, 2)}
              onChange={(e) => {
                try {
                  setEditContent(JSON.parse(e.target.value));
                } catch {}
              }}
              rows={10}
              className="font-mono mt-2"
            />
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-widest uppercase">
            {PAGE_TITLES[pageSlug || ''] || 'Page Editor'}
          </h1>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="tracking-widest uppercase">
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {sections?.map((section, index) => (
          <div
            key={section.id}
            className={`border border-input p-4 ${!section.is_visible ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMoveSection(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMoveSection(index, 'down')}
                    disabled={index === (sections?.length || 0) - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="font-medium">{section.title}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {section.section_type.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleVisibility(section)}
                >
                  {section.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(section)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteConfirm(section.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Section Dialog */}
      <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="tracking-widest uppercase">
              Edit: {editingSection?.title}
            </DialogTitle>
          </DialogHeader>
          {renderContentEditor()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateSection.isPending}>
              {updateSection.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="tracking-widest uppercase">Add Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Section Title</Label>
              <Input
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="e.g., About Our Process"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">Section Type</Label>
              <Select value={newSectionType} onValueChange={setNewSectionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAddSection}
              disabled={!newSectionTitle.trim() || createSection.isPending}
            >
              {createSection.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteSection(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Media Picker */}
      <MediaPicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
