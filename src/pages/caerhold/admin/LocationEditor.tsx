import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCaerholdLocationById, useUpdateCaerholdLocation } from '@/hooks/caerhold/useCaerholdLocations';
import { useCaerholdLocationMedia, useAddLocationMedia, useRemoveLocationMedia } from '@/hooks/caerhold/useCaerholdLocationMedia';
import { useCaerholdLocationOwners, useAddLocationOwner, useRemoveLocationOwner } from '@/hooks/caerhold/useCaerholdLocationOwners';
import { useCaerholdDistricts } from '@/hooks/caerhold/useCaerholdDistricts';
import { useCaerholdResidents } from '@/hooks/caerhold/useCaerholdResidents';
import { useCaerholdMedia } from '@/hooks/caerhold/useCaerholdMedia';
import { locationTypeLabels } from '@/data/caerhold-constants';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Sparkles, Trash2, Plus, Image, Users, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CaerholdLocationType } from '@/types/caerhold';

export default function LocationEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: location, isLoading } = useCaerholdLocationById(id || '');
  const { data: locationMedia } = useCaerholdLocationMedia(id || '');
  const { data: owners } = useCaerholdLocationOwners(id || '');
  const { data: districts } = useCaerholdDistricts(false);
  const { data: allResidents } = useCaerholdResidents();
  const { data: allMedia } = useCaerholdMedia();
  const updateMutation = useUpdateCaerholdLocation();
  const addMedia = useAddLocationMedia();
  const removeMedia = useRemoveLocationMedia();
  const addOwner = useAddLocationOwner();
  const removeOwner = useRemoveLocationOwner();

  const [form, setForm] = useState<Record<string, any>>({});
  const [savedSnapshot, setSavedSnapshot] = useState<Record<string, any>>({});
  const [generating, setGenerating] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerRole, setOwnerRole] = useState('owner');

  const buildForm = (loc: any) => ({
    name: loc.name || '',
    slug: loc.slug || '',
    type: loc.type || 'landmark',
    district_id: loc.district_id || '',
    is_published: loc.is_published ?? false,
    description: loc.description || '',
    short_blurb: loc.short_blurb || '',
    category: loc.category || '',
    hero_image_url: loc.hero_image_url || '',
    vibe_tags: (loc.vibe_tags || []).join(', '),
    signature_items: (loc.signature_items || []).join(', '),
    visitor_tips: (loc.visitor_tips || []).join(', '),
    ai_locked_fields: loc.ai_locked_fields || [],
  });

  useEffect(() => {
    if (location) {
      const s = buildForm(location);
      setForm(s);
      setSavedSnapshot(s);
    }
  }, [location]);

  const hasChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(savedSnapshot), [form, savedSnapshot]);

  const updateField = (key: string, value: any) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      const aiFields = ['category', 'short_blurb', 'description', 'vibe_tags', 'signature_items', 'visitor_tips'];
      if (aiFields.includes(key) && !next.ai_locked_fields.includes(key)) {
        next.ai_locked_fields = [...next.ai_locked_fields, key];
      }
      return next;
    });
  };

  const parseArray = (val: string) => val.split(',').map(s => s.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({
        id,
        input: {
          name: form.name,
          slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
          type: form.type as CaerholdLocationType,
          district_id: form.district_id || null,
          is_published: form.is_published,
          description: form.description || null,
          short_blurb: form.short_blurb || null,
          category: form.category || null,
          hero_image_url: form.hero_image_url || null,
          vibe_tags: parseArray(form.vibe_tags),
          signature_items: parseArray(form.signature_items),
          visitor_tips: parseArray(form.visitor_tips),
          ai_locked_fields: form.ai_locked_fields,
        },
      });
      setSavedSnapshot({ ...form });
      toast({ title: 'Saved', description: 'Location updated.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleGenerate = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-location-profile', {
        body: { location_id: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Profile generated', description: 'AI profile has been created from images.' });
      queryClient.invalidateQueries({ queryKey: ['caerhold', 'locations'] });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Generation failed', description: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleAddMedia = async (mediaId: string) => {
    if (!id) return;
    try {
      await addMedia.mutateAsync({ location_id: id, media_id: mediaId, sort_order: (locationMedia?.length || 0) });
      toast({ title: 'Image added' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleRemoveMedia = async (lmId: string) => {
    try {
      await removeMedia.mutateAsync(lmId);
      toast({ title: 'Image removed' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleSetHero = (url: string) => updateField('hero_image_url', url);

  const handleAddOwner = async (residentId: string) => {
    if (!id) return;
    try {
      await addOwner.mutateAsync({ location_id: id, resident_id: residentId, role: ownerRole });
      setOwnerSearch('');
      toast({ title: 'Owner added' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleRemoveOwner = async (ownerId: string) => {
    try {
      await removeOwner.mutateAsync(ownerId);
      toast({ title: 'Owner removed' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const linkedMediaIds = new Set((locationMedia || []).map(lm => lm.media_id));
  const availableMedia = (allMedia || []).filter(m => m.type?.startsWith('image') && !linkedMediaIds.has(m.id));

  const ownerResidentIds = new Set((owners || []).map(o => o.resident_id));
  const searchResults = ownerSearch.length >= 2
    ? (allResidents || []).filter(r =>
      !ownerResidentIds.has(r.id) &&
      (r.display_name.toLowerCase().includes(ownerSearch.toLowerCase()) ||
        r.handle.toLowerCase().includes(ownerSearch.toLowerCase()))
    ).slice(0, 5)
    : [];

  if (isLoading) return <div className="text-center py-16 text-muted-foreground">Loading location...</div>;
  if (!location) return <div className="text-center py-16 text-muted-foreground">Location not found.</div>;

  const aiStatus = (location as any).ai_status || 'idle';

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/caerhold/locations')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-widest uppercase flex-1">Edit Location</h1>
        <Badge variant={form.is_published ? 'default' : 'secondary'}>
          {form.is_published ? 'Published' : 'Draft'}
        </Badge>
      </div>

      {/* Core Fields */}
      <section className="border border-border p-6 space-y-4">
        <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Core Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">Name</Label>
            <Input value={form.name || ''} onChange={e => updateField('name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">Slug</Label>
            <Input value={form.slug || ''} onChange={e => updateField('slug', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">Type</Label>
            <Select value={form.type} onValueChange={v => updateField('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(locationTypeLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">District</Label>
            <Select value={form.district_id || 'none'} onValueChange={v => updateField('district_id', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {districts?.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={form.is_published ?? false} onCheckedChange={v => updateField('is_published', v)} />
          <Label className="text-xs tracking-widest uppercase">Published</Label>
        </div>
      </section>

      {/* Media Section */}
      <section className="border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
            <Image className="inline h-4 w-4 mr-2" />Images
          </h2>
          <Button variant="outline" size="sm" onClick={() => setShowMediaPicker(!showMediaPicker)}>
            <Plus className="h-4 w-4 mr-1" />Add Image
          </Button>
        </div>

        {showMediaPicker && (
          <div className="border border-border p-4 max-h-48 overflow-y-auto grid grid-cols-4 gap-2">
            {availableMedia.length === 0 ? (
              <p className="col-span-4 text-sm text-muted-foreground">No available images. Upload media first.</p>
            ) : (
              availableMedia.slice(0, 20).map(m => (
                <button
                  key={m.id}
                  onClick={() => { handleAddMedia(m.id); setShowMediaPicker(false); }}
                  className="aspect-square overflow-hidden border border-border hover:border-primary transition-colors"
                >
                  <img src={m.public_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {(locationMedia || []).map(lm => {
            const mediaUrl = (lm as any).media?.public_url || '';
            const isHero = form.hero_image_url === mediaUrl;
            return (
              <div key={lm.id} className={`relative group border-2 overflow-hidden ${isHero ? 'border-primary' : 'border-border'}`}>
                <img src={mediaUrl} alt="" className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleSetHero(mediaUrl)}>
                    {isHero ? 'Hero' : 'Set Hero'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleRemoveMedia(lm.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {isHero && <Badge className="absolute top-1 left-1 text-[10px]">Hero</Badge>}
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Panel */}
      <section className="border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
            <Sparkles className="inline h-4 w-4 mr-2" />AI Profile
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{aiStatus}</Badge>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={generating || (locationMedia?.length || 0) === 0}
            >
              <Sparkles className={`h-4 w-4 mr-1 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Generate from Images'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">
                Category
                {form.ai_locked_fields?.includes('category') && <Badge variant="secondary" className="ml-2 text-[10px]">Edited</Badge>}
              </Label>
              <Input value={form.category || ''} onChange={e => updateField('category', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">
                Short Blurb
                {form.ai_locked_fields?.includes('short_blurb') && <Badge variant="secondary" className="ml-2 text-[10px]">Edited</Badge>}
              </Label>
              <Input value={form.short_blurb || ''} onChange={e => updateField('short_blurb', e.target.value)} maxLength={140} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">
              Description
              {form.ai_locked_fields?.includes('description') && <Badge variant="secondary" className="ml-2 text-[10px]">Edited</Badge>}
            </Label>
            <Textarea value={form.description || ''} onChange={e => updateField('description', e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">
              Vibe Tags (comma-separated)
              {form.ai_locked_fields?.includes('vibe_tags') && <Badge variant="secondary" className="ml-2 text-[10px]">Edited</Badge>}
            </Label>
            <Input value={form.vibe_tags || ''} onChange={e => updateField('vibe_tags', e.target.value)} placeholder="cozy, modern, artisan" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">
              Signature Items (comma-separated)
              {form.ai_locked_fields?.includes('signature_items') && <Badge variant="secondary" className="ml-2 text-[10px]">Edited</Badge>}
            </Label>
            <Input value={form.signature_items || ''} onChange={e => updateField('signature_items', e.target.value)} placeholder="matcha latte, fresh bread" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">
              Visitor Tips (comma-separated)
              {form.ai_locked_fields?.includes('visitor_tips') && <Badge variant="secondary" className="ml-2 text-[10px]">Edited</Badge>}
            </Label>
            <Input value={form.visitor_tips || ''} onChange={e => updateField('visitor_tips', e.target.value)} placeholder="Visit mornings for freshest pastries" />
          </div>
        </div>
      </section>

      {/* Owners */}
      <section className="border border-border p-6 space-y-4">
        <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
          <Users className="inline h-4 w-4 mr-2" />Owners
        </h2>

        {(owners || []).length > 0 && (
          <div className="space-y-2">
            {owners!.map(o => (
              <div key={o.id} className="flex items-center justify-between border border-border p-3">
                <div>
                  <span className="font-medium">{(o as any).resident?.display_name || 'Unknown'}</span>
                  <Badge variant="outline" className="ml-2 text-[10px]">{o.role}</Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemoveOwner(o.id)}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Search residents..."
            value={ownerSearch}
            onChange={e => setOwnerSearch(e.target.value)}
            className="flex-1"
          />
          <Select value={ownerRole} onValueChange={setOwnerRole}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="co-owner">Co-owner</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="founder">Founder</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {searchResults.length > 0 && (
          <div className="border border-border divide-y divide-border">
            {searchResults.map(r => (
              <button
                key={r.id}
                className="w-full text-left px-3 py-2 hover:bg-secondary/50 transition-colors"
                onClick={() => handleAddOwner(r.id)}
              >
                <span className="font-medium">{r.display_name}</span>
                <span className="text-sm text-muted-foreground ml-2">{r.handle}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Save */}
      <div className="flex justify-end gap-2 pb-8">
        <Button onClick={handleSave} disabled={updateMutation.isPending || !hasChanges}>
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
