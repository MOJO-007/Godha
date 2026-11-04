export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayErrorResponse {
  error: {
    description?: string;
  };
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email?: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void | Promise<void>;
  modal: { ondismiss: () => void };
}

interface RazorpayCheckout {
  new(options: RazorpayCheckoutOptions): {
    open: () => void;
    on: (
      event: "payment.failed",
      handler: (response: RazorpayErrorResponse) => void,
    ) => void;
  };
}

declare global {
  interface Window {
    Razorpay: RazorpayCheckout;
  }
}

export function loadRazorpayCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    const script = existingScript ?? document.createElement("script");
    const onLoad = () => window.Razorpay ? resolve() : reject(new Error("Razorpay checkout did not load."));
    const onError = () => reject(new Error("Failed to load Razorpay checkout."));

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existingScript) {
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  });
}
