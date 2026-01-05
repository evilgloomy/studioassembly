import Header from "@/components/Header";
import Footer from "@/components/Footer";
import aboutImage from "@/assets/about-builder.jpg";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        {/* Hero Section */}
        <section className="section-padding mb-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Image */}
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={aboutImage}
                  alt="Builder at work"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Text */}
              <div className="space-y-8">
                <h1 className="text-3xl md:text-4xl font-bold tracking-widest uppercase">
                  OUR STORY: BUILT ON PRECISION
                </h1>
                
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  <p>
                    Studio Assembly was founded on a simple belief: adults deserve 
                    construction kits that respect their intelligence and appreciation 
                    for design excellence.
                  </p>
                  <p>
                    We're not making toys. We're designing experiences—meticulously 
                    engineered architectural models that challenge, engage, and ultimately 
                    reward the builder with a display-worthy piece of miniature architecture.
                  </p>
                  <p>
                    Every kit in our collection is developed with the same rigor applied 
                    to real architectural projects: precise scale ratios, considered 
                    proportions, and attention to details that matter.
                  </p>
                </div>

                <div className="pt-4">
                  <p className="font-semibold italic text-lg">
                    "We don't make toys. We design experiences."
                  </p>
                  <p className="text-sm text-muted-foreground mt-3">
                    — The Studio Assembly Team
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="section-padding py-24 bg-secondary">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold tracking-widest uppercase mb-12 text-center">
              OUR PRINCIPLES
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8">
                <h3 className="font-semibold tracking-widest uppercase mb-4">
                  PRECISION FIRST
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every model is designed to exact architectural proportions. 
                  No compromises on scale or accuracy.
                </p>
              </div>
              <div className="text-center p-8 border-x border-primary">
                <h3 className="font-semibold tracking-widest uppercase mb-4">
                  ADULT FOCUSED
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Built for the AFOL community. Complex builds that challenge 
                  and reward experienced builders.
                </p>
              </div>
              <div className="text-center p-8">
                <h3 className="font-semibold tracking-widest uppercase mb-4">
                  DISPLAY WORTHY
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Each kit is designed to be proudly displayed. These aren't 
                  toys—they're architectural statements.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;