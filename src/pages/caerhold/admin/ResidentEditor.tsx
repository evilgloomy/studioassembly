import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCaerholdResidentById, useUpdateCaerholdResident } from '@/hooks/caerhold/useCaerholdResidents';
import { usePublishResident, useUnpublishResident, useGenerateResidentProfile } from '@/hooks/caerhold/useCaerholdResidentImport';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Save, Send, RefreshCw, Eye, EyeOff, Camera, Undo2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ResidentEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: resident, isLoading } = useCaerholdResidentById(id || '');
  const updateMutation = useUpdateCaerholdResident();
  const publishMutation = usePublishResident();
  const unpublishMutation = useUnpublishResident();
  const generateMutation = useGenerateResidentProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [profileJobId, setProfileJobId] = useState<string | null>(null);
  const [jobLookupDone, setJobLookupDone] = useState(false);

  const [form, setForm] = useState<Record<string, any>>({});
  const [savedSnapshot, setSavedSnapshot] = useState<Record<string, any>>({});

  // Build form state from resident data
  const buildFormState = (r: typeof resident) => {
    if (!r) return {};
    return {
      first_name: (r as any).first_name || '',
      last_name: (r as any).last_name || '',
      display_name: r.display_name,
      handle: r.handle,
      slug: r.slug,
      role_title: r.role_title || '',
      bio: r.bio || '',
      posting_enabled: r.posting_enabled,
      is_child: (r as any).is_child ?? false,
      tone_profile: r.tone_profile || {},
      personality: (r as any).personality || {},
      lore_hooks: (r as any).lore_hooks || {},
      canon_rules: r.canon_rules || {},
    };
  };

  useEffect(() => {
    if (resident) {
      const state = buildFormState(resident);
      setForm(state);
      setSavedSnapshot(state);
    }
  }, [resident]);

  // Look up the most recent profile job for this resident
  useEffect(() => {
    if (!id) return;
    setJobLookupDone(false);
    (supabase as any)
      .from('caerhold_resident_profile_jobs')
      .select('id')
      .eq('result_resident_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }: any) => {
        setProfileJobId(data?.[0]?.id || null);
        setJobLookupDone(true);
      });
  }, [id]);

  // Check if form has unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(savedSnapshot);
  }, [form, savedSnapshot]);

  const handleUndo = () => {
    setForm({ ...savedSnapshot });
    toast({ title: 'Reverted', description: 'Form restored to last saved state.' });
  };

  const handleRegenerate = async () => {
    if (!profileJobId) return;
    setShowRegenConfirm(false);
    try {
      await generateMutation.mutateAsync(profileJobId);
      toast({ title: 'Regenerated', description: 'Profile has been regenerated from source photo.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Regeneration failed', description: err.message });
    }
  };

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
          is_child: form.is_child ?? false,
          personality: form.personality,
          lore_hooks: form.lore_hooks,
        })
        .eq('id', id);

      setSavedSnapshot({ ...form });
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `caerhold/avatars/${id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      const batchId = crypto.randomUUID();
      const { data: { user } } = await supabase.auth.getUser();

      const { data: mediaRow, error: mediaError } = await (supabase as any)
        .from('caerhold_media')
        .insert({
          storage_path: path,
          public_url: urlData.publicUrl,
          type: file.type,
          upload_batch_id: batchId,
          uploaded_by: user!.id,
        })
        .select('id')
        .single();
      if (mediaError) throw mediaError;

      await (supabase as any)
        .from('caerhold_residents')
        .update({ avatar_media_id: mediaRow.id })
        .eq('id', id);

      toast({ title: 'Avatar updated' });
      queryClient.invalidateQueries({ queryKey: ['caerhold', 'residents'] });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    } finally {
      setUploading(false);
    }
  };

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
  const canRegenerate = jobLookupDone && !!profileJobId;

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
      <div className="border border-border p-6 flex flex-col items-center gap-4">
        {(resident as any).avatar_url ? (
          <img src={(resident as any).avatar_url} alt={resident.display_name} className="max-h-64 rounded object-contain" />
        ) : (
          <div className="h-48 w-48 bg-muted rounded flex items-center justify-center text-muted-foreground text-4xl font-bold">
            {resident.display_name?.charAt(0)}
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Camera className="mr-2 h-4 w-4" />
          {uploading ? 'Uploading...' : 'Change Avatar'}
        </Button>
      </div>

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
        <div className="flex items-center gap-3">
          <Switch
            checked={form.is_child || false}
            onCheckedChange={v => updateField('is_child', v)}
          />
          <Label className="text-xs tracking-widest uppercase">Is Child</Label>
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
      <div className="flex gap-3 flex-wrap">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {updateMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
        <Button variant="outline" onClick={handleUndo} disabled={!hasChanges}>
          <Undo2 className="mr-2 h-4 w-4" /> Undo Changes
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="outline"
                  onClick={() => setShowRegenConfirm(true)}
                  disabled={!canRegenerate || generateMutation.isPending}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
                  {generateMutation.isPending ? 'Regenerating...' : 'Regenerate Profile'}
                </Button>
              </span>
            </TooltipTrigger>
            {!canRegenerate && jobLookupDone && (
              <TooltipContent>No source photo available for regeneration</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
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

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={showRegenConfirm} onOpenChange={setShowRegenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will use AI to create a completely new profile from the source photo. All current information (name, bio, personality, tone, lore, canon rules) will be overwritten and cannot be recovered unless you save first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
