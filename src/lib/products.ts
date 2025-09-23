import { supabase } from "@/supabase/supabase";
import { fetchCategoryNames } from "@/lib/categories";

export interface ProductWithImages {
  id?: number;
  name: string;
  description: string;
  image_url: string;
  images?: string[];
  category?: string | null;
}

type ProductsResponse = {
  items: ProductWithImages[];
  error?: string;
};

type CategoriesResponse = {
  items: string[];
  error?: string;
};

type ProductQueryRow = {
  id: number | null;
  name: string | null;
  description: string | null;
  price?: number | null;
  image_url: string | null;
  category: string | null;
  product_images?: Array<{
    url: string | null;
    position: number | null;
  }> | null;
};

export async function fetchProductsWithImages(): Promise<ProductsResponse> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
          id,
          name,
          description,
          price,
          image_url,
          category,
          product_images ( url, position )
        `
      )
      .order("position", { foreignTable: "product_images", ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error("Supabase products error", error);
      return { items: [], error: error.message };
    }

    const rows = (data ?? []) as ProductQueryRow[];
    const normalized = rows.map((raw) => {
      const id = typeof raw.id === "number" ? raw.id : undefined;
      const name = typeof raw.name === "string" ? raw.name : "";
      const description =
        typeof raw.description === "string" ? raw.description : "";
      const price =
        typeof raw.price === "number" ? raw.price : Number(raw.price ?? 0);
      const cover = typeof raw.image_url === "string" ? raw.image_url : "";
      const category =
        typeof raw.category === "string"
          ? raw.category
          : (raw.category ?? null);

      const joined = Array.isArray(raw.product_images)
        ? raw.product_images
            .map((item) => (typeof item?.url === "string" ? item.url : ""))
            .filter((url): url is string => url.length > 0)
        : [];

      const combined = [...joined, cover].filter(
        (url): url is string => typeof url === "string" && url.length > 0
      );
      const seen = new Set<string>();
      const images = combined.filter((url) => {
        if (seen.has(url)) return false;
        seen.add(url);
        return true;
      });

      return {
        id,
        name,
        description,
        image_url: cover,
        images,
        category,
      } satisfies ProductWithImages;
    });

    return { items: normalized };
  } catch (err) {
    console.error("fetchProductsWithImages failed", err);
    return { items: [], error: "No se pudieron cargar los productos." };
  }
}

export async function fetchCategoriesList(): Promise<CategoriesResponse> {
  return fetchCategoryNames();
}
