import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { useCaerholdDistricts } from '@/hooks/caerhold/useCaerholdDistricts';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

export default function CaerholdDistricts() {
  const { data: districts, isLoading } = useCaerholdDistricts();

  return (
    <CaerholdLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold tracking-widest uppercase mb-8">Districts</h1>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading districts...</div>
        ) : districts && districts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {districts.map((d) => (
              <Link
                key={d.id}
                to={`/caerhold/districts/${d.slug}`}
                className="group border border-border bg-card hover:border-primary transition-colors overflow-hidden"
              >
                {d.hero_image_url ? (
                  <div className="aspect-video bg-secondary overflow-hidden">
                    <img src={d.hero_image_url} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="aspect-video bg-secondary/50 flex items-center justify-center">
                    <MapPin className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-lg font-bold tracking-widest uppercase">{d.name}</h2>
                  {d.tagline && <p className="text-sm text-muted-foreground mt-1">{d.tagline}</p>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">No districts yet.</div>
        )}
      </div>
    </CaerholdLayout>
  );
}
