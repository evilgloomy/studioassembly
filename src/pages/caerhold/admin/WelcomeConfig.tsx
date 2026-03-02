import { useState, useEffect } from 'react';
import { useCaerholdSiteSettings, useUpdateCaerholdSiteSettings } from '@/hooks/caerhold/useCaerholdSiteSettings';
import { useCaerholdDistricts } from '@/hooks/caerhold/useCaerholdDistricts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WelcomeConfig() {
  const { data: settings, isLoading } = useCaerholdSiteSettings('caerhold_welcome');
  const { data: districts } = useCaerholdDistricts(false);
  const updateMutation = useUpdateCaerholdSiteSettings();
  const { toast } = useToast();

  const [featuredDistrictIds, setFeaturedDistrictIds] = useState<string[]>([]);
  const [mapImageUrl, setMapImageUrl] = useState('');

  useEffect(() => {
    if (settings) {
      setFeaturedDistrictIds(settings.featured_district_ids || []);
      setMapImageUrl(settings.map_image_url || '');
    }
  }, [settings]);

  const toggleDistrict = (id: string) => {
    setFeaturedDistrictIds(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        key: 'caerhold_welcome',
        value: {
          featured_district_ids: featuredDistrictIds,
          map_image_url: mapImageUrl,
        },
      });
      toast({ title: 'Welcome config saved' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  if (isLoading) return <div className="text-center py-16 text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-widest uppercase">Welcome Page Config</h1>

      <section className="space-y-4 border border-border p-6">
        <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Featured Districts</h2>
        <p className="text-xs text-muted-foreground">Select districts to feature on the welcome page.</p>
        <div className="flex flex-wrap gap-2">
          {(districts || []).map(d => {
            const active = featuredDistrictIds.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggleDistrict(d.id)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-foreground'
                }`}
              >
                {d.name}
                {active && <X className="h-3 w-3" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4 border border-border p-6">
        <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Map Image</h2>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase">Map Image URL</Label>
          <Input value={mapImageUrl} onChange={e => setMapImageUrl(e.target.value)} placeholder="https://..." />
        </div>
        {mapImageUrl && (
          <img src={mapImageUrl} alt="Map preview" className="max-h-48 rounded border border-border object-contain" />
        )}
      </section>

      <Button onClick={handleSave} disabled={updateMutation.isPending}>
        <Save className="mr-2 h-4 w-4" />
        {updateMutation.isPending ? 'Saving...' : 'Save Config'}
      </Button>
    </div>
  );
}
