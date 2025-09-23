import { supabase } from "@/supabase/supabase";

export interface DBProduct {
  id: number;
  name: string;
  description: string | null;
  price?: number | null;
  subcategory: string | null;
  image_url: string | null;
  category?: string | null;
}

export interface ProductImageRow {
  product_id: number;
  url: string;
  position: number;
}

export interface RelatedProduct extends DBProduct {
  images: string[];
}

export async function fetchProduct(id: number): Promise<DBProduct> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as DBProduct;
}

export async function fetchProductImages(id: number): Promise<string[]> {
  const { data, error } = await supabase
    .from("product_images")
    .select("url, position")
    .eq("product_id", id)
    .order("position", { ascending: true });

  if (error) throw error;
  const rows = (data ?? []) as ProductImageRow[];
  return rows.map((r) => r.url);
}

export async function fetchRelatedProducts(
  product: DBProduct
): Promise<RelatedProduct[]> {
  const baseQuery = supabase.from("products").select("*").neq("id", product.id);
  const byCat = (product.category ?? "").trim();

  const { data: primary } = byCat
    ? await baseQuery.eq("category", byCat)
    : await baseQuery;

  let pool = (primary ?? []) as DBProduct[];

  // fallback si no hay suficientes
  if (pool.length < 4) {
    const { data: extra } = await supabase
      .from("products")
      .select("*")
      .neq("id", product.id)
      .limit(20);
    if (extra) {
      const map = new Map<number, DBProduct>();
      pool.forEach((p) => map.set(p.id, p));
      (extra as DBProduct[]).forEach((p) => {
        if (!map.has(p.id)) map.set(p.id, p);
      });
      pool = Array.from(map.values());
    }
  }

  if (!pool.length) return [];

  const ids = pool.map((p) => p.id);
  const { data: imgs } = await supabase
    .from("product_images")
    .select("product_id, url, position")
    .in("product_id", ids)
    .order("position", { ascending: true });

  const rows = (imgs ?? []) as ProductImageRow[];
  const grouped: Record<number, string[]> = {};
  for (const r of rows) {
    if (!grouped[r.product_id]) grouped[r.product_id] = [];
    grouped[r.product_id].push(r.url);
  }

  const enriched: RelatedProduct[] = pool.map((p) => ({
    ...p,
    images: grouped[p.id]?.length
      ? grouped[p.id]
      : p.image_url
        ? [p.image_url]
        : [],
  }));

  return enriched.sort(() => Math.random() - 0.5).slice(0, 4);
}
