import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search } from "lucide-react";
import { ProductCard, Product } from "@/components/ProductCard";
import { CartSidebar } from "@/components/CartSidebar";
import { HeroSection } from "@/components/HeroSection";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { products } from "@/data/products";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

const Index = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartItemCount,
    generateWhatsAppMessage
  } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
      duration: 3000,
    });
  };

  const handleCheckout = () => {
    setIsCheckoutModalOpen(true);
  };

  const confirmCheckout = () => {
    if (!customerName || !customerAddress) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and delivery address.",
        variant: "destructive"
      });
      return;
    }

    const cartDetails = generateWhatsAppMessage();
    const customerDetails = encodeURIComponent(`\n\n*Customer Details*\nName: ${customerName}\nAddress: ${customerAddress}`);
    const finalMessage = `${cartDetails}${customerDetails}`;
    const whatsappUrl = `https://wa.me/919611314403?text=${finalMessage}`;
    window.open(whatsappUrl, '_blank');
    setIsCheckoutModalOpen(false);
    clearCart();
    toast({
      title: "Order Processed",
      description: "Redirecting to WhatsApp to complete your order.",
    });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = activeCategory === "All" || product.category === activeCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

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
        {filteredProducts.length === 0 ? (
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
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
      />
      {/* Checkout Modal */}
      <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
            <DialogDescription>
              Please enter your details to complete the order via WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Delivery Address</Label>
              <Input
                id="address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="123 Main St, City, Zip"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCheckout}>
              Proceed to WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
