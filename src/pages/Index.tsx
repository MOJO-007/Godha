import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Store } from "lucide-react";
import { ProductCard, Product } from "@/components/ProductCard";
import { CartSidebar } from "@/components/CartSidebar";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

// Import product images
import headphonesImg from "@/assets/headphones.jpg";
import smartphoneImg from "@/assets/smartphone.jpg";
import coffeeMugImg from "@/assets/coffee-mug.jpg";
import laptopImg from "@/assets/laptop.jpg";

const products: Product[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    price: 199.99,
    image: headphonesImg,
  },
  {
    id: "2",
    name: "Smartphone Pro Max",
    price: 899.99,
    image: smartphoneImg,
  },
  {
    id: "3",
    name: "Premium Coffee Mug",
    price: 24.99,
    image: coffeeMugImg,
  },
  {
    id: "4",
    name: "Ultra Thin Laptop",
    price: 1299.99,
    image: laptopImg,
  },
];

const Index = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { 
    cartItems, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    getCartItemCount, 
    generateWhatsAppMessage 
  } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleCheckout = () => {
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">My Store</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCartOpen(true)}
            className="gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart
            {getCartItemCount() > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getCartItemCount()}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Our Products</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our curated collection of premium products. Add items to your cart and checkout instantly via WhatsApp.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </main>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
};

export default Index;
