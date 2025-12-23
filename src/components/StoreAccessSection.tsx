import { Link } from "react-router-dom";

const StoreAccessSection = () => {
  return (
    <section className="section-padding py-32 md:py-48 border-t border-border">
      <div className="max-w-2xl mx-auto text-center">
        <span className="mono text-muted-foreground block mb-8">Components</span>
        
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-8">
          Acquire architectural elements
        </h2>
        
        <p className="text-muted-foreground leading-relaxed mb-12 max-w-lg mx-auto">
          Precision components designed to integrate with modular city systems. 
          Each piece serves an architectural purpose.
        </p>
        
        <Link 
          to="/store" 
          className="text-link mono"
        >
          Visit Store
        </Link>
      </div>
    </section>
  );
};

export default StoreAccessSection;