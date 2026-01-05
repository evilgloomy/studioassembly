import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
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
];

const NewArrivals = () => {
  return (
    <section className="section-padding py-24 bg-secondary">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-2xl font-bold tracking-widest uppercase">
            NEW ARRIVALS
          </h2>
          <Link
            to="/shop"
            className="text-sm font-medium tracking-wider uppercase underline underline-offset-4 decoration-1 hover:opacity-70 transition-opacity"
          >
            View All
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;