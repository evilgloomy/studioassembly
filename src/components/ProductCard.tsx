import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  pieces: number;
  price: number;
  image: string;
}

const ProductCard = ({ id, name, pieces, price, image }: ProductCardProps) => {
  return (
    <Link 
      to={`/shop/${id}`}
      className="group block bg-background border border-input hover:border-primary transition-colors"
    >
      {/* Image Container */}
      <div className="aspect-square overflow-hidden bg-secondary">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Product Info */}
      <div className="p-6">
        <h3 className="font-semibold tracking-wide uppercase text-sm mb-2">
          {name}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {pieces.toLocaleString()} PCS
        </p>
        <p className="font-semibold text-lg">
          ${price}
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;