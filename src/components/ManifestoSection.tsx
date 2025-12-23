import { Link } from "react-router-dom";

const ManifestoSection = () => {
  return (
    <section className="section-padding py-24 md:py-32 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          {/* System */}
          <div className="space-y-6">
            <h2 className="mono text-muted-foreground">System</h2>
            <p className="font-serif text-2xl md:text-3xl leading-relaxed">
              We do not sell sets; we architect systems.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our work bridges the gap between digital design and physical assembly, 
              creating modular components that allow for city-scale environments.
            </p>
            <Link 
              to="/process" 
              className="inline-block text-link mono mt-4"
            >
              View Process
            </Link>
          </div>

          {/* Archive */}
          <div className="space-y-6">
            <h2 className="mono text-muted-foreground">Archive</h2>
            <p className="font-serif text-2xl md:text-3xl leading-relaxed">
              The City is a living project.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              A long-term urban model exploring density, infrastructure, and realism 
              through the medium of the brick.
            </p>
            <Link 
              to="/city" 
              className="inline-block text-link mono mt-4"
            >
              Enter Archive
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManifestoSection;