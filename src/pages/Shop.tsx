import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import productModernApt from "@/assets/product-modern-apt.jpg";
import productHero from "@/assets/product-hero.jpg";

const products = [
  {
    id: "modern-apartment-ground",
    name: "Modern Apartment - Ground",
    pieces: 1400,
    price: 189,
    image: productModernApt,
  },
  {
    id: "urban-loft-series",
    name: "Urban Loft Series",
    pieces: 980,
    price: 149,
    image: productHero,
  },
  {
    id: "corner-cafe",
    name: "Corner Café",
    pieces: 720,
    price: 119,
    image: productModernApt,
  },
  {
    id: "brutalist-tower",
    name: "Brutalist Tower",
    pieces: 2100,
    price: 249,
    image: productHero,
  },
  {
    id: "mid-century-home",
    name: "Mid-Century Home",
    pieces: 890,
    price: 139,
    image: productModernApt,
  },
  {
    id: "industrial-warehouse",
    name: "Industrial Warehouse",
    pieces: 1250,
    price: 169,
    image: productHero,
  },
];

const Shop = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-16">
              <h1 className="text-3xl md:text-4xl font-bold tracking-widest uppercase mb-4">
                COLLECTION
              </h1>
              <p className="text-muted-foreground max-w-xl">
                Precision-engineered architectural kits designed for the discerning builder. 
                Each set is crafted for scale accuracy and visual excellence.
              </p>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Shop;