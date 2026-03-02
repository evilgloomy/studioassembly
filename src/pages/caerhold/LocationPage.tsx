import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { useCaerholdLocation } from '@/hooks/caerhold/useCaerholdLocations';
import { useCaerholdLocationPosts } from '@/hooks/caerhold/useCaerholdPosts';
import { useCaerholdLocationOwners } from '@/hooks/caerhold/useCaerholdLocationOwners';
import { useCaerholdLocationMedia } from '@/hooks/caerhold/useCaerholdLocationMedia';
import { useParams, Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { locationTypeLabels } from '@/data/caerhold-constants';
import type { CaerholdLocationType } from '@/types/caerhold';

export default function CaerholdLocationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: location, isLoading: locationLoading } = useCaerholdLocation(slug || '');
  const { data: posts, isLoading: postsLoading } = useCaerholdLocationPosts(location?.id || '', true);
  const { data: owners } = useCaerholdLocationOwners(location?.id || '');
  const { data: locationMedia } = useCaerholdLocationMedia(location?.id || '');

  if (locationLoading) {
    return (
      <CaerholdLayout>
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Loading location...
        </div>
      </CaerholdLayout>
    );
  }

  if (!location) {
    return (
      <CaerholdLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Location Not Found</h1>
          <Link to="/caerhold/locations" className="text-primary hover:underline">
            Back to Locations
          </Link>
        </div>
      </CaerholdLayout>
    );
  }

  const vibeTags = location.vibe_tags || [];
  const signatureItems = location.signature_items || [];
  const visitorTips = location.visitor_tips || [];

  return (
    <CaerholdLayout>
      {/* Hero */}
      {location.hero_image_url ? (
        <div className="relative h-64 md:h-96 overflow-hidden">
          <img src={location.hero_image_url} alt={location.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs tracking-widest uppercase bg-background/50">
                  {locationTypeLabels[location.type]}
                </Badge>
                {location.category && (
                  <Badge variant="secondary" className="text-xs bg-background/50">{location.category}</Badge>
                )}
              </div>
              <h1 className="text-4xl font-bold">{location.name}</h1>
              {location.short_blurb && (
                <p className="text-muted-foreground mt-2 max-w-xl">{location.short_blurb}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-secondary/50 py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center mb-4">
              <MapPin className="h-16 w-16 text-muted-foreground" />
            </div>
            <Badge variant="outline" className="text-xs tracking-widest uppercase mb-2">
              {locationTypeLabels[location.type]}
            </Badge>
            <h1 className="text-4xl font-bold mt-2">{location.name}</h1>
            {location.short_blurb && (
              <p className="text-muted-foreground max-w-xl mx-auto mt-4">{location.short_blurb}</p>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-12">
          {/* Description */}
          {location.description && (
            <section>
              <p className="text-foreground leading-relaxed">{location.description}</p>
            </section>
          )}

          {/* Vibe Tags */}
          {vibeTags.length > 0 && (
            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-3">Vibe</h2>
              <div className="flex flex-wrap gap-2">
                {vibeTags.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </section>
          )}

          {/* Signature Items */}
          {signatureItems.length > 0 && (
            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-3">Signature Items</h2>
              <ul className="space-y-1">
                {signatureItems.map((item, i) => (
                  <li key={i} className="text-foreground">{item}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Visitor Tips */}
          {visitorTips.length > 0 && (
            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-3">Visitor Tips</h2>
              <ul className="space-y-2">
                {visitorTips.map((tip, i) => (
                  <li key={i} className="text-foreground border-l-2 border-primary pl-3">{tip}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Gallery */}
          {locationMedia && locationMedia.length > 1 && (
            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-3">Gallery</h2>
              <div className="grid grid-cols-2 gap-2">
                {locationMedia.map(lm => (
                  <div key={lm.id} className="aspect-square overflow-hidden bg-secondary">
                    <img src={(lm as any).media?.public_url || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Owners */}
          {owners && owners.length > 0 && (
            <section>
              <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-3">Owned By</h2>
              <div className="space-y-3">
                {owners.map(o => (
                  <Link
                    key={o.id}
                    to={`/caerhold/residents/${(o as any).resident?.slug}`}
                    className="flex items-center gap-3 border border-border p-4 hover:border-primary transition-colors"
                  >
                    <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center font-medium">
                      {(o as any).resident?.display_name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="font-medium">{(o as any).resident?.display_name}</div>
                      <div className="text-xs text-muted-foreground">{o.role}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Posts */}
          <section>
            <h2 className="text-xl font-bold tracking-widest uppercase mb-6">Posts from this Location</h2>
            {postsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
            ) : posts && posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <article key={post.id} className="border border-border bg-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Link
                        to={`/caerhold/residents/${post.resident?.slug}`}
                        className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center font-medium hover:bg-secondary/80 transition-colors"
                      >
                        {post.resident?.display_name?.[0] || '?'}
                      </Link>
                      <div>
                        <Link to={`/caerhold/residents/${post.resident?.slug}`} className="font-medium hover:underline">
                          {post.resident?.display_name}
                        </Link>
                        <div className="text-xs text-muted-foreground">{post.resident?.handle}</div>
                      </div>
                    </div>
                    {post.media && post.media.length > 0 && (
                      <div className={`grid gap-2 mb-4 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
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
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">{post.caption}</p>
                    )}
                    <div className="mt-4 text-xs text-muted-foreground">
                      {post.published_at && new Date(post.published_at).toLocaleDateString()}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No posts from this location yet.</div>
            )}
          </section>
        </div>
      </div>
    </CaerholdLayout>
  );
}
