import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const Process = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        {/* Page Header */}
        <section className="section-padding mb-24">
          <div className="max-w-3xl">
            <span className="mono text-muted-foreground block mb-4">About</span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-8">
              Process
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Every component begins as a problem to solve—a gap in the urban fabric 
              that demands a precise solution.
            </p>
          </div>
        </section>

        {/* Process Steps */}
        <section className="section-padding py-16 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
              <div className="space-y-4">
                <span className="mono text-muted-foreground">01</span>
                <h3 className="font-serif text-xl">Research</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We study real-world infrastructure, architectural patterns, and urban 
                  systems to inform every design decision.
                </p>
              </div>

              <div className="space-y-4">
                <span className="mono text-muted-foreground">02</span>
                <h3 className="font-serif text-xl">Design</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Digital modeling ensures each component meets our modular standards 
                  before physical production begins.
                </p>
              </div>

              <div className="space-y-4">
                <span className="mono text-muted-foreground">03</span>
                <h3 className="font-serif text-xl">Integration</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Every piece is tested within larger city systems to ensure seamless 
                  compatibility with existing districts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy */}
        <section className="section-padding py-24 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl mb-12">Philosophy</h2>
            <div className="space-y-8 text-muted-foreground leading-relaxed">
              <p>
                The brick is merely a medium. What we build are systems—recursive, 
                modular, infinitely expandable. Each component is designed not as an 
                isolated object, but as part of a larger urban ecosystem.
              </p>
              <p>
                We reject the notion of "playsets" in favor of architectural components. 
                A window is specified by its scale, material finish, and mounting system—
                not by which franchise it represents.
              </p>
              <p>
                This is not nostalgia. This is precision.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding py-24 border-t border-border text-center">
          <div className="max-w-xl mx-auto">
            <p className="text-muted-foreground mb-8">
              Explore our ongoing urban development project.
            </p>
            <Link to="/city" className="text-link mono">
              View The City
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Process;