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
import { ArrowLeft, Save, Send, RefreshCw, Eye, EyeOff, Camera, Undo2, Sparkles, Check, Trash2 } from 'lucide-react';
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
  const [standardizing, setStandardizing] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [profileJobId, setProfileJobId] = useState<string | null>(null);
  const [jobLookupDone, setJobLookupDone] = useState(false);
  const [portraits, setPortraits] = useState<Array<{ id: string; media_id: string; label: string; public_url: string }>>([]);

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

  // Load all portraits for this resident
  const loadPortraits = async () => {
    if (!id) return;
    const { data } = await (supabase as any)
      .from('caerhold_resident_portraits')
      .select('id, media_id, label, media:caerhold_media!caerhold_resident_portraits_media_id_fkey(public_url)')
      .eq('resident_id', id)
      .order('created_at', { ascending: false });
    setPortraits(
      (data || []).map((p: any) => ({
        id: p.id,
        media_id: p.media_id,
        label: p.label,
        public_url: p.media?.public_url || '',
      }))
    );
  };

  useEffect(() => { loadPortraits(); }, [id]);

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

      // Add to portraits gallery
      await (supabase as any)
        .from('caerhold_resident_portraits')
        .insert({ resident_id: id, media_id: mediaRow.id, label: 'upload' })
        .select()
        .single();

      toast({ title: 'Avatar updated' });
      queryClient.invalidateQueries({ queryKey: ['caerhold', 'residents'] });
      loadPortraits();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleStandardizePortrait = async () => {
    if (!id || !resident) return;
    const avatarMediaId = (resident as any).avatar_media_id;
    if (!avatarMediaId) {
      toast({ variant: 'destructive', title: 'No avatar', description: 'Upload an avatar first before standardizing.' });
      return;
    }
    setStandardizing(true);
    try {
      const batchId = crypto.randomUUID();
      const { data, error } = await supabase.functions.invoke('standardize-portrait', {
        body: { media_id: avatarMediaId, batch_id: batchId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Set as active avatar
      await (supabase as any)
        .from('caerhold_residents')
        .update({ avatar_media_id: data.media_id })
        .eq('id', id);

      // Add to portraits table
      await (supabase as any)
        .from('caerhold_resident_portraits')
        .insert({ resident_id: id, media_id: data.media_id, label: 'standardized' })
        .select()
        .single();

      toast({ title: 'Portrait standardized', description: 'New studio portrait generated and set as avatar.' });
      queryClient.invalidateQueries({ queryKey: ['caerhold', 'residents'] });
      loadPortraits();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Standardization failed', description: err.message });
    } finally {
      setStandardizing(false);
    }
  };

  const handleSetActiveAvatar = async (mediaId: string) => {
    if (!id) return;
    try {
      await (supabase as any)
        .from('caerhold_residents')
        .update({ avatar_media_id: mediaId })
        .eq('id', id);
      toast({ title: 'Avatar updated' });
      queryClient.invalidateQueries({ queryKey: ['caerhold', 'residents'] });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleDeletePortrait = async (portraitId: string, mediaId: string) => {
    if (!id) return;
    const isActive = (resident as any).avatar_media_id === mediaId;
    if (isActive) {
      toast({ variant: 'destructive', title: 'Cannot delete', description: 'This is the active avatar. Set another portrait first.' });
      return;
    }
    try {
      await (supabase as any)
        .from('caerhold_resident_portraits')
        .delete()
        .eq('id', portraitId);
      toast({ title: 'Portrait removed' });
      loadPortraits();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/caerhold/residents')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-widest uppercase flex-1">Edit Resident</h1>
        <Badge variant={isPublished ? 'default' : 'secondary'}>
          {isPublished ? 'Published' : 'Draft'}
        </Badge>
      </div>

      {/* Portrait Gallery */}
      <section className="border border-border p-6 space-y-4">
        <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Portraits</h2>
        
        {/* Current active avatar */}
        <div className="flex justify-center">
          {(resident as any).avatar_url ? (
            <img src={(resident as any).avatar_url} alt={resident.display_name} className="max-h-64 rounded object-contain" />
          ) : (
            <div className="h-48 w-48 bg-muted rounded flex items-center justify-center text-muted-foreground text-4xl font-bold">
              {resident.display_name?.charAt(0)}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-center">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading || standardizing}>
            <Camera className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleStandardizePortrait} disabled={standardizing || uploading || !(resident as any).avatar_media_id}>
            <Sparkles className={`mr-2 h-4 w-4 ${standardizing ? 'animate-spin' : ''}`} />
            {standardizing ? 'Standardizing...' : 'Standardize Portrait'}
          </Button>
        </div>

        {/* Gallery grid */}
        {portraits.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Click a portrait to set it as the active avatar.</p>
            <div className="grid grid-cols-3 gap-3">
              {portraits.map((p) => {
                const isActive = (resident as any).avatar_media_id === p.media_id;
                return (
                  <div
                    key={p.id}
                    className={`relative group border-2 rounded overflow-hidden cursor-pointer transition-colors ${
                      isActive ? 'border-primary' : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => !isActive && handleSetActiveAvatar(p.media_id)}
                  >
                    <img src={p.public_url} alt="" className="w-full aspect-square object-cover" />
                    {isActive && (
                      <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <Badge variant="secondary" className="absolute bottom-1 left-1 text-[10px] px-1 py-0">
                      {p.label}
                    </Badge>
                    {!isActive && (
                      <button
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); handleDeletePortrait(p.id, p.media_id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

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
