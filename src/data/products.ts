import supermarket from "@/assets/products/supermarket.png";
import supermarketExploded from "@/assets/products/supermarket-exploded.png";
import apartmentComplete from "@/assets/products/apartment-complete.png";
import apartmentGround from "@/assets/products/apartment-ground.png";
import apartment2UnitUnfurnished from "@/assets/products/apartment-2unit-unfurnished.png";
import apartment2UnitFurnished from "@/assets/products/apartment-2unit-furnished.png";

export interface Product {
  id: string;
  name: string;
  pieces: number;
  price: number;
  scale: string;
  age: string;
  image: string;
  images: string[];
  description: string[];
  category: string;
}

export const products: Product[] = [
  {
    id: "supermarket",
    name: "Supermarket",
    pieces: 1850,
    price: 219,
    scale: "1:40",
    age: "18+",
    image: supermarket,
    images: [supermarket, supermarketExploded],
    category: "Commercial",
    description: [
      "The Supermarket kit brings neighborhood commerce to life with meticulous attention to authentic retail architecture. Featuring a vibrant green facade, rooftop solar panels, and street-level produce displays, this model captures the essence of urban grocery retail.",
      "The removable roof reveals a fully detailed interior with checkout counter, café seating area, and storage sections. Compatible with the Modern Apartment series for integrated city building."
    ]
  },
  {
    id: "modern-apartment-complete",
    name: "Modern Apartment - Complete Edition",
    pieces: 4200,
    price: 449,
    scale: "1:40",
    age: "18+",
    image: apartmentComplete,
    images: [apartmentComplete, apartmentGround],
    category: "Residential",
    description: [
      "The complete Modern Apartment tower stands as the flagship of our residential collection. This impressive 7-story building features ground-floor retail spaces, a rooftop terrace with solar panels, and six floors of contemporary urban living.",
      "Each floor is fully detailed with balconies, floor-to-ceiling windows, and authentic architectural elements including brick accents and modern glass railings. A true centerpiece for any modular city display."
    ]
  },
  {
    id: "modern-apartment-ground",
    name: "Modern Apartment - Ground Floor",
    pieces: 1400,
    price: 189,
    scale: "1:40",
    age: "18+",
    image: apartmentGround,
    images: [apartmentGround, apartmentComplete],
    category: "Residential",
    description: [
      "The Ground Floor module serves as the foundation for your Modern Apartment building, featuring two distinct retail spaces—a florist shop and a café—with fully detailed interiors including counter displays, seating areas, and decorative elements.",
      "The street-level design includes planters, a classic lamp post, and modular connection points for seamless stacking with additional floors. Perfect as a standalone piece or as the base for a towering residential complex."
    ]
  },
  {
    id: "modern-apartment-2unit-unfurnished",
    name: "Modern Apartment - 2 Unit Floor - Unfurnished",
    pieces: 680,
    price: 89,
    scale: "1:40",
    age: "16+",
    image: apartment2UnitUnfurnished,
    images: [apartment2UnitUnfurnished, apartment2UnitFurnished],
    category: "Residential",
    description: [
      "The 2 Unit Floor module in its unfurnished configuration provides a blank canvas for customization. Each apartment features an open floor plan with bathroom, bedroom, and living spaces defined by the architectural layout.",
      "Ideal for builders who want to create their own interior designs or those building multiple floors with varied layouts. Includes central stairwell and elevator shaft for vertical integration with other modules."
    ]
  },
  {
    id: "modern-apartment-2unit-furnished",
    name: "Modern Apartment - 2 Unit Floor - Furnished",
    pieces: 920,
    price: 119,
    scale: "1:40",
    age: "16+",
    image: apartment2UnitFurnished,
    images: [apartment2UnitFurnished, apartment2UnitUnfurnished],
    category: "Residential",
    description: [
      "The fully furnished 2 Unit Floor brings contemporary living to miniature scale. Each apartment includes a complete furniture package: living room with sofa and entertainment center, bedroom with wardrobe, bathroom fixtures, and kitchen appliances.",
      "The contrasting unit designs showcase different lifestyle configurations—one with a home office setup and the other with a musician's corner. Stacks seamlessly with other Modern Apartment modules."
    ]
  }
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(product => product.id === id);
};
