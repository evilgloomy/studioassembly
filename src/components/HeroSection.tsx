import { Link } from "react-router-dom";
import productHero from "@/assets/product-hero.jpg";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center pt-20 section-padding">
      <div className="max-w-6xl mx-auto text-center">
        {/* Hero Image */}
        <div className="mb-12 animate-fade-in">
          <img
            src={productHero}
            alt="Modern Architectural Brick Kit"
            className="w-full max-w-2xl mx-auto h-auto object-contain"
          />
        </div>

        {/* Headline */}
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider uppercase mb-6 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          ARCHITECTURE IN MINIATURE.
        </h1>

        {/* Subheadline */}
        <p 
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          Curated construction kits for the modern builder.
        </p>

        {/* CTA Button */}
        <div 
          className="animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <Link
            to="/shop"
            className="btn-gold inline-block text-sm"
          >
            VIEW COLLECTION
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;