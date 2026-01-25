import { useParams, Link } from 'react-router-dom';
import { usePostBySlug } from '@/hooks/usePosts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

export default function JournalPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = usePostBySlug(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-24">
          <div className="section-padding">
            <div className="max-w-3xl mx-auto text-center">
              <div className="text-muted-foreground tracking-widest uppercase text-sm">
                Loading...
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-24">
          <div className="section-padding">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-2xl font-bold tracking-widest uppercase mb-4">
                Post Not Found
              </h1>
              <p className="text-muted-foreground mb-8">
                The post you're looking for doesn't exist or has been removed.
              </p>
              <Link
                to="/journal"
                className="inline-flex items-center text-sm tracking-widest uppercase hover:underline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Journal
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        <article className="section-padding">
          <div className="max-w-3xl mx-auto">
            {/* Back Link */}
            <Link
              to="/journal"
              className="inline-flex items-center text-sm text-muted-foreground tracking-widest uppercase hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Journal
            </Link>

            {/* Cover Image */}
            {post.cover_image_url && (
              <div className="aspect-video bg-secondary mb-8 overflow-hidden">
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Header */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold tracking-widest uppercase mb-4">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {post.author_profile?.display_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{post.author_profile.display_name}</span>
                  </div>
                )}
                {post.published_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={post.published_at}>
                      {format(new Date(post.published_at), 'MMMM d, yyyy')}
                    </time>
                  </div>
                )}
              </div>

              {post.summary && (
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  {post.summary}
                </p>
              )}
            </header>

            {/* Content */}
            <div className="prose prose-neutral max-w-none">
              <ReactMarkdown
                components={{
                  img: ({ src, alt }) => (
                    <img
                      src={src}
                      alt={alt || 'Image'}
                      className="w-full h-auto my-6"
                      loading="lazy"
                    />
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-relaxed">{children}</p>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold tracking-widest uppercase mt-8 mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold tracking-widest uppercase mt-8 mb-4">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-bold tracking-widest uppercase mt-6 mb-3">{children}</h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic my-4">{children}</blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} className="underline hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>
                  ),
                }}
              >
                {post.content || ''}
              </ReactMarkdown>
            </div>

            {/* Footer */}
            <footer className="mt-12 pt-8 border-t border-input">
              <Link
                to="/journal"
                className="inline-flex items-center text-sm tracking-widest uppercase hover:underline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                More from the Journal
              </Link>
            </footer>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
