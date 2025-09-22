import { supabase } from '@/supabase/supabase';

export interface CategoryRow {
  id: number;
  name: string;
}

type CategoryRowsResponse = {
  items: CategoryRow[];
  error?: string;
};

type CategoryNamesResponse = {
  items: string[];
  error?: string;
};

export async function fetchCategoryRows(): Promise<CategoryRowsResponse> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase categories error', error);
      return { items: [], error: error.message };
    }

    const rows = (data ?? []) as Array<{ id: number | null; name: string | null }>;
    const items = rows
      .map((row) => ({
        id: typeof row.id === 'number' ? row.id : -1,
        name: (row.name ?? '').toString().trim(),
      }))
      .filter((row): row is CategoryRow => row.id > 0 && row.name.length > 0);

    return { items };
  } catch (err) {
    console.error('fetchCategoryRows failed', err);
    return { items: [], error: 'No se pudieron cargar las categorias.' };
  }
}

export async function fetchCategoryNames(): Promise<CategoryNamesResponse> {
  const { items, error } = await fetchCategoryRows();
  if (error) {
    return { items: [], error };
  }

  const names = Array.from(new Set(items.map((row) => row.name))).sort((a, b) => a.localeCompare(b));
  return { items: names };
}
