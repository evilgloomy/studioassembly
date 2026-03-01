import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCaerholdResidentById, useUpdateCaerholdResident } from '@/hooks/caerhold/useCaerholdResidents';
import { usePublishResident, useUnpublishResident, useGenerateResidentProfile } from '@/hooks/caerhold/useCaerholdResidentImport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Send, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ResidentEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: resident, isLoading } = useCaerholdResidentById(id || '');
  const updateMutation = useUpdateCaerholdResident();
  const publishMutation = usePublishResident();
  const unpublishMutation = useUnpublishResident();

  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (resident) {
      setForm({
        first_name: (resident as any).first_name || '',
        last_name: (resident as any).last_name || '',
        display_name: resident.display_name,
        handle: resident.handle,
        slug: resident.slug,
        role_title: resident.role_title || '',
        bio: resident.bio || '',
        posting_enabled: resident.posting_enabled,
        tone_profile: resident.tone_profile || {},
        personality: (resident as any).personality || {},
        lore_hooks: (resident as any).lore_hooks || {},
        canon_rules: resident.canon_rules || {},
      });
    }
  }, [resident]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({
        id,
        input: {
          display_name: form.display_name,
          handle: form.handle,
          slug: form.slug,
          role_title: form.role_title || null,
          bio: form.bio || null,
          posting_enabled: form.posting_enabled,
          tone_profile: form.tone_profile,
          canon_rules: form.canon_rules,
        },
      });
      // Update extended fields via direct call
      const { supabase } = await import('@/integrations/supabase/client');
      await (supabase as any)
        .from('caerhold_residents')
        .update({
          first_name: form.first_name || null,
          last_name: form.last_name || null,
          personality: form.personality,
          lore_hooks: form.lore_hooks,
        })
        .eq('id', id);

      toast({ title: 'Saved', description: 'Resident profile updated.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    try {
      await publishMutation.mutateAsync(id);
      toast({ title: 'Published', description: 'Resident is now visible publicly.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleUnpublish = async () => {
    if (!id) return;
    try {
      await unpublishMutation.mutateAsync(id);
      toast({ title: 'Unpublished', description: 'Resident is now hidden from public.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const updateField = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const updateNestedField = (parent: string, key: string, value: any) => {
    setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }));
  };

  const updateArrayField = (parent: string, key: string, value: string) => {
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: arr } }));
  };

  if (isLoading) {
    return <div className="text-center py-16 text-muted-foreground">Loading resident...</div>;
  }

  if (!resident) {
    return <div className="text-center py-16 text-muted-foreground">Resident not found.</div>;
  }

  const isPublished = (resident as any).profile_status === 'published';

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-widest uppercase flex-1">Edit Resident</h1>
        <Badge variant={isPublished ? 'default' : 'secondary'}>
          {isPublished ? 'Published' : 'Draft'}
        </Badge>
      </div>

      {/* Portrait */}
      {(resident as any).avatar_url && (
        <div className="border border-border p-6 flex justify-center">
          <img src={(resident as any).avatar_url} alt={resident.display_name} className="max-h-64 rounded object-contain" />
        </div>
      )}

      {/* Basic Info */}
      <section className="space-y-4 border border-border p-6">
        <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Identity</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">First Name</Label>
            <Input value={form.first_name || ''} onChange={e => updateField('first_name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">Last Name</Label>
            <Input value={form.last_name || ''} onChange={e => updateField('last_name', e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Display Name</Label>
          <Input value={form.display_name || ''} onChange={e => updateField('display_name', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">Handle</Label>
            <Input value={form.handle || ''} onChange={e => updateField('handle', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">Slug</Label>
            <Input value={form.slug || ''} onChange={e => updateField('slug', e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Occupation</Label>
          <Input value={form.role_title || ''} onChange={e => updateField('role_title', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Bio</Label>
          <Textarea value={form.bio || ''} onChange={e => updateField('bio', e.target.value)} rows={4} />
        </div>
      </section>

      {/* Tone Profile */}
      <section className="space-y-4 border border-border p-6">
        <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Tone Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">Voice Style</Label>
            <Select value={form.tone_profile?.voiceStyle || ''} onValueChange={v => updateNestedField('tone_profile', 'voiceStyle', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {['formal', 'casual', 'poetic', 'dry', 'warm', 'chaotic', 'quiet'].map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase">Cadence</Label>
            <Select value={form.tone_profile?.cadence || ''} onValueChange={v => updateNestedField('tone_profile', 'cadence', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {['short sentences', 'flowing prose', 'punchy', 'measured'].map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={form.tone_profile?.useEmoji || false}
            onCheckedChange={v => updateNestedField('tone_profile', 'useEmoji', v)}
          />
          <Label className="text-xs tracking-widest uppercase">Use Emoji</Label>
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Personality Summary</Label>
          <Input value={form.tone_profile?.personality || ''} onChange={e => updateNestedField('tone_profile', 'personality', e.target.value)} />
        </div>
      </section>

      {/* Personality */}
      <section className="space-y-4 border border-border p-6">
        <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Personality</h2>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Traits (comma-separated)</Label>
          <Input
            value={(form.personality?.traits || []).join(', ')}
            onChange={e => updateArrayField('personality', 'traits', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Quirks (comma-separated)</Label>
          <Input
            value={(form.personality?.quirks || []).join(', ')}
            onChange={e => updateArrayField('personality', 'quirks', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Values (comma-separated)</Label>
          <Input
            value={(form.personality?.values || []).join(', ')}
            onChange={e => updateArrayField('personality', 'values', e.target.value)}
          />
        </div>
      </section>

      {/* Lore Hooks */}
      <section className="space-y-4 border border-border p-6">
        <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Lore Hooks</h2>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Home District</Label>
          <Input
            value={form.lore_hooks?.home_district || ''}
            onChange={e => updateNestedField('lore_hooks', 'home_district', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Affiliations (comma-separated)</Label>
          <Input
            value={(form.lore_hooks?.affiliations || []).join(', ')}
            onChange={e => updateArrayField('lore_hooks', 'affiliations', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Recurring Motifs (comma-separated)</Label>
          <Input
            value={(form.lore_hooks?.recurring_motifs || []).join(', ')}
            onChange={e => updateArrayField('lore_hooks', 'recurring_motifs', e.target.value)}
          />
        </div>
      </section>

      {/* Canon Rules */}
      <section className="space-y-4 border border-border p-6">
        <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Canon Rules</h2>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Allowed Topics (comma-separated)</Label>
          <Input
            value={(form.canon_rules?.allowed_topics || form.canon_rules?.allowedTopics || []).join(', ')}
            onChange={e => updateArrayField('canon_rules', 'allowed_topics', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Forbidden Claims (comma-separated)</Label>
          <Input
            value={(form.canon_rules?.forbiddenClaims || []).join(', ')}
            onChange={e => updateArrayField('canon_rules', 'forbiddenClaims', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Grounding Rule</Label>
          <Textarea
            value={form.canon_rules?.grounding_rule || form.canon_rules?.backstory || ''}
            onChange={e => updateNestedField('canon_rules', 'grounding_rule', e.target.value)}
            rows={2}
          />
        </div>
      </section>

      {/* Controls */}
      <section className="space-y-4 border border-border p-6">
        <div className="flex items-center gap-3">
          <Switch
            checked={form.posting_enabled || false}
            onCheckedChange={v => updateField('posting_enabled', v)}
          />
          <Label className="text-xs tracking-widest uppercase">Posting Enabled</Label>
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {updateMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
        {isPublished ? (
          <Button variant="outline" onClick={handleUnpublish} disabled={unpublishMutation.isPending}>
            <EyeOff className="mr-2 h-4 w-4" /> Unpublish
          </Button>
        ) : (
          <Button variant="outline" onClick={handlePublish} disabled={publishMutation.isPending}>
            <Send className="mr-2 h-4 w-4" /> Publish
          </Button>
        )}
      </div>
    </div>
  );
}
