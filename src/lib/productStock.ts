import { Product } from "@/components/ProductCard";

export function formatProductStock(product: Product): string {
  if (product.is_available === false || product.stock_quantity === 0) return "Out of stock";
  if (product.stock_quantity == null) return "Stock quantity not set";
  return `${product.stock_quantity} in stock`;
}

export function getProductOrderLimit(product: Product): number {
  const productLimit = product.max_order_quantity ?? 10;
  return product.stock_quantity == null
    ? productLimit
    : Math.min(productLimit, product.stock_quantity);
}
