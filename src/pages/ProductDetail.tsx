import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getProductById, products } from "@/data/products";
import ProductCard from "@/components/ProductCard";

const ProductDetail = () => {
  const { productId } = useParams();
  const product = productId ? getProductById(productId) : null;
  const [selectedImage, setSelectedImage] = useState(0);

  // Get related products (same category, excluding current)
  const relatedProducts = product 
    ? products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3)
    : [];

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-48 pb-24 section-padding">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <Link to="/shop" className="underline underline-offset-4">
              Return to Shop
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-48 pb-24">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <nav className="mb-8 text-sm">
              <Link to="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
                Shop
              </Link>
              <span className="mx-3 text-muted-foreground">/</span>
              <span>{product.name}</span>
            </nav>

            {/* Product Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="aspect-square bg-secondary overflow-hidden">
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Thumbnails */}
                <div className="grid grid-cols-4 gap-4">
                  {product.images.map((img, i) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedImage(i)}
                      className={`aspect-square bg-secondary border transition-colors cursor-pointer overflow-hidden ${
                        selectedImage === i ? "border-primary" : "border-input hover:border-primary"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} view ${i + 1}`}
                        className={`w-full h-full object-cover transition-opacity ${
                          selectedImage === i ? "opacity-100" : "opacity-70 hover:opacity-100"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-8">
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">
                    {product.category}
                  </p>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-widest uppercase mb-6">
                    {product.name}
                  </h1>

                  {/* Specs Block */}
                  <div className="flex items-center gap-4 text-sm font-medium tracking-widest border-y border-primary py-4 mb-6">
                    <span>{product.age}</span>
                    <span className="text-muted-foreground">|</span>
                    <span>{product.pieces.toLocaleString()} PCS</span>
                    <span className="text-muted-foreground">|</span>
                    <span>SCALE {product.scale}</span>
                  </div>

                  {/* Price */}
                  <p className="text-3xl font-bold mb-8">
                    ${product.price}
                  </p>

                  {/* Description */}
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    {product.description.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <button className="btn-gold w-full text-sm">
                  ADD TO COLLECTION
                </button>

                {/* Additional Info */}
                <div className="border-t border-input pt-8 space-y-4">
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold tracking-wider uppercase py-2">
                      SPECIFICATIONS
                      <span className="group-open:rotate-180 transition-transform">+</span>
                    </summary>
                    <div className="py-4 text-sm text-muted-foreground space-y-2">
                      <p>Piece Count: {product.pieces.toLocaleString()}</p>
                      <p>Scale: {product.scale}</p>
                      <p>Age: {product.age}</p>
                      <p>Category: {product.category}</p>
                    </div>
                  </details>
                  <details className="group border-t border-input">
                    <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold tracking-wider uppercase py-2">
                      SHIPPING
                      <span className="group-open:rotate-180 transition-transform">+</span>
                    </summary>
                    <div className="py-4 text-sm text-muted-foreground">
                      <p>Free shipping on orders over $150. Standard delivery 5-7 business days.</p>
                    </div>
                  </details>
                </div>
              </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <section className="mt-24 pt-16 border-t border-input">
                <h2 className="text-xl font-bold tracking-widest uppercase mb-8">
                  RELATED PRODUCTS
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {relatedProducts.map((p) => (
                    <ProductCard 
                      key={p.id}
                      id={p.id}
                      name={p.name}
                      pieces={p.pieces}
                      price={p.price}
                      image={p.image}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;