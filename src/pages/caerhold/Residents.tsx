import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { useCaerholdResidents } from '@/hooks/caerhold/useCaerholdResidents';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search } from 'lucide-react';

export default function CaerholdResidents() {
  const [search, setSearch] = useState('');
  const { data: residents, isLoading } = useCaerholdResidents();

  const filteredResidents = residents?.filter(r =>
    r.display_name.toLowerCase().includes(search.toLowerCase()) ||
    r.handle.toLowerCase().includes(search.toLowerCase()) ||
    (r.role_title && r.role_title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <CaerholdLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold tracking-widest uppercase">Residents</h1>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search residents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            Loading residents...
          </div>
        ) : filteredResidents && filteredResidents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResidents.map((resident) => (
              <Link
                key={resident.id}
                to={`/caerhold/residents/${resident.slug}`}
                className="group border border-border bg-card hover:border-primary transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center text-2xl font-medium group-hover:bg-secondary/80 transition-colors">
                      {resident.display_name[0]}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{resident.display_name}</h2>
                      <p className="text-sm text-muted-foreground">{resident.handle}</p>
                    </div>
                  </div>
                  {resident.role_title && (
                    <p className="text-sm text-muted-foreground mb-2">{resident.role_title}</p>
                  )}
                  {resident.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{resident.bio}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            {search ? 'No residents match your search.' : 'No residents yet.'}
          </div>
        )}
      </div>
    </CaerholdLayout>
  );
}
