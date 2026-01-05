import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import productModernApt from "@/assets/product-modern-apt.jpg";
import productHero from "@/assets/product-hero.jpg";

const products: Record<string, {
  name: string;
  pieces: number;
  price: number;
  scale: string;
  age: string;
  image: string;
  description: string[];
}> = {
  "modern-apartment-ground": {
    name: "Modern Apartment - Ground",
    pieces: 1400,
    price: 189,
    scale: "1:40",
    age: "18+",
    image: productModernApt,
    description: [
      "The Modern Apartment - Ground floor kit represents the pinnacle of contemporary urban architecture, featuring clean lines, floor-to-ceiling windows, and an open-plan layout that celebrates natural light and spatial flow.",
      "This meticulously designed kit includes fully detailed interior furnishings, working doors, and removable roof sections for display flexibility. Perfect as a standalone piece or as part of a larger modular cityscape."
    ]
  },
  "urban-loft-series": {
    name: "Urban Loft Series",
    pieces: 980,
    price: 149,
    scale: "1:40",
    age: "16+",
    image: productHero,
    description: [
      "The Urban Loft Series captures the industrial charm of converted warehouse spaces, featuring exposed brick textures, steel beam details, and oversized windows characteristic of authentic loft living.",
      "This versatile kit can be configured in multiple layouts and stacks seamlessly with other Urban Loft modules to create impressive multi-story builds."
    ]
  },
};

const ProductDetail = () => {
  const { productId } = useParams();
  const product = productId ? products[productId] : null;

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-24 section-padding">
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
      <main className="pt-32 pb-24">
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
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Thumbnails */}
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square bg-secondary border border-input hover:border-primary transition-colors cursor-pointer overflow-hidden">
                      <img
                        src={product.image}
                        alt={`${product.name} view ${i}`}
                        className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-8">
                <div>
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
                      <p>Dimensions: 32 × 32 × 24 studs</p>
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;