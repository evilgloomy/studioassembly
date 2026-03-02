import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { useCaerholdSiteSettings } from '@/hooks/caerhold/useCaerholdSiteSettings';
import { useCaerholdDistricts } from '@/hooks/caerhold/useCaerholdDistricts';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

export default function CaerholdMap() {
  const { data: settings } = useCaerholdSiteSettings('caerhold_welcome');
  const { data: districts } = useCaerholdDistricts();
  const navigate = useNavigate();

  const mapImageUrl = settings?.map_image_url;
  const districtsWithHotspots = (districts || []).filter((d: any) => d.map_hotspot?.type === 'rect');

  return (
    <CaerholdLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold tracking-widest uppercase mb-8">City Map</h1>

        {mapImageUrl ? (
          <div className="relative w-full max-w-4xl mx-auto">
            <img src={mapImageUrl} alt="Map of Caerhold" className="w-full h-auto" />
            {districtsWithHotspots.map((d: any) => {
              const hs = d.map_hotspot;
              return (
                <button
                  key={d.id}
                  onClick={() => navigate(`/caerhold/districts/${d.slug}`)}
                  className="absolute border-2 border-primary/50 hover:border-primary hover:bg-primary/10 transition-colors cursor-pointer rounded group"
                  style={{
                    left: `${hs.x * 100}%`,
                    top: `${hs.y * 100}%`,
                    width: `${hs.w * 100}%`,
                    height: `${hs.h * 100}%`,
                  }}
                  title={d.name}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-card border border-border px-2 py-0.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 text-muted-foreground">
            <MapPin className="h-16 w-16 mx-auto mb-4" />
            <p>Map image not configured yet.</p>
            <p className="text-sm mt-1">An admin can set the map image in the Welcome Config panel.</p>
          </div>
        )}
      </div>
    </CaerholdLayout>
  );
}
