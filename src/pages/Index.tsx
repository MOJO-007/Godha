import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search } from "lucide-react";
import { ProductCard, Product } from "@/components/ProductCard";
import { CartSidebar } from "@/components/CartSidebar";
import { HeroSection } from "@/components/HeroSection";
import { useCart } from "@/hooks/useCart.ts";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { products } from "@/data/Products";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listStoreProducts } from "@/lib/catalog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { formatProductStock, getProductOrderLimit } from "@/lib/productStock";

const Index = () => {
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(
    isSupabaseConfigured ? [] : products,
  );
  const [catalogError, setCatalogError] = useState("");
  const [isCatalogLoading, setIsCatalogLoading] = useState(isSupabaseConfigured);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartItemCount,
  } = useCart();
  const { toast } = useToast();
  const categories = ["All", ...Array.from(new Set(catalogProducts.map((product) => product.category)))];

  useEffect(() => {
    let isMounted = true;

    listStoreProducts()
      .then((loadedProducts) => {
        if (isMounted) setCatalogProducts(loadedProducts);
      })
      .catch((error: Error) => {
        console.error("Failed to load the product catalog", error);
        if (isMounted) setCatalogError("Products could not be loaded. Please try again later.");
      })
      .finally(() => {
        if (isMounted) setIsCatalogLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setSelectedQuantity(1);
  };

  const handleAddToCart = (product: Product, quantity = 1): boolean => {
    const quantityInCart = cartItems.find((item) => item.id === product.id)?.quantity ?? 0;
    const remainingLimit = getProductOrderLimit(product) - quantityInCart;
    if (
      product.is_available === false ||
      remainingLimit <= 0 ||
      quantity > remainingLimit
    ) {
      toast({
        title: remainingLimit <= 0 ? "Maximum quantity reached" : "Product unavailable",
        description: product.stock_quantity != null
          ? `You can add up to ${getProductOrderLimit(product)} item(s) in total.`
          : `You can add up to ${getProductOrderLimit(product)} item(s) per order.`,
        variant: "destructive",
      });
      return false;
    }

    addToCart(product, quantity);
    toast({
      title: "Added to cart",
      description: `${quantity} × ${product.name} added to your cart.`,
      duration: 3000,
    });
    return true;
  };

  const filteredProducts = useMemo(() => {
    return catalogProducts.filter((product) => {
      const matchesCategory = activeCategory === "All" || product.category === activeCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, catalogProducts, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="fixed top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-15 h-12 object-contain" />
            <h1 className="text-xl font-bold text-primary">Godha Food Products</h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCartOpen(true)}
            className="gap-2 hover:shadow-warm transition-all duration-200"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart
            {getCartItemCount() > 0 && (
              <Badge variant="secondary" className="ml-1 bg-primary text-primary-foreground">
                {getCartItemCount()}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Products Section */}
      <section id="products" className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Our Premium Products</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Hand-selected authentic Indian spices and ingredients, sourced directly from farmers and traditional producers.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-10 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                onClick={() => setActiveCategory(category)}
                className="rounded-full px-6 transition-all"
              >
                {category}
              </Button>
            ))}
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-full bg-background"
            />
          </div>
        </div>

        {/* Products Grid */}
        {catalogError ? (
          <div role="alert" className="text-center py-20 text-destructive">{catalogError}</div>
        ) : isCatalogLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No products found matching your criteria.
          </div>
        ) : (
          <motion.div 
            key={`${activeCategory}-${searchQuery}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                }}
              >
                <ProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                  onViewDetails={openProductDetails}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      <Dialog
        open={selectedProduct !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}
      >
        {selectedProduct && (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
              <DialogDescription>
                {selectedProduct.description || selectedProduct.category}
              </DialogDescription>
            </DialogHeader>
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="max-h-64 w-full rounded-md object-cover"
            />
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Price:</span> ₹{selectedProduct.price.toFixed(0)}</p>
              <p><span className="font-medium">Stock:</span> {formatProductStock(selectedProduct)}</p>
              <p><span className="font-medium">Maximum per order:</span> {getProductOrderLimit(selectedProduct)}</p>
              {selectedProduct.pack_size && <p><span className="font-medium">Pack size:</span> {selectedProduct.pack_size}</p>}
              {selectedProduct.ingredients && <p><span className="font-medium">Ingredients:</span> {selectedProduct.ingredients}</p>}
              {selectedProduct.allergens && <p><span className="font-medium">Allergens:</span> {selectedProduct.allergens}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-quantity">Quantity</Label>
              <select
                id="product-quantity"
                value={selectedQuantity}
                onChange={(event) => setSelectedQuantity(Number(event.target.value))}
                disabled={
                  selectedProduct.is_available === false ||
                  getProductOrderLimit(selectedProduct) <=
                    (cartItems.find((item) => item.id === selectedProduct.id)?.quantity ?? 0)
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {Array.from(
                  {
                    length: Math.max(
                      0,
                      getProductOrderLimit(selectedProduct) -
                        (cartItems.find((item) => item.id === selectedProduct.id)?.quantity ?? 0),
                    ),
                  },
                  (_, index) => index + 1,
                ).map((quantity) => (
                  <option key={quantity} value={quantity}>{quantity}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (handleAddToCart(selectedProduct, selectedQuantity)) setSelectedProduct(null);
                }}
                disabled={
                  selectedProduct.is_available === false ||
                  (getProductOrderLimit(selectedProduct) <=
                    (cartItems.find((item) => item.id === selectedProduct.id)?.quantity ?? 0))
                }
              >
                Add to Cart
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onCheckout={() => navigate("/checkout")}
      />
    </div>
  );
};

export default Index;
