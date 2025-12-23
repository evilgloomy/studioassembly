import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        {/* Page Header */}
        <section className="section-padding mb-24">
          <div className="max-w-3xl">
            <span className="mono text-muted-foreground block mb-4">Connect</span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-8">
              Contact
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              For inquiries regarding custom commissions, collaborations, 
              or component specifications.
            </p>
          </div>
        </section>

        {/* Contact Info */}
        <section className="section-padding py-16 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-4">
                <h2 className="mono text-muted-foreground">General Inquiries</h2>
                <a 
                  href="mailto:hello@studioassembly.ca" 
                  className="text-link block text-lg"
                >
                  hello@studioassembly.ca
                </a>
              </div>

              <div className="space-y-4">
                <h2 className="mono text-muted-foreground">Location</h2>
                <p className="text-muted-foreground">
                  Based in Canada<br />
                  Remote Studio
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Commission Note */}
        <section className="section-padding py-24 border-t border-border">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-serif text-2xl mb-8">Custom Commissions</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Studio Assembly accepts select custom commissions for architectural 
              components and district modules. Each project is evaluated based on 
              complexity, scale, and alignment with our design philosophy.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              For commission inquiries, please include project scope, reference 
              imagery, and timeline requirements.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;