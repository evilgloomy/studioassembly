import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { useCaerholdFeed } from '@/hooks/caerhold/useCaerholdPosts';
import { Link } from 'react-router-dom';

export default function CaerholdFeed() {
  const { data: posts, isLoading } = useCaerholdFeed(50);

  return (
    <CaerholdLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold tracking-widest uppercase mb-8">City Feed</h1>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            Loading posts...
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid gap-6 max-w-2xl mx-auto">
            {posts.map((post) => (
              <article key={post.id} className="border border-border bg-card p-6">
                {/* Author */}
                <div className="flex items-center gap-3 mb-4">
                  <Link 
                    to={`/caerhold/residents/${post.resident?.slug}`}
                    className="h-12 w-12 bg-secondary rounded-full flex items-center justify-center text-lg font-medium hover:bg-secondary/80 transition-colors"
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
                      {post.location && (
                        <>
                          {' · '}
                          <Link 
                            to={`/caerhold/locations/${post.location.slug}`}
                            className="hover:underline"
                          >
                            {post.location.name}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Media Grid */}
                {post.media && post.media.length > 0 && (
                  <div className={`grid gap-2 mb-4 ${
                    post.media.length === 1 ? 'grid-cols-1' :
                    post.media.length === 2 ? 'grid-cols-2' :
                    'grid-cols-2'
                  }`}>
                    {post.media.slice(0, 4).map((media, index) => (
                      <div 
                        key={media.id} 
                        className={`relative aspect-square bg-secondary overflow-hidden ${
                          post.media!.length === 3 && index === 0 ? 'row-span-2' : ''
                        }`}
                      >
                        {media.type === 'image' ? (
                          <img 
                            src={media.public_url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video 
                            src={media.public_url} 
                            className="w-full h-full object-cover"
                            controls
                          />
                        )}
                        {post.media!.length > 4 && index === 3 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-bold">
                            +{post.media!.length - 4}
                          </div>
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
                  {post.published_at && new Date(post.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            No posts yet. Check back soon!
          </div>
        )}
      </div>
    </CaerholdLayout>
  );
}
