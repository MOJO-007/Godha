import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions, jsonResponse } from "../_shared/cors.ts";

interface RequestedItem {
  id: string;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  stock_quantity: number | null;
  max_order_quantity: number;
}

Deno.serve(async (request: Request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  let body: {
    customerName?: unknown;
    customerAddress?: unknown;
    items?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
  const customerAddress = typeof body.customerAddress === "string" ? body.customerAddress.trim() : "";
  if (customerName.length < 2 || customerName.length > 120) {
    return jsonResponse({ error: "Enter a valid customer name." }, 400);
  }
  if (customerAddress.length < 8 || customerAddress.length > 1000) {
    return jsonResponse({ error: "Enter a valid delivery address." }, 400);
  }
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
    return jsonResponse({ error: "The order must contain between 1 and 50 items." }, 400);
  }

  const items = body.items as RequestedItem[];
  if (items.some((item) =>
    !item ||
    typeof item.id !== "string" ||
    item.id.length > 100 ||
    !Number.isSafeInteger(item.quantity) ||
    item.quantity < 1
  )) {
    return jsonResponse({ error: "The order contains invalid items." }, 400);
  }
  const productIds = items.map((item) => item.id);
  if (new Set(productIds).size !== productIds.length) {
    return jsonResponse({ error: "The order contains duplicate items." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!supabaseUrl || !serviceRoleKey || !keyId || !keySecret) {
    console.error("Supabase or Razorpay server configuration is missing.");
    return jsonResponse({ error: "Payment service is not configured." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, is_available, stock_quantity, max_order_quantity")
    .in("id", productIds)
    .eq("is_active", true);
  if (productsError) {
    console.error("Failed to load products for Razorpay order", productsError);
    return jsonResponse({ error: "Could not verify product availability." }, 500);
  }

  const productsById = new Map((products as Product[]).map((product) => [product.id, product]));
  const orderItems: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }> = [];
  let amount = 0;
  for (const item of items) {
    const product = productsById.get(item.id);
    const orderLimit = product && product.stock_quantity != null
      ? Math.min(product.max_order_quantity, product.stock_quantity)
      : product?.max_order_quantity ?? 0;
    if (!product || !product.is_available || item.quantity > orderLimit) {
      return jsonResponse({ error: "A product is unavailable or the requested quantity exceeds its limit." }, 400);
    }

    const unitPricePaise = Math.round(Number(product.price) * 100);
    const lineTotalPaise = unitPricePaise * item.quantity;
    if (!Number.isSafeInteger(unitPricePaise) || unitPricePaise < 1 || !Number.isSafeInteger(lineTotalPaise)) {
      return jsonResponse({ error: "The order amount is invalid." }, 400);
    }
    amount += lineTotalPaise;
    if (!Number.isSafeInteger(amount)) {
      return jsonResponse({ error: "The order amount is too large." }, 400);
    }
    orderItems.push({
      name: product.name,
      quantity: item.quantity,
      unitPrice: unitPricePaise / 100,
      lineTotal: lineTotalPaise / 100,
    });
  }

  const receipt = `godha_${crypto.randomUUID().replaceAll("-", "")}`;
  let razorpayResponse: Response;
  try {
    razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, currency: "INR", receipt }),
    });
  } catch (error) {
    console.error("Razorpay order API request failed", error);
    return jsonResponse({ error: "Could not create a payment order." }, 502);
  }
  if (!razorpayResponse.ok) {
    console.error("Razorpay rejected order creation", razorpayResponse.status);
    return jsonResponse({ error: "Could not create a payment order." }, 502);
  }

  const razorpayOrder = await razorpayResponse.json();
  if (typeof razorpayOrder.id !== "string" || razorpayOrder.amount !== amount) {
    console.error("Razorpay returned an invalid order response.");
    return jsonResponse({ error: "Could not create a payment order." }, 502);
  }

  const { error: saveError } = await supabase.from("orders").insert({
    razorpay_order_id: razorpayOrder.id,
    customer_name: customerName,
    customer_address: customerAddress,
    items: orderItems,
    amount,
    currency: "INR",
    status: "pending",
  });
  if (saveError) {
    console.error("Failed to save pending Razorpay order", saveError);
    return jsonResponse({ error: "Could not save your order." }, 500);
  }

  return new Response(JSON.stringify({
    orderId: razorpayOrder.id,
    keyId,
    amount,
    currency: "INR",
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
