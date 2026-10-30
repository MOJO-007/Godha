import { createContext, createElement, ReactNode, useContext, useEffect, useState } from "react";
import { Product } from "@/components/ProductCard";
import { CartItem } from "@/components/CartSidebar";
import { getProductOrderLimit } from "@/lib/productStock";

interface CartContextValue {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  generateWhatsAppMessage: () => string;
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (err) {
        console.error("Failed to parse cart items from localStorage", err);
        return [];
      }
    }
    return [];
  });

  // Save cart items to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, quantity = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      const currentQuantity = existingItem?.quantity ?? 0;
      const nextQuantity = Math.min(
        currentQuantity + quantity,
        getProductOrderLimit(product),
      );

      if (nextQuantity <= currentQuantity) return prev;

      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, ...product, quantity: nextQuantity }
            : item
        );
      }

      return [...prev, { ...product, quantity: nextQuantity }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              quantity: Math.min(quantity, getProductOrderLimit(item)),
            }
          : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const generateWhatsAppMessage = () => {
    const message = "ನಮಸ್ಕಾರ! I'd like to order the following items:\n\n" +
      cartItems.map(item =>
        `• ${item.name}: ₹${item.price.toFixed(2)} × ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`
      ).join('\n') +
      `\n\nTotal: ₹${getCartTotal().toFixed(2)}`;

    return encodeURIComponent(message);
  };

  const value: CartContextValue = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
    generateWhatsAppMessage
  };

  return createElement(CartContext.Provider, { value }, children);
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};