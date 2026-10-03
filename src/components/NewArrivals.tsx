import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { products } from "@/data/products";

const NewArrivals = () => {
  const buildings = products.slice(0, 3);

  return (
    <section className="section-padding bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Places you can build
            </p>
            <h2 className="mb-4 text-2xl font-bold uppercase tracking-widest">
              Buildings in the city
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A few of the buildings already standing in Caerhold. Open one to see the kit.
            </p>
          </div>
          <Link
            to="/shop"
            className="shrink-0 text-sm font-medium uppercase tracking-wider underline decoration-1 underline-offset-4 transition-opacity hover:opacity-70"
          >
            View the collection
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {buildings.map((product) => (
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
