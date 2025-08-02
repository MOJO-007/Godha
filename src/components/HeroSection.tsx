import { Button } from "@/components/ui/button";
import { ArrowDown, Star } from "lucide-react";
import heroSpices from "@/assets/hero-spices.jpg";

export const HeroSection = () => {
  const scrollToProducts = () => {
    const productsSection = document.getElementById('products');
    productsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroSpices} 
          alt="Indian Spices" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-80" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <div className="animate-float">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-sm font-medium">Trusted by 10,000+ customers</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Authentic
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
              Indian Flavors
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto leading-relaxed">
            Premium spices, traditional recipes, and authentic ingredients delivered fresh to your doorstep
          </p>
          
          <div className="flex justify-center items-center mb-12">
            <Button 
              size="lg" 
              onClick={scrollToProducts}
              className="bg-white text-primary hover:bg-white/90 shadow-glow px-8 py-4 text-lg font-semibold"
            >
              Shop Now
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-white/80">Authentic</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">₹99</div>
              <div className="text-white/80">Free Delivery Above</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">24h</div>
              <div className="text-white/80">Fresh Delivery</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <button 
        onClick={scrollToProducts}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hover:text-white transition-colors cursor-pointer"
      >
        <ArrowDown className="w-6 h-6 text-white/70 hover:text-white transition-colors" />
      </button>
    </section>
  );
};