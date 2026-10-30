import { Product } from "@/components/ProductCard";
import { products as localProducts } from "@/data/Products";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export interface ProductInput {
  name: string;
  price: number;
  category: string;
  image: string;
  is_active?: boolean;
  description: string;
  pack_size: string;
  ingredients: string;
  allergens: string;
  is_available: boolean;
  stock_quantity: number | null;
  max_order_quantity: number;
}

function getSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add the required VITE_SUPABASE_* environment variables.");
  }

  return supabase;
}

export async function listStoreProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return localProducts;

  const { data, error } = await getSupabase()
    .from("products")
    .select("id, name, price, image, category, is_active, description, pack_size, ingredients, allergens, is_available, stock_quantity, max_order_quantity")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data;
}

export async function listAdminProducts(): Promise<Product[]> {
  const { data, error } = await getSupabase()
    .from("products")
    .select("id, name, price, image, category, is_active, description, pack_size, ingredients, allergens, is_available, stock_quantity, max_order_quantity")
    .order("name");

  if (error) throw error;
  return data;
}

export async function saveProduct(
  input: ProductInput,
  productId?: string,
  imageFile?: File,
): Promise<void> {
  const client = getSupabase();
  let image = input.image;

  if (imageFile) {
    const safeFileName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const imagePath = `${crypto.randomUUID()}-${safeFileName}`;
    const { error: uploadError } = await client.storage
      .from("product-images")
      .upload(imagePath, imageFile, {
        cacheControl: "3600",
        contentType: imageFile.type,
      });

    if (uploadError) throw uploadError;
    image = client.storage.from("product-images").getPublicUrl(imagePath).data.publicUrl;
  }

  const product = { ...input, image, is_active: input.is_active ?? true };
  const { error } = productId
    ? await client.from("products").update(product).eq("id", productId)
    : await client.from("products").insert(product);

  if (error) throw error;
}

export async function removeProduct(productId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("products")
    .update({ is_active: false })
    .eq("id", productId);

  if (error) throw error;
}

export async function setProductActive(productId: string, isActive: boolean): Promise<void> {
  const { error } = await getSupabase()
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId);

  if (error) throw error;
}

export async function isCatalogAdmin(): Promise<boolean> {
  const { data, error } = await getSupabase().rpc("is_catalog_admin");

  if (error) throw error;
  return data;
}
