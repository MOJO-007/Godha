import { useState } from "react";
import { Product } from "@/components/ProductCard";
import { CartItem } from "@/components/CartSidebar";

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const generateWhatsAppMessage = () => {
    const message = "Hello! I'd like to order the following items:\n\n" +
      cartItems.map(item => 
        `• ${item.name} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
      ).join('\n') +
      `\n\nTotal: $${getCartTotal().toFixed(2)}`;
    
    return encodeURIComponent(message);
  };

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    getCartItemCount,
    generateWhatsAppMessage
  };
};