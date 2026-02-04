import { CaerholdLayout } from '@/components/caerhold/CaerholdLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Newspaper, Users, MapPin } from 'lucide-react';

export default function CaerholdHome() {
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
            Explore the streets, meet the people, and discover what makes our community unique.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="tracking-widest uppercase">
              <Link to="/caerhold/feed">
                <Newspaper className="mr-2 h-5 w-5" />
                View City Feed
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="tracking-widest uppercase">
              <Link to="/caerhold/residents">
                <Users className="mr-2 h-5 w-5" />
                Meet Residents
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-widest uppercase mb-4">
              A Brief History
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Caerhold was founded centuries ago at the confluence of three rivers, 
              growing from a small trading post into the vibrant city it is today. 
              The name derives from the ancient words for "fortress by the water."
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Today, Caerhold is home to artisans, scholars, merchants, and dreamers 
              from all walks of life. Our diverse community is united by a shared 
              appreciation for craft, culture, and connection.
            </p>
          </div>
          <div className="bg-secondary/50 aspect-video rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground tracking-widest uppercase">
              City Illustration
            </span>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold tracking-widest uppercase mb-8 text-center">
            Explore the City
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link 
              to="/caerhold/feed" 
              className="group p-8 bg-card border border-border hover:border-primary transition-colors"
            >
              <Newspaper className="h-10 w-10 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <h3 className="text-lg font-bold tracking-widest uppercase mb-2">City Feed</h3>
              <p className="text-sm text-muted-foreground">
                See the latest updates and stories from Caerhold's residents.
              </p>
            </Link>
            <Link 
              to="/caerhold/residents" 
              className="group p-8 bg-card border border-border hover:border-primary transition-colors"
            >
              <Users className="h-10 w-10 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <h3 className="text-lg font-bold tracking-widest uppercase mb-2">Residents</h3>
              <p className="text-sm text-muted-foreground">
                Meet the diverse characters who call Caerhold home.
              </p>
            </Link>
            <Link 
              to="/caerhold/locations" 
              className="group p-8 bg-card border border-border hover:border-primary transition-colors"
            >
              <MapPin className="h-10 w-10 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <h3 className="text-lg font-bold tracking-widest uppercase mb-2">Locations</h3>
              <p className="text-sm text-muted-foreground">
                Discover landmarks, businesses, and hidden gems across the city.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </CaerholdLayout>
  );
}
