import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Utensils } from "lucide-react";
import { ProductCard, Product } from "@/components/ProductCard";
import { CartSidebar } from "@/components/CartSidebar";
import { HeroSection } from "@/components/HeroSection";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

// Import product images
import garamMasalaImg from "@/assets/garam-masala.jpg";
import basmatiRiceImg from "@/assets/basmati-rice.jpg";
import dalMixImg from "@/assets/dal-mix.jpg";
import turmericImg from "@/assets/turmeric.jpg";
import chaiBlendImg from "@/assets/chai-blend.jpg";
import pickleImg from "@/assets/pickle.jpg";

const products: Product[] = [
  {
    id: "1",
    name: "Premium Garam Masala",
    price: 299,
    image: garamMasalaImg,
  },
  {
    id: "2",
    name: "Authentic Basmati Rice (5kg)",
    price: 899,
    image: basmatiRiceImg,
  },
  {
    id: "3",
    name: "Mixed Dal Combo Pack",
    price: 649,
    image: dalMixImg,
  },
  {
    id: "4",
    name: "Pure Turmeric Powder",
    price: 199,
    image: turmericImg,
  },
  {
    id: "5",
    name: "Traditional Chai Blend",
    price: 349,
    image: chaiBlendImg,
  },
  {
    id: "6",
    name: "Homemade Mango Pickle",
    price: 249,
    image: pickleImg,
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
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="fixed top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">Spice Bazaar</h1>
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

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </section>

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
