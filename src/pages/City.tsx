import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import cityWireframe from "@/assets/city-wireframe.jpg";

const City = () => {
  const districts = [
    {
      id: "industrial",
      name: "Industrial District",
      status: "In Development",
      description: "Manufacturing zones, warehouses, and freight infrastructure.",
    },
    {
      id: "central",
      name: "Central Business Zone",
      status: "Planning Phase",
      description: "High-density commercial towers and public plazas.",
    },
    {
      id: "transit",
      name: "Transit Hub",
      status: "Planning Phase",
      description: "Multi-modal transportation infrastructure and stations.",
    },
    {
      id: "residential",
      name: "Residential Blocks",
      status: "Concept",
      description: "Mixed-density housing and neighborhood services.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        {/* Page Header */}
        <section className="section-padding mb-16">
          <div className="max-w-3xl">
            <span className="mono text-muted-foreground block mb-4">Project 001</span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-8">
              The City
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              A long-term urban development exploring density, infrastructure, 
              and architectural realism at minifigure scale.
            </p>
          </div>
        </section>

        {/* Master Plan Image */}
        <section className="section-padding mb-24">
          <div className="max-w-4xl mx-auto">
            <img 
              src={cityWireframe} 
              alt="City master plan wireframe" 
              className="w-full"
            />
            <p className="mono text-muted-foreground mt-4 text-center">
              Master Plan — Current Development Phase
            </p>
          </div>
        </section>

        {/* Districts Grid */}
        <section className="section-padding py-16 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="mono text-muted-foreground mb-12">Districts</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {districts.map((district) => (
                <div key={district.id} className="border-t border-border pt-8">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-serif text-xl">{district.name}</h3>
                    <span className="mono text-muted-foreground text-xs">
                      {district.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {district.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Future Vision */}
        <section className="section-padding py-24 border-t border-border">
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-serif text-2xl md:text-3xl mb-8 leading-relaxed">
              "The city is never finished. It grows, adapts, and evolves—
              one module at a time."
            </p>
            <span className="mono text-muted-foreground">— Studio Assembly</span>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding py-16 border-t border-border text-center">
          <p className="text-muted-foreground mb-8">
            Acquire components for your own urban development.
          </p>
          <Link to="/store" className="text-link mono">
            Visit Store
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default City;