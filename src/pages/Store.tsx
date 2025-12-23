import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";

const products = [
  {
    id: "hvac-unit-04",
    name: "HVAC Industrial Unit 04",
    category: "Rooftop Systems",
    price: 12.00,
    scale: "1:40",
    footprint: "4×4 Studs",
  },
  {
    id: "window-panel-a2",
    name: "Window Panel Assembly A2",
    category: "Facade Elements",
    price: 8.50,
    scale: "1:40",
    footprint: "2×6 Studs",
  },
  {
    id: "utility-box-s1",
    name: "Utility Box Set S1",
    category: "Street Furniture",
    price: 6.00,
    scale: "1:40",
    footprint: "1×2 Studs",
  },
  {
    id: "antenna-array-02",
    name: "Antenna Array 02",
    category: "Rooftop Systems",
    price: 9.00,
    scale: "1:40",
    footprint: "2×2 Studs",
  },
  {
    id: "ventilation-unit-l",
    name: "Ventilation Unit L",
    category: "Industrial",
    price: 15.00,
    scale: "1:40",
    footprint: "6×4 Studs",
  },
  {
    id: "facade-detail-kit",
    name: "Facade Detail Kit",
    category: "Facade Elements",
    price: 18.00,
    scale: "1:40",
    footprint: "Various",
  },
];

const Store = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        {/* Page Header */}
        <section className="section-padding mb-16">
          <div className="max-w-3xl">
            <span className="mono text-muted-foreground block mb-4">Components</span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-8">
              Store
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Precision components designed to integrate with modular city systems. 
              Each piece serves an architectural purpose.
            </p>
          </div>
        </section>

        {/* Products Grid */}
        <section className="section-padding py-16 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Note */}
        <section className="section-padding py-16 border-t border-border">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              All components are sourced from new-condition ABS elements. 
              Digital instruction files included with each purchase. 
              Studio Assembly is not affiliated with the LEGO® Group.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Store;