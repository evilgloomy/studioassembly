import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { useCaerholdLocations } from '@/hooks/caerhold/useCaerholdLocations';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import type { CaerholdLocationType } from '@/types/caerhold';

const locationTypeLabels: Record<CaerholdLocationType, string> = {
  landmark: 'Landmark',
  business: 'Business',
  residence: 'Residence',
  street: 'Street',
  park: 'Park',
};

export default function CaerholdLocations() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CaerholdLocationType | null>(null);
  const { data: locations, isLoading } = useCaerholdLocations();

  const filteredLocations = locations?.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.description && l.description.toLowerCase().includes(search.toLowerCase()));
    const matchesType = !typeFilter || l.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <CaerholdLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold tracking-widest uppercase">Locations</h1>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={typeFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter(null)}
            className="tracking-widest uppercase"
          >
            All
          </Button>
          {Object.entries(locationTypeLabels).map(([value, label]) => (
            <Button
              key={value}
              variant={typeFilter === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(value as CaerholdLocationType)}
              className="tracking-widest uppercase"
            >
              {label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            Loading locations...
          </div>
        ) : filteredLocations && filteredLocations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <Link
                key={location.id}
                to={`/caerhold/locations/${location.slug}`}
                className="group border border-border bg-card hover:border-primary transition-colors"
              >
                <div className="aspect-video bg-secondary flex items-center justify-center">
                  <MapPin className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs tracking-widest uppercase text-muted-foreground">
                      {locationTypeLabels[location.type]}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold mb-2">{location.name}</h2>
                  {location.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {location.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            {search || typeFilter ? 'No locations match your filters.' : 'No locations yet.'}
          </div>
        )}
      </div>
    </CaerholdLayout>
  );
}
