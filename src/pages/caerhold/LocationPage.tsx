import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { useCaerholdLocation } from '@/hooks/caerhold/useCaerholdLocations';
import { useCaerholdLocationPosts } from '@/hooks/caerhold/useCaerholdPosts';
import { useParams, Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { CaerholdLocationType } from '@/types/caerhold';

const locationTypeLabels: Record<CaerholdLocationType, string> = {
  landmark: 'Landmark',
  business: 'Business',
  residence: 'Residence',
  street: 'Street',
  park: 'Park',
};

export default function CaerholdLocationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: location, isLoading: locationLoading } = useCaerholdLocation(slug || '');
  const { data: posts, isLoading: postsLoading } = useCaerholdLocationPosts(location?.id || '', true);

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

  return (
    <CaerholdLayout>
      {/* Hero */}
      <div className="bg-secondary/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <MapPin className="h-16 w-16 text-muted-foreground" />
          </div>
          <span className="text-xs tracking-widest uppercase text-muted-foreground">
            {locationTypeLabels[location.type]}
          </span>
          <h1 className="text-4xl font-bold mt-2">{location.name}</h1>
          {location.description && (
            <p className="text-muted-foreground max-w-xl mx-auto mt-4 leading-relaxed">
              {location.description}
            </p>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold tracking-widest uppercase mb-6">Posts from this Location</h2>
          
          {postsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading posts...
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <article key={post.id} className="border border-border bg-card p-6">
                  {/* Author */}
                  <div className="flex items-center gap-3 mb-4">
                    <Link 
                      to={`/caerhold/residents/${post.resident?.slug}`}
                      className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center font-medium hover:bg-secondary/80 transition-colors"
                    >
                      {post.resident?.display_name?.[0] || '?'}
                    </Link>
                    <div>
                      <Link 
                        to={`/caerhold/residents/${post.resident?.slug}`}
                        className="font-medium hover:underline"
                      >
                        {post.resident?.display_name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {post.resident?.handle}
                      </div>
                    </div>
                  </div>

                  {/* Media Grid */}
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

                  {/* Caption */}
                  {post.caption && (
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {post.caption}
                    </p>
                  )}

                  {/* Timestamp */}
                  <div className="mt-4 text-xs text-muted-foreground">
                    {post.published_at && new Date(post.published_at).toLocaleDateString()}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No posts from this location yet.
            </div>
          )}
        </div>
      </div>
    </CaerholdLayout>
  );
}
