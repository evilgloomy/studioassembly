import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";

const Shop = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-48 pb-24">
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Shop;