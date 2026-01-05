import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { products } from "@/data/products";

const NewArrivals = () => {
  // Show first 3 products as new arrivals
  const newArrivals = products.slice(0, 3);

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
          {newArrivals.map((product) => (
            <ProductCard 
              key={product.id} 
              id={product.id}
              name={product.name}
              pieces={product.pieces}
              price={product.price}
              image={product.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;