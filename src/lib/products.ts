import { supabase } from '@/supabase/supabase';

export interface ProductWithImages {
  id?: number;
  name: string;
  description: string;
  price: number;
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

type DbProductRow = {
  id: number | null;
  name: string | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category: string | null;
};

export async function fetchProductsWithImages(): Promise<ProductsResponse> {
  try {
    const { data: base, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Supabase products error', error);
      return { items: [], error: error.message };
    }

    const products = (base ?? []) as DbProductRow[];
    const ids = products.map((p) => p.id).filter((id): id is number => typeof id === 'number');

    let grouped: Record<number, string[]> = {};
    if (ids.length) {
      const { data: images, error: imgErr } = await supabase
        .from('product_images')
        .select('product_id, url, position')
        .in('product_id', ids)
        .order('position', { ascending: true });

      if (imgErr) {
        console.error('Supabase product_images error', imgErr);
      } else if (images) {
        grouped = (images as { product_id: number; url: string }[]).reduce<Record<number, string[]>>((acc, row) => {
          if (!acc[row.product_id]) acc[row.product_id] = [];
          acc[row.product_id].push(row.url);
          return acc;
        }, {});
      }
    }

    const normalized = products.map((raw) => {
      const id = typeof raw.id === 'number' ? raw.id : undefined;
      const name = typeof raw.name === 'string' ? raw.name : '';
      const description = typeof raw.description === 'string' ? raw.description : '';
      const price = typeof raw.price === 'number' ? raw.price : Number(raw.price ?? 0);
      const imageUrl = typeof raw.image_url === 'string' ? raw.image_url : '';
      const category = typeof raw.category === 'string' ? raw.category : raw.category ?? null;
      const images = id ? grouped[id] ?? (imageUrl ? [imageUrl] : []) : imageUrl ? [imageUrl] : [];

      return {
        id,
        name,
        description,
        price,
        image_url: imageUrl,
        images,
        category,
      } satisfies ProductWithImages;
    });

    return { items: normalized };
  } catch (err) {
    console.error('fetchProductsWithImages failed', err);
    return { items: [], error: 'No se pudieron cargar los productos.' };
  }
}

export async function fetchCategoriesList(): Promise<CategoriesResponse> {
  try {
    const { data, error } = await supabase.from('categories').select('name');
    if (error) {
      console.error('Supabase categories error', error);
      return { items: [], error: error.message };
    }
    const raw = (data ?? []) as { name?: string | null }[];
    const names = raw
      .map((item) => (item?.name ?? '').toString().trim())
      .filter((name) => name.length > 0);

    const unique = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    return { items: unique };
  } catch (err) {
    console.error('fetchCategoriesList failed', err);
    return { items: [], error: 'No se pudieron cargar las categorÃ­as.' };
  }
}
