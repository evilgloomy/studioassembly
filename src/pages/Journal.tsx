import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Journal = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-widest uppercase mb-6">
              JOURNAL
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto mb-12">
              Stories, insights, and updates from Studio Assembly. 
              Coming soon.
            </p>

            {/* Placeholder Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Journal;