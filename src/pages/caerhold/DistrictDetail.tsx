import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { useCaerholdDistrict } from '@/hooks/caerhold/useCaerholdDistricts';
import { useCaerholdLocations } from '@/hooks/caerhold/useCaerholdLocations';
import { useCaerholdResidents } from '@/hooks/caerhold/useCaerholdResidents';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import type { CaerholdLocationType } from '@/types/caerhold';

const locationTypeLabels: Record<CaerholdLocationType, string> = {
  landmark: 'Landmark', business: 'Business', residence: 'Residence', street: 'Street', park: 'Park',
};

export default function CaerholdDistrictDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: district, isLoading } = useCaerholdDistrict(slug || '');
  const { data: allLocations } = useCaerholdLocations();
  const { data: allResidents } = useCaerholdResidents();

  const locations = useMemo(() => {
    if (!district || !allLocations) return [];
    return allLocations.filter((l: any) => l.district_id === district.id);
  }, [district, allLocations]);

  const residents = useMemo(() => {
    if (!district || !allResidents) return [];
    return allResidents.filter((r: any) => r.home_district_id === district.id);
  }, [district, allResidents]);

  if (isLoading) {
    return <CaerholdLayout><div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading...</div></CaerholdLayout>;
  }

  if (!district) {
    return (
      <CaerholdLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">District Not Found</h1>
          <Link to="/caerhold/districts" className="text-primary hover:underline">Back to Districts</Link>
        </div>
      </CaerholdLayout>
    );
  }

  return (
    <CaerholdLayout>
      {/* Hero */}
      <div className="relative">
        {district.hero_image_url ? (
          <div className="h-[300px] bg-secondary overflow-hidden">
            <img src={district.hero_image_url} alt={district.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-background/40" />
          </div>
        ) : (
          <div className="h-[200px] bg-secondary/50" />
        )}
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-8">
            <h1 className="text-4xl font-bold tracking-widest uppercase text-foreground">{district.name}</h1>
            {district.tagline && <p className="text-lg text-muted-foreground mt-2">{district.tagline}</p>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-12">
        {district.description && (
          <p className="text-foreground leading-relaxed max-w-2xl">{district.description}</p>
        )}

        {/* Locations */}
        <section>
          <h2 className="text-xl font-bold tracking-widest uppercase mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Locations
          </h2>
          {locations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((loc: any) => (
                <Link
                  key={loc.id}
                  to={`/caerhold/locations/${loc.slug}`}
                  className="border border-border bg-card p-6 hover:border-primary transition-colors"
                >
                  <Badge variant="outline" className="tracking-widest uppercase mb-2">{locationTypeLabels[loc.type as CaerholdLocationType]}</Badge>
                  <h3 className="font-bold">{loc.name}</h3>
                  {loc.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{loc.description}</p>}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">More locations coming soon.</p>
          )}
        </section>

        {/* Residents */}
        <section>
          <h2 className="text-xl font-bold tracking-widest uppercase mb-6 flex items-center gap-2">
            <Users className="h-5 w-5" /> Residents
          </h2>
          {residents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {residents.map((r: any) => (
                <Link
                  key={r.id}
                  to={`/caerhold/residents/${r.slug}`}
                  className="border border-border bg-card p-6 hover:border-primary transition-colors"
                >
                  <h3 className="font-bold">{r.display_name}</h3>
                  <p className="text-sm text-muted-foreground">{r.handle}</p>
                  {r.role_title && <p className="text-sm text-muted-foreground mt-1">{r.role_title}</p>}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">More residents coming soon.</p>
          )}
        </section>
      </div>
    </CaerholdLayout>
  );
}
