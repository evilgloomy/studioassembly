import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { useCaerholdResident } from '@/hooks/caerhold/useCaerholdResidents';
import { useCaerholdResidentPosts } from '@/hooks/caerhold/useCaerholdPosts';
import { useParams, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import type { CaerholdCanonRules } from '@/types/caerhold';

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-card p-6">
      <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function CaerholdResidentProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { data: resident, isLoading: residentLoading } = useCaerholdResident(slug || '');
  const { data: posts, isLoading: postsLoading } = useCaerholdResidentPosts(resident?.id || '', true);

  if (residentLoading) {
    return (
      <CaerholdLayout>
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Loading resident...
        </div>
      </CaerholdLayout>
    );
  }

  if (!resident) {
    return (
      <CaerholdLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Resident Not Found</h1>
          <Link to="/caerhold/residents" className="text-primary hover:underline">
            Back to Residents
          </Link>
        </div>
      </CaerholdLayout>
    );
  }

  const personality = resident.personality as Record<string, any>;
  const loreHooks = resident.lore_hooks as Record<string, any>;
  const canonRules = resident.canon_rules as CaerholdCanonRules;
  const portraits = (resident as any).portraits || [];

  const personalityTraits = personality?.traits || personality?.keywords || [];
  const hasPersonality = Array.isArray(personalityTraits) && personalityTraits.length > 0;
  const hasLoreHooks = Object.keys(loreHooks || {}).length > 0;
  const hasCanon = canonRules && (canonRules.backstory || (canonRules.relationships && canonRules.relationships.length > 0));

  return (
    <CaerholdLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section — Centered portrait + name */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          {(resident as any).avatar_url ? (
            <img
              src={(resident as any).avatar_url}
              alt={resident.display_name}
              className="w-72 h-72 object-contain mx-auto mb-6"
            />
          ) : (
            <div className="w-72 h-72 bg-secondary flex items-center justify-center text-6xl font-bold mx-auto mb-6">
              {resident.display_name[0]}
            </div>
          )}

          <h1 className="text-4xl font-bold tracking-wide">{resident.display_name}</h1>
          <p className="text-muted-foreground mt-1">{resident.handle}</p>
          {resident.role_title && (
            <p className="text-sm text-muted-foreground mt-1">{resident.role_title}</p>
          )}
          <div className="flex items-center justify-center gap-2 mt-3">
            {resident.is_child && (
              <Badge variant="secondary">Young Resident</Badge>
            )}
          </div>
        </div>

        {/* Bio */}
        {resident.bio && (
          <div className="max-w-2xl mx-auto mb-12">
            <p className="text-foreground leading-relaxed text-lg">{resident.bio}</p>
          </div>
        )}

        {/* Portrait Gallery */}
        {portraits.length > 1 && (
          <div className="max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4">Portraits</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {portraits.map((p: any) => (
                <div key={p.id} className="border border-border overflow-hidden">
                  <img src={p.public_url} alt={p.label} className="w-full aspect-square object-contain bg-secondary" />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground text-center py-1">{p.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detail Sections */}
        {(hasPersonality || hasLoreHooks || hasCanon) && (
          <div className="max-w-2xl mx-auto mb-12 grid gap-4 sm:grid-cols-2">
            {hasPersonality && (
              <DetailSection title="Personality">
                <div className="flex flex-wrap gap-2">
                  {personalityTraits.map((trait: string, i: number) => (
                    <Badge key={i} variant="outline">{trait}</Badge>
                  ))}
                </div>
              </DetailSection>
            )}

            {hasCanon && canonRules.backstory && (
              <DetailSection title="Backstory">
                <p className="text-sm text-muted-foreground leading-relaxed">{canonRules.backstory}</p>
              </DetailSection>
            )}

            {hasCanon && canonRules.relationships && canonRules.relationships.length > 0 && (
              <DetailSection title="Relationships">
                <ul className="space-y-1">
                  {canonRules.relationships.map((rel, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {rel}</li>
                  ))}
                </ul>
              </DetailSection>
            )}

            {hasLoreHooks && (
              <DetailSection title="Lore">
                <ul className="space-y-1">
                  {Object.entries(loreHooks).map(([key, value]) => (
                    <li key={key} className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{key}:</span> {String(value)}
                    </li>
                  ))}
                </ul>
              </DetailSection>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="divider" />
        </div>

        {/* Posts */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold tracking-widest uppercase mb-6">Posts</h2>
          
          {postsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading posts...
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <article key={post.id} className="border border-border bg-card p-6">
                  {post.media && post.media.length > 0 && (
                    <div className={`grid gap-2 mb-4 ${
                      post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                    }`}>
                      {post.media.slice(0, 4).map((media) => (
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
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {post.caption}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    {post.location && (
                      <>
                        <Link 
                          to={`/caerhold/locations/${post.location.slug}`}
                          className="hover:underline"
                        >
                          {post.location.name}
                        </Link>
                        <span>·</span>
                      </>
                    )}
                    {post.published_at && new Date(post.published_at).toLocaleDateString()}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No posts yet.
            </div>
          )}
        </div>
      </div>
    </CaerholdLayout>
  );
}
