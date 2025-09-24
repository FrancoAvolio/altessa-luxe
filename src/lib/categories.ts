import { supabase } from '@/supabase/supabase';

export interface CategoryRow {
  id: number;
  name: string;
}

export interface SubcategoryRow {
  id: number;
  name: string;
  category_id: number;
}

export interface CategoryWithSubcategories {
  id: number;
  name: string;
  subcategories: SubcategoryRow[];
}

type CategoryRowsResponse = {
  items: CategoryRow[];
  error?: string;
};

type CategoryNamesResponse = {
  items: string[];
  error?: string;
};

type SubcategoriesResponse = {
  items: SubcategoryRow[];
  error?: string;
};

type CategoriesWithSubcategoriesResponse = {
  items: CategoryWithSubcategories[];
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

export async function fetchSubcategories(): Promise<SubcategoriesResponse> {
  try {
    const { data, error } = await supabase
      .from('subcategories')
      .select('id, name, category_id')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase subcategories error', error);
      return { items: [], error: error.message };
    }

    const rows = (data ?? []) as Array<{
      id: number | null;
      name: string | null;
      category_id: number | null;
    }>;
    const items = rows
      .map((row) => ({
        id: typeof row.id === 'number' ? row.id : -1,
        name: (row.name ?? '').toString().trim(),
        category_id: typeof row.category_id === 'number' ? row.category_id : -1,
      }))
      .filter((row): row is SubcategoryRow =>
        row.id > 0 && row.name.length > 0 && row.category_id > 0
      );

    return { items };
  } catch (err) {
    console.error('fetchSubcategories failed', err);
    return { items: [], error: 'No se pudieron cargar las subcategorías.' };
  }
}

export async function fetchCategoriesWithSubcategories(): Promise<CategoriesWithSubcategoriesResponse> {
  try {
    const { items: categories, error: catError } = await fetchCategoryRows();
    if (catError) {
      return { items: [], error: catError };
    }

    const { items: subcategories, error: subError } = await fetchSubcategories();
    if (subError) {
      return { items: [], error: subError };
    }

    const items = categories.map(category => ({
      ...category,
      subcategories: subcategories.filter(sub => sub.category_id === category.id)
    }));

    return { items };
  } catch (err) {
    console.error('fetchCategoriesWithSubcategories failed', err);
    return { items: [], error: 'No se pudieron cargar las categorías con subcategorías.' };
  }
}

export async function createSubcategory(name: string, categoryId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('subcategories')
      .insert([{ name: name.trim(), category_id: categoryId }]);

    if (error) {
      console.error('Create subcategory error', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('createSubcategory failed', err);
    return { success: false, error: 'No se pudo crear la subcategoría.' };
  }
}

export async function deleteSubcategory(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('subcategories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete subcategory error', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('deleteSubcategory failed', err);
    return { success: false, error: 'No se pudo eliminar la subcategoría.' };
  }
}
