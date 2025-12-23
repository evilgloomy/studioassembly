import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  scale: string;
  footprint: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link 
      to={`/store/${product.id}`} 
      className="group block border-t border-border pt-8"
    >
      {/* Placeholder for product image */}
      <div className="aspect-square bg-muted mb-6 flex items-center justify-center">
        <span className="mono text-muted-foreground text-xs">Image</span>
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        <span className="mono text-muted-foreground text-xs block">
          {product.category}
        </span>
        
        <h3 className="font-serif text-lg group-hover:opacity-70 transition-opacity">
          {product.name}
        </h3>

        <div className="flex justify-between items-center">
          <span className="mono text-xs text-muted-foreground">
            {product.scale} · {product.footprint}
          </span>
          <span className="text-sm">
            ${product.price.toFixed(2)} CAD
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;