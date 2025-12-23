import { Link } from "react-router-dom";
import cityWireframe from "@/assets/city-wireframe.jpg";

const CitySection = () => {
  return (
    <section className="section-padding py-24 md:py-32 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Wireframe Image */}
          <div className="order-2 lg:order-1">
            <img
              src={cityWireframe}
              alt="City development wireframe"
              className="w-full"
            />
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-4">
              <span className="mono text-muted-foreground">Project 001</span>
              <h2 className="font-serif text-3xl md:text-4xl">The City</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                An ongoing urban development project. Each district is designed as a 
                self-contained module that integrates seamlessly with adjacent zones.
              </p>
              <p className="leading-relaxed">
                Current phases in development include the Industrial District, 
                Central Business Zone, and Transit Hub infrastructure.
              </p>
            </div>

            <div className="pt-4">
              <Link 
                to="/city" 
                className="text-link mono"
              >
                View Development
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CitySection;