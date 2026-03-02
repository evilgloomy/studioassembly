import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { useCaerholdResidents } from '@/hooks/caerhold/useCaerholdResidents';
import { useCaerholdTagDefinitions, useCaerholdAllTagAssignments } from '@/hooks/caerhold/useCaerholdResidentTags';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';

export default function CaerholdResidents() {
  const [search, setSearch] = useState('');
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const { data: residents, isLoading } = useCaerholdResidents();
  const { data: tagDefinitions } = useCaerholdTagDefinitions();
  const { data: allAssignments } = useCaerholdAllTagAssignments();

  // Build a map: residentId -> tag definitions
  const residentTagsMap = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string; color: string }>>();
    if (!allAssignments || !tagDefinitions) return map;
    const defMap = new Map(tagDefinitions.map(t => [t.id, t]));
    for (const a of allAssignments) {
      const def = defMap.get(a.tag_definition_id);
      if (!def) continue;
      const list = map.get(a.resident_id) || [];
      list.push({ id: def.id, name: def.name, color: def.color });
      map.set(a.resident_id, list);
    }
    return map;
  }, [allAssignments, tagDefinitions]);

  const toggleTag = (tagId: string) => {
    setActiveTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const filteredResidents = useMemo(() => {
    if (!residents) return [];
    return residents.filter(r => {
      const tags = residentTagsMap.get(r.id) || [];
      const searchLower = search.toLowerCase();
      const matchesSearch = !search ||
        r.display_name.toLowerCase().includes(searchLower) ||
        r.handle.toLowerCase().includes(searchLower) ||
        (r.role_title && r.role_title.toLowerCase().includes(searchLower)) ||
        tags.some(t => t.name.toLowerCase().includes(searchLower));
      const matchesTags = activeTagIds.length === 0 ||
        activeTagIds.every(tid => tags.some(t => t.id === tid));
      return matchesSearch && matchesTags;
    });
  }, [residents, search, activeTagIds, residentTagsMap]);

  return (
    <CaerholdLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-widest uppercase">Residents</h1>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search residents or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tag filter chips */}
        {tagDefinitions && tagDefinitions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tagDefinitions.map(tag => {
              const isActive = activeTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? 'border-transparent text-white'
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
                  style={isActive ? { backgroundColor: tag.color } : undefined}
                >
                  {tag.name}
                  {isActive && <X className="h-3 w-3" />}
                </button>
              );
            })}
            {activeTagIds.length > 0 && (
              <button
                onClick={() => setActiveTagIds([])}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            Loading residents...
          </div>
        ) : filteredResidents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResidents.map((resident) => {
              const tags = residentTagsMap.get(resident.id) || [];
              return (
                <Link
                  key={resident.id}
                  to={`/caerhold/residents/${resident.slug}`}
                  className="group border border-border bg-card hover:border-primary transition-colors"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-16 w-16 border border-border overflow-hidden">
                        {(resident as any).avatar_url ? (
                          <AvatarImage
                            src={(resident as any).avatar_url}
                            alt={resident.display_name}
                            className="object-contain scale-[2] origin-center"
                          />
                        ) : null}
                        <AvatarFallback className="text-2xl font-medium">
                          {resident.display_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-lg font-bold">{resident.display_name}</h2>
                        <p className="text-sm text-muted-foreground">{resident.handle}</p>
                      </div>
                    </div>
                    {resident.role_title && (
                      <p className="text-sm text-muted-foreground mb-2">{resident.role_title}</p>
                    )}
                    {resident.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{resident.bio}</p>
                    )}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map(tag => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-[10px] px-2 py-0 border"
                            style={{ borderColor: tag.color, color: tag.color }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            {search || activeTagIds.length > 0 ? 'No residents match your filters.' : 'No residents yet.'}
          </div>
        )}
      </div>
    </CaerholdLayout>
  );
}
