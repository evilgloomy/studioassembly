import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { useCaerholdResident } from '@/hooks/caerhold/useCaerholdResidents';
import { useCaerholdResidentPosts } from '@/hooks/caerhold/useCaerholdPosts';
import { useCaerholdResidentConnections } from '@/hooks/caerhold/useCaerholdConnections';
import { useCaerholdDistricts } from '@/hooks/caerhold/useCaerholdDistricts';
import { useCaerholdLocations } from '@/hooks/caerhold/useCaerholdLocations';
import { useParams, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useMemo } from 'react';
import type { CaerholdCanonRules } from '@/types/caerhold';
import heroBanner from '@/assets/caerhold-banner.png';
import botanicalLeaves from '@/assets/botanical-leaves.svg';

const TRAIT_COLORS = [
  'hsl(122, 39%, 49%)',  // soft green
  'hsl(174, 59%, 40%)',  // teal
  'hsl(88, 50%, 48%)',   // olive
  'hsl(122, 47%, 33%)',  // forest
  'hsl(158, 42%, 43%)',  // emerald
  'hsl(142, 36%, 52%)',  // sage
];

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

function PostCard({ post }: { post: any }) {
  return (
    <article className="border border-border bg-card p-6">
      {post.media && post.media.length > 0 && (
        <div className={`grid gap-2 mb-4 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.media.slice(0, 4).map((media: any) => (
            <div key={media.id} className="aspect-square bg-secondary overflow-hidden">
              {media.type === 'image' ? (
                <img src={media.public_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <video src={media.public_url} className="w-full h-full object-cover" controls />
              )}
            </div>
          ))}
        </div>
      )}
      {post.caption && (
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{post.caption}</p>
      )}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        {post.location && (
          <>
            <Link to={`/caerhold/locations/${post.location.slug}`} className="hover:underline">
              {post.location.name}
            </Link>
            <span>·</span>
          </>
        )}
        {post.published_at && new Date(post.published_at).toLocaleDateString()}
      </div>
    </article>
  );
}

export default function CaerholdResidentProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { data: resident, isLoading: residentLoading } = useCaerholdResident(slug || '');
  const { data: posts, isLoading: postsLoading } = useCaerholdResidentPosts(resident?.id || '', true);
  const { data: connections } = useCaerholdResidentConnections(resident?.id || '');
  const { data: districts } = useCaerholdDistricts();
  const { data: locations } = useCaerholdLocations();

  const homeDistrict = useMemo(() => {
    if (!resident || !districts || !(resident as any).home_district_id) return null;
    return districts.find((d: any) => d.id === (resident as any).home_district_id) || null;
  }, [resident, districts]);

  const workLocation = useMemo(() => {
    if (!resident || !locations || !(resident as any).primary_work_location_id) return null;
    return locations.find((l: any) => l.id === (resident as any).primary_work_location_id) || null;
  }, [resident, locations]);

  if (residentLoading) {
    return (
      <CaerholdLayout>
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading resident...</div>
      </CaerholdLayout>
    );
  }

  if (!resident) {
    return (
      <CaerholdLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Resident Not Found</h1>
          <Link to="/caerhold/residents" className="text-primary hover:underline">Back to Residents</Link>
        </div>
      </CaerholdLayout>
    );
  }

  const personality = resident.personality as Record<string, any>;
  const loreHooks = resident.lore_hooks as Record<string, any>;
  const canonRules = resident.canon_rules as CaerholdCanonRules;

  const personalityTraits = personality?.traits || personality?.keywords || [];
  const hasPersonality = Array.isArray(personalityTraits) && personalityTraits.length > 0;
  const hasLoreHooks = Object.keys(loreHooks || {}).length > 0;
  const hasCanon = canonRules && (canonRules.backstory || (canonRules.relationships && canonRules.relationships.length > 0));

  return (
    <CaerholdLayout>
      {/* Page-level Botanical Decorations */}
      <img
        src={botanicalLeaves}
        alt=""
        className="absolute bottom-0 left-0 w-[800px] h-[800px] opacity-25 pointer-events-none z-0 hidden lg:block"
      />
      <img
        src={botanicalLeaves}
        alt=""
        className="absolute bottom-0 right-0 w-[800px] h-[800px] opacity-25 pointer-events-none z-0 hidden lg:block scale-x-[-1]"
      />

      {/* Hero Banner */}
      <div
        className="relative w-full h-[360px] bg-secondary overflow-hidden"
        style={{
          backgroundImage: `url(${heroBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
      </div>

      {/* Overlapping Portrait Card */}
      <div className="flex justify-center -mt-44 relative z-10 px-4">
        <div className="rounded-2xl bg-card shadow-lg p-3 border border-border">
          <div className="w-[250px] h-[250px] rounded-xl overflow-hidden">
            {(resident as any).avatar_url ? (
              <img
                src={(resident as any).avatar_url}
                alt={resident.display_name}
                className="w-full h-full object-contain scale-[2] origin-center"
              />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center text-6xl font-bold">
              {resident.display_name[0]}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Identity Block */}
      <div className="text-center mt-6 px-4">
        <h1 className="text-4xl font-bold tracking-wide">{resident.display_name}</h1>
        <p className="text-muted-foreground mt-1">{resident.handle}</p>
        {resident.role_title && (
          <p className="text-sm text-muted-foreground mt-1">{resident.role_title}</p>
        )}
        {resident.is_child && (
          <div className="mt-3">
            <Badge variant="secondary">Young Resident</Badge>
          </div>
        )}
        <div className="mt-4">
          <Link to={`/caerhold/residents/${slug}/chat`}>
            <Button variant="outline" size="sm" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat with {resident.display_name}
            </Button>
          </Link>
        </div>
      </div>

      {/* Lives in / Works at */}
      {(homeDistrict || workLocation) && (
        <div className="max-w-2xl mx-auto mt-6 px-4 flex flex-wrap justify-center gap-4">
          {homeDistrict && (
            <Link to={`/caerhold/districts/${homeDistrict.slug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span className="font-medium">Lives in</span>
              <Badge variant="outline">{homeDistrict.name}</Badge>
            </Link>
          )}
          {workLocation && (
            <Link to={`/caerhold/locations/${workLocation.slug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span className="font-medium">Works at</span>
              <Badge variant="outline">{workLocation.name}</Badge>
            </Link>
          )}
        </div>
      )}

      {/* Bio */}
      {resident.bio && (
        <div className="max-w-2xl mx-auto mt-8 px-4">
          <p className="text-foreground leading-relaxed text-lg text-center">{resident.bio}</p>
        </div>
      )}

      {/* Connections */}
      {connections && connections.length > 0 && (
        <div className="max-w-2xl mx-auto mt-8 px-4">
          <DetailCard title="Connections">
            <div className="flex flex-wrap gap-3">
              {connections.map((conn: any) => (
                <Link
                  key={conn.id}
                  to={`/caerhold/residents/${conn.connected_resident?.slug}`}
                  className="inline-flex items-center gap-2 border border-border rounded-full px-3 py-1.5 hover:border-primary transition-colors"
                >
                  <Avatar className="h-6 w-6">
                    {conn.connected_resident?.avatar_url && (
                      <AvatarImage src={conn.connected_resident.avatar_url} className="object-contain scale-[2] origin-center" />
                    )}
                    <AvatarFallback className="text-xs">{conn.connected_resident?.display_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{conn.connected_resident?.display_name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{conn.relation_type}</Badge>
                </Link>
              ))}
            </div>
          </DetailCard>
        </div>
      )}

      {/* Detail Cards */}
      {(hasPersonality || hasLoreHooks || hasCanon) && (
        <div className="max-w-2xl mx-auto mt-10 px-4 grid gap-4 sm:grid-cols-2">
          {hasPersonality && (
            <DetailCard title="Personality">
              <div className="flex flex-wrap gap-2">
                {personalityTraits.map((trait: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: TRAIT_COLORS[i % TRAIT_COLORS.length] }}
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </DetailCard>
          )}

          {hasCanon && canonRules.backstory && (
            <DetailCard title="Backstory">
              <p className="text-sm text-muted-foreground leading-relaxed">{canonRules.backstory}</p>
            </DetailCard>
          )}

          {hasCanon && canonRules.relationships && canonRules.relationships.length > 0 && (
            <DetailCard title="Relationships">
              <ul className="space-y-1">
                {canonRules.relationships.map((rel, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {rel}</li>
                ))}
              </ul>
            </DetailCard>
          )}

          {hasLoreHooks && (
            <DetailCard title="Lore">
              <ul className="space-y-1">
                {Object.entries(loreHooks).map(([key, value]) => (
                  <li key={key} className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{key}:</span> {String(value)}
                  </li>
                ))}
              </ul>
            </DetailCard>
          )}
        </div>
      )}

      {/* Posts */}
      <div className="max-w-2xl mx-auto mt-12 px-4 pb-12">
        <div className="divider mb-8" />
        <h2 className="text-xl font-bold tracking-widest uppercase mb-6">Posts</h2>

        {postsLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No posts yet.</div>
        )}
      </div>
    </CaerholdLayout>
  );
}
