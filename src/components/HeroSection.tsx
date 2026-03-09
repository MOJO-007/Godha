import { Button } from "@/components/ui/button";
import { ArrowDown, Star } from "lucide-react";
import heroSpices from "@/assets/hero-spices.jpg";
import bg from "@/assets/godhaBG.jpeg";

export const HeroSection = () => {
  const scrollToProducts = () => {
    const productsSection = document.getElementById('products');
    productsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-center pt-24 pb-12 overflow-hidden bg-gradient-hero">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bg} 
          alt="Indian Spices" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-75" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <div className="animate-float">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20">
              <div className="flex -space-x-3">
                <img className="w-8 h-8 rounded-full border-2 border-primary/20 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64" alt="Customer" />
                <img className="w-8 h-8 rounded-full border-2 border-primary/20 object-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" alt="Customer" />
                <img className="w-8 h-8 rounded-full border-2 border-primary/20 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64" alt="Customer" />
                <div className="w-8 h-8 rounded-full border-2 border-primary/20 bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                  +10k
                </div>
              </div>
              <div className="flex flex-col items-start leading-none">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-xs font-medium mt-1 text-white/90">Trusted Customers</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            Authentic
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-yellow-400 drop-shadow-md">
              Indian Flavors
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-10 text-white/80 max-w-2xl mx-auto leading-relaxed font-light">
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