import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  is_active?: boolean;
  description?: string;
  pack_size?: string;
  ingredients?: string;
  allergens?: string;
  is_available?: boolean;
  stock_quantity?: number | null;
  max_order_quantity?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductCard = ({ product, onAddToCart, onViewDetails }: ProductCardProps) => {
  const isOutOfStock = product.is_available === false || product.stock_quantity === 0;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => onViewDetails(product)}
          aria-label={`View details for ${product.name}`}
          className="block aspect-square w-full overflow-hidden bg-muted text-left"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </button>
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onViewDetails(product)}
              className="text-left font-semibold text-lg text-card-foreground line-clamp-2 hover:text-primary"
            >
              {product.name}
            </button>
            {isOutOfStock && (
              <Badge variant="secondary" className="shrink-0">Out of stock</Badge>
            )}
          </div>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
          )}
          {(product.pack_size || product.ingredients || product.allergens) && (
            <div className="space-y-1 text-xs text-muted-foreground">
              {product.pack_size && <p><span className="font-medium">Pack:</span> {product.pack_size}</p>}
              {product.ingredients && <p className="line-clamp-2"><span className="font-medium">Ingredients:</span> {product.ingredients}</p>}
              {product.allergens && <p className="line-clamp-2"><span className="font-medium">Allergens:</span> {product.allergens}</p>}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              ₹{product.price.toFixed(0)}
            </span>
            <Button
              onClick={() => onAddToCart(product)}
              size="sm"
              disabled={isOutOfStock}
              className="gap-2 hover:gap-3 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              {isOutOfStock ? "Unavailable" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};