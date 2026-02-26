import { Link } from 'react-router-dom';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePublishedPosts } from '@/hooks/usePosts';
import { format } from 'date-fns';

const Journal = () => {
  const { data: posts, isLoading } = usePublishedPosts();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-16">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold tracking-widest uppercase mb-6">
                JOURNAL
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Stories, insights, and updates from Studio Assembly.
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading posts...
              </div>
            ) : posts?.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-input p-8 text-left">
                    <div className="aspect-video bg-secondary mb-6" />
                    <p className="text-xs text-muted-foreground tracking-wider uppercase mb-2">
                      COMING SOON
                    </p>
                    <h3 className="font-semibold tracking-wide uppercase">
                      Article Title {i}
                    </h3>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts?.map((post) => (
                  <Link
                    key={post.id}
                    to={`/journal/${post.slug}`}
                    className="group border border-input p-0 text-left hover:border-foreground transition-colors"
                  >
                    <div className="aspect-video bg-secondary overflow-hidden">
                      {post.cover_image_url ? (
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <span className="text-xs tracking-widest uppercase">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <p className="text-xs text-muted-foreground tracking-wider uppercase mb-2">
                        {post.published_at 
                          ? format(new Date(post.published_at), 'MMMM d, yyyy')
                          : 'Draft'
                        }
                      </p>
                      <h3 className="font-semibold tracking-wide uppercase mb-2 group-hover:underline">
                        {post.title}
                      </h3>
                      {post.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.summary}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Journal;
