import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { ArrowLeft, Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { Product } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  isCatalogAdmin,
  listAdminProducts,
  ProductInput,
  removeProduct,
  saveProduct,
  setProductActive,
} from "@/lib/catalog";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const emptyForm: ProductInput = {
  name: "",
  price: 0,
  category: "",
  image: "",
  is_active: true,
  description: "",
  pack_size: "",
  ingredients: "",
  allergens: "",
  is_available: true,
  stock_quantity: null,
  max_order_quantity: 10,
};

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setIsLoadingSession(false);
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        setSession(data.session);
      })
      .catch((error: Error) => {
        console.error("Failed to restore the admin session", error);
        setPageError("Could not check the admin session. Please reload and try again.");
      })
      .finally(() => setIsLoadingSession(false));

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(null);
      setCatalog([]);
      return;
    }

    let isMounted = true;
    setIsAdmin(null);
    isCatalogAdmin()
      .then((allowed) => {
        if (isMounted) setIsAdmin(allowed);
      })
      .catch((error: Error) => {
        console.error("Failed to verify catalog administrator access", error);
        if (isMounted) {
          setIsAdmin(false);
          setPageError("Could not verify admin access. Check the Supabase setup and try again.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;
    listAdminProducts()
      .then((products) => {
        if (isMounted) setCatalog(products);
      })
      .catch((error: Error) => {
        console.error("Failed to load products for administration", error);
        if (isMounted) setPageError("Could not load products. Check the Supabase policies and try again.");
      });

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    setPageError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setPassword("");
    } catch (error) {
      console.error("Failed to sign in to the catalog admin", error);
      setPageError(error instanceof Error ? error.message : "Could not sign in.");
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingProductId(null);
    setImageFile(undefined);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const refreshCatalog = async () => {
    const products = await listAdminProducts();
    setCatalog(products);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPageError("");

    if (!form.name.trim() || !form.category.trim() || form.price <= 0) {
      setPageError("Enter a product name, category, and price greater than zero.");
      return;
    }
    if (!Number.isInteger(form.max_order_quantity) || form.max_order_quantity < 1) {
      setPageError("Maximum quantity per order must be a whole number greater than zero.");
      return;
    }
    if (!editingProductId && !imageFile) {
      setPageError("Choose an image for the new product.");
      return;
    }
    if (imageFile && !["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) {
      setPageError("Use a JPG, PNG, or WebP image.");
      return;
    }
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      setPageError("Image files must be 5 MB or smaller.");
      return;
    }

    setIsSaving(true);
    try {
      await saveProduct({
        ...form,
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        pack_size: form.pack_size.trim(),
        ingredients: form.ingredients.trim(),
        allergens: form.allergens.trim(),
      }, editingProductId ?? undefined, imageFile);
      await refreshCatalog();
      resetForm();
    } catch (error) {
      console.error("Failed to save product", error);
      setPageError(error instanceof Error ? error.message : "Could not save this product.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image,
      is_active: product.is_active ?? true,
      description: product.description ?? "",
      pack_size: product.pack_size ?? "",
      ingredients: product.ingredients ?? "",
      allergens: product.allergens ?? "",
      is_available: product.is_available ?? true,
      stock_quantity: product.stock_quantity ?? null,
      max_order_quantity: product.max_order_quantity ?? 10,
    });
    setImageFile(undefined);
    if (imageInputRef.current) imageInputRef.current.value = "";
    setPageError("");
  };

  const handleRemove = async (product: Product) => {
    if (!window.confirm(`Hide "${product.name}" from the storefront? You can show it again later.`)) return;

    setPageError("");
    try {
      await removeProduct(product.id);
      await refreshCatalog();
      if (editingProductId === product.id) resetForm();
    } catch (error) {
      console.error("Failed to remove product", error);
      setPageError(error instanceof Error ? error.message : "Could not remove this product.");
    }
  };

  const handleToggleActive = async (product: Product) => {
    setPageError("");
    try {
      await setProductActive(product.id, product.is_active === false);
      await refreshCatalog();
    } catch (error) {
      console.error("Failed to change product visibility", error);
      setPageError(error instanceof Error ? error.message : "Could not change product visibility.");
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Failed to sign out from the admin account", error);
      setPageError(error.message);
    } else {
      setPageError("");
      resetForm();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-warm px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link to="/" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to store
            </Link>
            <h1 className="text-3xl font-bold text-primary">Product management</h1>
          </div>
          {isAdmin && (
            <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
          )}
        </div>

        {!isSupabaseConfigured ? (
          <section className="rounded-lg border bg-background p-6">
            <h2 className="mb-2 text-xl font-semibold">Connect Supabase to manage products</h2>
            <p className="text-muted-foreground">
              Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local environment and Vercel project settings,
              then run the SQL setup in supabase/schema.sql and supabase/seed.sql.
            </p>
          </section>
        ) : isLoadingSession ? (
          <p>Checking admin session...</p>
        ) : !session ? (
          <form onSubmit={handleSignIn} className="mx-auto grid max-w-md gap-4 rounded-lg border bg-background p-6">
            <h2 className="text-xl font-semibold">Admin sign in</h2>
            <p className="text-sm text-muted-foreground">Customer accounts are not required. Use the catalog administrator account.</p>
            <div className="grid gap-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <Button type="submit">Sign in</Button>
          </form>
        ) : isAdmin === null ? (
          <p>Verifying administrator access...</p>
        ) : !isAdmin ? (
          <section className="rounded-lg border bg-background p-6">
            <h2 className="mb-2 text-xl font-semibold">This account is not a catalog administrator</h2>
            <p className="mb-4 text-muted-foreground">Add this user to the Supabase admin_users table, then sign in again.</p>
            <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
          </section>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <form onSubmit={handleSave} className="grid content-start gap-4 rounded-lg border bg-background p-6">
              <h2 className="text-xl font-semibold">{editingProductId ? "Edit product" : "Add a product"}</h2>
              <div className="grid gap-2">
                <Label htmlFor="product-name">Product name</Label>
                <Input id="product-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-price">Price (₹)</Label>
                <Input id="product-price" type="number" min="0.01" step="0.01" required value={form.price || ""} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-category">Category</Label>
                <Input id="product-category" required placeholder="e.g. Powders" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-description">Description</Label>
                <Textarea id="product-description" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-pack-size">Pack size / net quantity</Label>
                <Input id="product-pack-size" placeholder="e.g. 500 g" value={form.pack_size} onChange={(event) => setForm({ ...form, pack_size: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-ingredients">Ingredients</Label>
                <Textarea id="product-ingredients" rows={2} value={form.ingredients} onChange={(event) => setForm({ ...form, ingredients: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-allergens">Allergens</Label>
                <Input id="product-allergens" placeholder="e.g. Contains peanuts" value={form.allergens} onChange={(event) => setForm({ ...form, allergens: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-stock-quantity">Quantity in stock</Label>
                <Input
                  id="product-stock-quantity"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Leave blank if not tracking"
                  value={form.stock_quantity ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm({ ...form, stock_quantity: value === "" ? null : Number(value) });
                  }}
                />
                <p className="text-xs text-muted-foreground">Leave blank if you are not tracking a stock count.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-max-order-quantity">Maximum quantity per order</Label>
                <Input
                  id="product-max-order-quantity"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={form.max_order_quantity}
                  onChange={(event) => setForm({ ...form, max_order_quantity: Number(event.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="product-available" checked={form.is_available} onCheckedChange={(checked) => setForm({ ...form, is_available: checked === true })} />
                <Label htmlFor="product-available">In stock and available to order</Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-image">Product image {editingProductId ? "(optional replacement)" : ""}</Label>
                <Input ref={imageInputRef} id="product-image" type="file" accept="image/jpeg,image/png,image/webp" required={!editingProductId} onChange={(event) => setImageFile(event.target.files?.[0])} />
                <p className="text-xs text-muted-foreground">JPG, PNG, or WebP, up to 5 MB.</p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving} className="gap-2">
                  <Plus className="h-4 w-4" /> {isSaving ? "Saving..." : editingProductId ? "Save changes" : "Add product"}
                </Button>
                {editingProductId && <Button type="button" variant="outline" onClick={resetForm}>Cancel edit</Button>}
              </div>
            </form>

            <section className="rounded-lg border bg-background p-6">
              <h2 className="mb-4 text-xl font-semibold">Products ({catalog.length})</h2>
              {catalog.length === 0 ? (
                <p className="text-muted-foreground">No products yet. Run the provided seed SQL or add the first product.</p>
              ) : (
                <ul className="space-y-3">
                  {catalog.map((product) => (
                    <li key={product.id} className="flex items-center gap-3 rounded-md border p-3">
                      <img src={product.image} alt="" className="h-16 w-16 rounded object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.category} · ₹{product.price} · Max {product.max_order_quantity ?? 10} per order
                        </p>
                        {product.is_active === false && <p className="text-xs text-destructive">Hidden from store</p>}
                      </div>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${product.name}`} onClick={() => handleEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={product.is_active === false ? `Show ${product.name}` : `Hide ${product.name}`}
                        onClick={() => product.is_active === false ? handleToggleActive(product) : handleRemove(product)}
                      >
                        {product.is_active === false
                          ? <Eye className="h-4 w-4" />
                          : <EyeOff className="h-4 w-4 text-destructive" />}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {pageError && (
          <p role="alert" className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {pageError}
          </p>
        )}
      </div>
    </main>
  );
};

export default Admin;
