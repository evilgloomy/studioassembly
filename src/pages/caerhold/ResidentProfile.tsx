import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { useCaerholdResident } from '@/hooks/caerhold/useCaerholdResidents';
import { useCaerholdResidentPosts } from '@/hooks/caerhold/useCaerholdPosts';
import { useParams, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import type { CaerholdCanonRules } from '@/types/caerhold';
import heroBanner from '@/assets/caerhold-banner.png';
import botanicalLeft from '@/assets/botanical-left.png';
import botanicalRight from '@/assets/botanical-right.png';

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
      </div>

      {/* Bio with Botanical Decorations */}
      {resident.bio && (
        <div className="relative max-w-2xl mx-auto mt-8 px-4">
          <img
            src={botanicalLeft}
            alt=""
            className="absolute -left-16 top-1/2 -translate-y-1/2 w-32 h-32 opacity-30 pointer-events-none hidden lg:block"
          />
          <img
            src={botanicalRight}
            alt=""
            className="absolute -right-16 top-1/2 -translate-y-1/2 w-32 h-32 opacity-30 pointer-events-none hidden lg:block"
          />
          <p className="text-foreground leading-relaxed text-lg text-center">{resident.bio}</p>
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
