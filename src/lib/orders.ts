import { supabase } from "@/lib/supabase";

export type OrderStatus = "pending" | "paid" | "dispatched";

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface StoreOrder {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_address: string;
  items: OrderItem[];
  amount: number;
  currency: string;
  status: OrderStatus;
  created_at: string;
}

function getSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

export async function listAdminOrders(): Promise<StoreOrder[]> {
  const { data, error } = await getSupabase()
    .from("orders")
    .select("id, razorpay_order_id, razorpay_payment_id, customer_name, customer_email, customer_address, items, amount, currency, status, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as StoreOrder[];
}

export async function markOrderDispatched(orderId: string): Promise<void> {
  const { data, error } = await getSupabase()
    .from("orders")
    .update({ status: "dispatched" })
    .eq("id", orderId)
    .eq("status", "paid")
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("This order is no longer marked as paid. Refresh the orders and try again.");
  }
}
