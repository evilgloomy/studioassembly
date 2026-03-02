import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { useCaerholdLocations } from '@/hooks/caerhold/useCaerholdLocations';
import { useCaerholdLocationOwners } from '@/hooks/caerhold/useCaerholdLocationOwners';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { locationTypeLabels } from '@/data/caerhold-constants';
import type { CaerholdLocationType } from '@/types/caerhold';

export default function CaerholdLocations() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CaerholdLocationType | null>(null);
  const { data: locations, isLoading } = useCaerholdLocations();

  const filteredLocations = locations?.filter(l => {
    if (!l.is_published) return false;
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
              <LocationCard key={location.id} location={location} />
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

function LocationCard({ location }: { location: any }) {
  const { data: owners } = useCaerholdLocationOwners(location.id);

  return (
    <Link
      to={`/caerhold/locations/${location.slug}`}
      className="group border border-border bg-card hover:border-primary transition-colors"
    >
      {location.hero_image_url ? (
        <div className="aspect-video overflow-hidden">
          <img src={location.hero_image_url} alt={location.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="aspect-video bg-secondary flex items-center justify-center">
          <MapPin className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="outline" className="text-xs tracking-widest uppercase">
            {locationTypeLabels[location.type as CaerholdLocationType]}
          </Badge>
          {location.category && (
            <Badge variant="secondary" className="text-xs">{location.category}</Badge>
          )}
        </div>
        <h2 className="text-lg font-bold mb-1">{location.name}</h2>
        {location.short_blurb ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{location.short_blurb}</p>
        ) : location.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{location.description}</p>
        ) : null}
        {owners && owners.length > 0 && (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <span>Owned by</span>
            <span className="font-medium text-foreground">
              {(owners[0] as any).resident?.display_name || 'Unknown'}
            </span>
            {owners.length > 1 && <span>+{owners.length - 1}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
