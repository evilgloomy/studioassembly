import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateCaerholdDistrict } from '@/hooks/caerhold/useCaerholdDistricts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import type { CaerholdDistrict } from '@/types/caerhold';

function useDistrictById(id: string) {
  return useQuery({
    queryKey: ['caerhold', 'districts', 'id', id],
    queryFn: async (): Promise<CaerholdDistrict | null> => {
      const { data, error } = await (supabase as any)
        .from('caerhold_districts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!id,
  });
}

export default function DistrictEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: district, isLoading } = useDistrictById(id || '');
  const updateMutation = useUpdateCaerholdDistrict();

  const [form, setForm] = useState({
    name: '', slug: '', tagline: '', description: '', hero_image_url: '',
    sort_order: 0, is_published: true,
    hotspot_x: '', hotspot_y: '', hotspot_w: '', hotspot_h: '',
  });

  useEffect(() => {
    if (district) {
      const hs = district.map_hotspot as any || {};
      setForm({
        name: district.name, slug: district.slug,
        tagline: district.tagline || '', description: district.description || '',
        hero_image_url: district.hero_image_url || '',
        sort_order: district.sort_order, is_published: district.is_published,
        hotspot_x: hs.x?.toString() || '', hotspot_y: hs.y?.toString() || '',
        hotspot_w: hs.w?.toString() || '', hotspot_h: hs.h?.toString() || '',
      });
    }
  }, [district]);

  const handleSave = async () => {
    if (!id) return;
    try {
      const hotspot = form.hotspot_x && form.hotspot_y && form.hotspot_w && form.hotspot_h
        ? { type: 'rect', x: parseFloat(form.hotspot_x), y: parseFloat(form.hotspot_y), w: parseFloat(form.hotspot_w), h: parseFloat(form.hotspot_h) }
        : null;

      await updateMutation.mutateAsync({
        id,
        input: {
          name: form.name, slug: form.slug,
          tagline: form.tagline || null, description: form.description || null,
          hero_image_url: form.hero_image_url || null,
          sort_order: form.sort_order, is_published: form.is_published,
          map_hotspot: hotspot,
        },
      });
      toast({ title: 'District saved' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  if (isLoading) return <div className="text-center py-16 text-muted-foreground">Loading...</div>;
  if (!district) return <div className="text-center py-16 text-muted-foreground">District not found.</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/caerhold/districts')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-widest uppercase flex-1">Edit District</h1>
        <Badge variant={form.is_published ? 'default' : 'secondary'}>
          {form.is_published ? 'Published' : 'Draft'}
        </Badge>
      </div>

      <section className="space-y-4 border border-border p-6">
        <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">Name</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">Slug</Label>
            <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Tagline</Label>
          <Input value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Description</Label>
          <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} />
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
      </section>

      <section className="space-y-4 border border-border p-6">
        <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Map Hotspot (normalized 0–1)</h2>
        <div className="grid grid-cols-4 gap-4">
          {(['hotspot_x', 'hotspot_y', 'hotspot_w', 'hotspot_h'] as const).map(field => (
            <div key={field} className="space-y-2">
              <Label className="text-xs tracking-widest uppercase">{field.split('_')[1].toUpperCase()}</Label>
              <Input
                type="number" step="0.01" min="0" max="1"
                value={form[field]}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Leave all empty to skip hotspot. Values are fractions of the map image (0 = left/top, 1 = right/bottom).</p>
      </section>

      <Button onClick={handleSave} disabled={updateMutation.isPending}>
        <Save className="mr-2 h-4 w-4" />
        {updateMutation.isPending ? 'Saving...' : 'Save District'}
      </Button>
    </div>
  );
}
