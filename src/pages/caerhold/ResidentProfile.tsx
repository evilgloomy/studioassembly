import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { useCaerholdResident } from '@/hooks/caerhold/useCaerholdResidents';
import { useCaerholdResidentPosts } from '@/hooks/caerhold/useCaerholdPosts';
import { useParams, Link } from 'react-router-dom';

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

  return (
    <CaerholdLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex items-center gap-6 mb-6">
            <div className="h-24 w-24 bg-secondary rounded-full flex items-center justify-center text-4xl font-medium">
              {resident.display_name[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{resident.display_name}</h1>
              <p className="text-muted-foreground">{resident.handle}</p>
              {resident.role_title && (
                <p className="text-sm text-muted-foreground mt-1">{resident.role_title}</p>
              )}
            </div>
          </div>
          {resident.bio && (
            <p className="text-muted-foreground leading-relaxed">{resident.bio}</p>
          )}
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

                  {/* Location & Timestamp */}
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
