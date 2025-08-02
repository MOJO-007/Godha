import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4 space-y-3">
          <h3 className="font-semibold text-lg text-card-foreground line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              ₹{product.price.toFixed(0)}
            </span>
            <Button
              onClick={() => onAddToCart(product)}
              size="sm"
              className="gap-2 hover:gap-3 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};