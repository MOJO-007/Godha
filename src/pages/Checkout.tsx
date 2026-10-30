import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart.ts";
import { listStoreProducts } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getProductOrderLimit } from "@/lib/productStock";
import { Product } from "@/components/ProductCard";

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(isSupabaseConfigured);
  const [catalogError, setCatalogError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    listStoreProducts()
      .then((loadedProducts) => {
        if (isMounted) setProducts(loadedProducts);
      })
      .catch((error: Error) => {
        console.error("Failed to load the catalog for checkout", error);
        if (isMounted) setCatalogError("We couldn't check current product availability. Please try again.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingProducts(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const subtotal = cartItems.reduce((total, item) => {
    const currentProduct = productsById.get(item.id);
    return total + (currentProduct?.price ?? item.price) * item.quantity;
  }, 0);

  const unavailableItems = cartItems.filter((item) => {
    const currentProduct = productsById.get(item.id);
    return !currentProduct ||
      currentProduct.is_available === false ||
      currentProduct.stock_quantity === 0 ||
      item.quantity > getProductOrderLimit(currentProduct);
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cartItems.length === 0) return;

    if (isLoadingProducts || catalogError) {
      toast({
        title: "Unable to verify products",
        description: "Please wait for the catalog to load or reload the page.",
        variant: "destructive",
      });
      return;
    }

    if (unavailableItems.length > 0) {
      toast({
        title: "Update your cart",
        description: "One or more items are no longer available in the selected quantity.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const orderLines = cartItems.map((item) => {
      const currentProduct = productsById.get(item.id)!;
      const lineTotal = currentProduct.price * item.quantity;
      return `• ${currentProduct.name}: ₹${currentProduct.price.toFixed(2)} × ${item.quantity} = ₹${lineTotal.toFixed(2)}`;
    }).join("\n");
    const message = [
      "ನಮಸ್ಕಾರ! I'd like to order the following items:",
      "",
      orderLines,
      "",
      `Subtotal: ₹${subtotal.toFixed(2)}`,
      `Total: ₹${subtotal.toFixed(2)}`,
      "",
      "*Customer Details*",
      `Name: ${customerName.trim()}`,
      `Address: ${customerAddress.trim()}`,
    ].join("\n");
    const whatsappUrl = `https://wa.me/919611314403?text=${encodeURIComponent(message)}`;
    const whatsappWindow = window.open(whatsappUrl, "_blank");

    if (!whatsappWindow) {
      setIsSubmitting(false);
      toast({
        title: "WhatsApp did not open",
        description: "Allow pop-ups for this site and try again. Your cart is still saved.",
        variant: "destructive",
      });
      return;
    }

    whatsappWindow.opener = null;
    clearCart();
    toast({
      title: "Order details ready",
      description: "WhatsApp opened with your itemized order. Send the message to place your order.",
    });
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-gradient-warm px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to store
        </Link>
        <h1 className="mb-2 text-3xl font-bold text-primary">Checkout</h1>
        <p className="mb-8 text-muted-foreground">
          Review your order and continue to WhatsApp to confirm it. Payment is not collected on this page.
        </p>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="mb-4 text-muted-foreground">Your cart is empty.</p>
              <Button onClick={() => navigate("/")}>Continue shopping</Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Order summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => {
                  const currentProduct = productsById.get(item.id);
                  const price = currentProduct?.price ?? item.price;
                  const lineTotal = price * item.quantity;
                  const orderLimit = currentProduct
                    ? getProductOrderLimit(currentProduct)
                    : getProductOrderLimit(item);

                  return (
                    <div key={item.id} className="flex gap-4 border-b pb-4 last:border-b-0">
                      <img src={currentProduct?.image ?? item.image} alt="" className="h-20 w-20 rounded-md object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <h2 className="font-medium">{currentProduct?.name ?? item.name}</h2>
                          <p className="shrink-0 font-semibold">₹{lineTotal.toFixed(2)}</p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          ₹{price.toFixed(2)} × {item.quantity} = ₹{lineTotal.toFixed(2)}
                        </p>
                        {currentProduct?.pack_size && (
                          <p className="text-sm text-muted-foreground">Pack: {currentProduct.pack_size}</p>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label={`Decrease ${item.name} quantity`}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="min-w-8 text-center" aria-label="Quantity">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label={`Increase ${item.name} quantity`}
                            disabled={item.quantity >= orderLimit}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="ml-auto text-destructive hover:text-destructive"
                            aria-label={`Remove ${item.name}`}
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {unavailableItems.length > 0 && !isLoadingProducts && (
                  <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    Some items or quantities are no longer available. Adjust or remove them to continue.
                  </p>
                )}
                {catalogError && (
                  <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{catalogError}</p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="checkout-name">Full name</Label>
                    <Input
                      id="checkout-name"
                      autoComplete="name"
                      required
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="checkout-address">Delivery address</Label>
                    <textarea
                      id="checkout-address"
                      autoComplete="street-address"
                      required
                      value={customerAddress}
                      onChange={(event) => setCustomerAddress(event.target.value)}
                      placeholder="House/flat, street, city, state, PIN code"
                      rows={4}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({cartItems.reduce((count, item) => count + item.quantity, 0)} items)</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-4 text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Delivery charges, if any, can be confirmed on WhatsApp.
                  </p>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting || isLoadingProducts || Boolean(catalogError) || unavailableItems.length > 0}
                  >
                    {isSubmitting ? "Opening WhatsApp..." : "Continue to WhatsApp"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </form>
        )}
      </div>
    </main>
  );
};

export default Checkout;
