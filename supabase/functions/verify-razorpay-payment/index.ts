import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions, jsonResponse } from "../_shared/cors.ts";

interface StoredOrder {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  customer_name: string;
  customer_address: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  amount: number;
  currency: string;
  status: "pending" | "paid";
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function signaturesMatch(expected: string, actual: string): boolean {
  if (!/^[\da-f]{64}$/i.test(actual) || expected.length !== actual.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ actual.toLowerCase().charCodeAt(index);
  }
  return difference === 0;
}

Deno.serve(async (request: Request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  let body: {
    razorpay_order_id?: unknown;
    razorpay_payment_id?: unknown;
    razorpay_signature?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }
  const orderId = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const signature = body.razorpay_signature;
  if (
    typeof orderId !== "string" || orderId.length > 100 ||
    typeof paymentId !== "string" || paymentId.length > 100 ||
    typeof signature !== "string" || !/^[\da-f]{64}$/i.test(signature)
  ) {
    return jsonResponse({ error: "Invalid payment details." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!supabaseUrl || !serviceRoleKey || !keyId || !keySecret) {
    console.error("Supabase or Razorpay server configuration is missing.");
    return jsonResponse({ error: "Payment service is not configured." }, 500);
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keySecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signedBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${orderId}|${paymentId}`),
  );
  const expectedSignature = bytesToHex(new Uint8Array(signedBytes));
  if (!signaturesMatch(expectedSignature, signature)) {
    return jsonResponse({ error: "Payment signature is invalid." }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { data: order, error: lookupError } = await supabase
    .from("orders")
    .select("id, razorpay_order_id, razorpay_payment_id, customer_name, customer_address, items, amount, currency, status")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();
  if (lookupError) {
    console.error("Failed to load Razorpay order for verification", lookupError);
    return jsonResponse({ error: "Could not verify the payment." }, 500);
  }
  if (!order) return jsonResponse({ error: "Payment order was not found." }, 404);
  const storedOrder = order as StoredOrder;
  if (storedOrder.status === "paid") {
    if (storedOrder.razorpay_payment_id !== paymentId) {
      return jsonResponse({ error: "This order was paid with a different payment." }, 409);
    }
    return jsonResponse({ order: {
      id: storedOrder.razorpay_order_id,
      customerName: storedOrder.customer_name,
      customerAddress: storedOrder.customer_address,
      amount: storedOrder.amount,
      paymentId: storedOrder.razorpay_payment_id,
      items: storedOrder.items,
    } });
  }

  const authorization = `Basic ${btoa(`${keyId}:${keySecret}`)}`;
  let paymentResponse: Response;
  try {
    paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: authorization },
    });
  } catch (error) {
    console.error("Razorpay payment lookup failed", error);
    return jsonResponse({ error: "Could not verify the payment." }, 502);
  }
  if (!paymentResponse.ok) {
    console.error("Razorpay rejected payment lookup", paymentResponse.status);
    return jsonResponse({ error: "Could not verify the payment." }, 502);
  }
  let razorpayPayment = await paymentResponse.json();
  if (
    razorpayPayment.order_id !== orderId ||
    razorpayPayment.amount !== storedOrder.amount ||
    razorpayPayment.currency !== storedOrder.currency
  ) {
    return jsonResponse({ error: "Payment details do not match this order." }, 400);
  }
  if (razorpayPayment.status === "authorized") {
    let captureResponse: Response;
    try {
      captureResponse = await fetch(
        `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: authorization,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: storedOrder.amount,
            currency: storedOrder.currency,
          }),
        },
      );
    } catch (error) {
      console.error("Razorpay payment capture failed", error);
      return jsonResponse({ error: "Could not capture the payment yet. Retry verification shortly." }, 502);
    }
    if (!captureResponse.ok) {
      console.error("Razorpay rejected payment capture", captureResponse.status);
      return jsonResponse({ error: "Could not capture the payment yet. Retry verification shortly." }, 502);
    }
    razorpayPayment = await captureResponse.json();
  }
  if (
    razorpayPayment.status !== "captured" ||
    razorpayPayment.order_id !== orderId ||
    razorpayPayment.amount !== storedOrder.amount ||
    razorpayPayment.currency !== storedOrder.currency
  ) {
    return jsonResponse({ error: "Payment has not been captured for this order." }, 400);
  }

  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({ razorpay_payment_id: paymentId, status: "paid" })
    .eq("razorpay_order_id", orderId)
    .eq("status", "pending")
    .select("razorpay_payment_id")
    .maybeSingle();
  if (updateError) {
    console.error("Failed to mark Razorpay order as paid", updateError);
    return jsonResponse({ error: "Could not confirm the payment." }, 500);
  }
  if (!updatedOrder) {
    const { data: currentOrder, error: currentOrderError } = await supabase
      .from("orders")
      .select("razorpay_payment_id, status")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();
    if (currentOrderError) {
      console.error("Failed to check Razorpay order status", currentOrderError);
      return jsonResponse({ error: "Could not confirm the payment." }, 500);
    }
    if (currentOrder?.status !== "paid" || currentOrder.razorpay_payment_id !== paymentId) {
      return jsonResponse({ error: "This order was paid with a different payment." }, 409);
    }
  }

  return jsonResponse({ order: {
    id: storedOrder.razorpay_order_id,
    customerName: storedOrder.customer_name,
    customerAddress: storedOrder.customer_address,
    amount: storedOrder.amount,
    paymentId,
    items: storedOrder.items,
  } });
});
