import heroImage from "@/assets/hero-city.jpg";

const HeroSection = () => {
  return (
    <section className="pt-24">
      {/* Full-width hero image */}
      <div className="w-full h-[70vh] md:h-[85vh] overflow-hidden">
        <img
          src={heroImage}
          alt="Modular city diorama in museum display"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Studio tagline below image */}
      <div className="section-padding py-16 md:py-24">
        <div className="max-w-3xl">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-tight mb-6 animate-fade-in">
            Studio Assembly
          </h1>
          <p 
            className="text-lg md:text-xl text-muted-foreground leading-relaxed animate-fade-in"
            style={{ animationDelay: "0.15s" }}
          >
            A spatial design practice focused on modular cities, recursive systems, 
            and brick-built environments.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;