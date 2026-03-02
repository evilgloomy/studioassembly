import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Newspaper, Users, MapPin, Building2, Map } from 'lucide-react';
import { useCaerholdDistricts } from '@/hooks/caerhold/useCaerholdDistricts';
import { useCaerholdResidents } from '@/hooks/caerhold/useCaerholdResidents';
import { useCaerholdLocations } from '@/hooks/caerhold/useCaerholdLocations';
import { useCaerholdSiteSettings } from '@/hooks/caerhold/useCaerholdSiteSettings';
import { useCaerholdFeed } from '@/hooks/caerhold/useCaerholdPosts';
import { useMemo } from 'react';

export default function CaerholdHome() {
  const { data: residents } = useCaerholdResidents();
  const { data: locations } = useCaerholdLocations();
  const { data: districts } = useCaerholdDistricts();
  const { data: settings } = useCaerholdSiteSettings('caerhold_welcome');
  const { data: recentPosts } = useCaerholdFeed(3);

  const featuredDistricts = useMemo(() => {
    if (!districts) return [];
    const ids = settings?.featured_district_ids;
    if (ids && ids.length > 0) {
      return districts.filter((d: any) => ids.includes(d.id));
    }
    return districts.slice(0, 6);
  }, [districts, settings]);

  const stats = [
    { label: 'Residents', count: residents?.length || 0, icon: Users },
    { label: 'Locations', count: locations?.length || 0, icon: MapPin },
    { label: 'Districts', count: districts?.length || 0, icon: Building2 },
  ];

  return (
    <CaerholdLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-secondary to-background py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-widest uppercase mb-6">
            Welcome to Caerhold
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            A city of stories, where every resident has a voice and every corner holds a tale.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="tracking-widest uppercase">
              <Link to="/caerhold/feed">
                <Newspaper className="mr-2 h-5 w-5" />
                View City Feed
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="tracking-widest uppercase">
              <Link to="/caerhold/map">
                <Map className="mr-2 h-5 w-5" />
                Explore Map
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-3xl font-bold">{s.count}</div>
                <div className="text-xs tracking-widest uppercase text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Districts */}
      {featuredDistricts.length > 0 && (
        <section className="py-16 container mx-auto px-4">
          <h2 className="text-2xl font-bold tracking-widest uppercase mb-8 text-center">Districts</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDistricts.map((d: any) => (
              <Link
                key={d.id}
                to={`/caerhold/districts/${d.slug}`}
                className="group border border-border bg-card hover:border-primary transition-colors overflow-hidden"
              >
                {d.hero_image_url ? (
                  <div className="aspect-video bg-secondary overflow-hidden">
                    <img src={d.hero_image_url} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="aspect-video bg-secondary/50 flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-bold tracking-widest uppercase">{d.name}</h3>
                  {d.tagline && <p className="text-sm text-muted-foreground mt-1">{d.tagline}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Stories */}
      {recentPosts && recentPosts.length > 0 && (
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold tracking-widest uppercase mb-8 text-center">Latest Stories</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {recentPosts.map((post: any) => (
                <div key={post.id} className="border border-border bg-card overflow-hidden">
                  {post.media?.[0]?.public_url && (
                    <div className="aspect-video bg-secondary overflow-hidden">
                      <img src={post.media[0].public_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6">
                    {post.resident && (
                      <Link to={`/caerhold/residents/${post.resident.slug}`} className="text-sm font-medium hover:underline">
                        {post.resident.display_name}
                      </Link>
                    )}
                    {post.caption && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{post.caption}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Map Preview */}
      {settings?.map_image_url && (
        <section className="py-16 container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold tracking-widest uppercase mb-8">Explore the City</h2>
          <Link to="/caerhold/map" className="inline-block border border-border hover:border-primary transition-colors overflow-hidden rounded">
            <img src={settings.map_image_url} alt="City Map" className="max-h-64 object-contain" />
          </Link>
          <p className="text-sm text-muted-foreground mt-4">Click to explore the interactive map</p>
        </section>
      )}

      {/* Quick Links */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            <Link to="/caerhold/feed" className="group p-8 bg-card border border-border hover:border-primary transition-colors">
              <Newspaper className="h-10 w-10 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <h3 className="text-lg font-bold tracking-widest uppercase mb-2">City Feed</h3>
              <p className="text-sm text-muted-foreground">See the latest updates and stories.</p>
            </Link>
            <Link to="/caerhold/residents" className="group p-8 bg-card border border-border hover:border-primary transition-colors">
              <Users className="h-10 w-10 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <h3 className="text-lg font-bold tracking-widest uppercase mb-2">Residents</h3>
              <p className="text-sm text-muted-foreground">Meet the characters who call Caerhold home.</p>
            </Link>
            <Link to="/caerhold/locations" className="group p-8 bg-card border border-border hover:border-primary transition-colors">
              <MapPin className="h-10 w-10 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <h3 className="text-lg font-bold tracking-widest uppercase mb-2">Locations</h3>
              <p className="text-sm text-muted-foreground">Discover landmarks, businesses, and hidden gems.</p>
            </Link>
          </div>
        </div>
      </section>
    </CaerholdLayout>
  );
}
