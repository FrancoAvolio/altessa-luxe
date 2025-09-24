"use client";

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { fetchCategoriesWithSubcategories, type CategoryWithSubcategories, createSubcategory, deleteSubcategory } from '@/lib/categories';
import { queryKeys } from '@/lib/queryKeys';

type CategoryManagerProps = { onChanged?: (names: string[]) => void; refreshToken?: number | string };

const categoriesWithSubcategoriesQueryFn = async (): Promise<CategoryWithSubcategories[]> => {
  const { items, error } = await fetchCategoriesWithSubcategories();
  if (error) throw new Error(error);
  return items;
};

export default function CategoryManager({ onChanged, refreshToken }: CategoryManagerProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newSubcategoryValues, setNewSubcategoryValues] = useState<Record<number, string>>({});

  const { data: categories = [], isFetching } = useQuery<CategoryWithSubcategories[]>({
    queryKey: [queryKeys.categoryRows, 'with-subcategories'],
    queryFn: categoriesWithSubcategoriesQueryFn,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (onChanged) {
      onChanged(categories.map((row) => row.name));
    }
  }, [categories, onChanged]);

  useEffect(() => {
    if (refreshToken !== undefined) {
      queryClient.invalidateQueries({ queryKey: [queryKeys.categoryRows, 'with-subcategories'] });
    }
  }, [refreshToken, queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel('categories-subcategories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.categoryRows, 'with-subcategories'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.categoryRows, 'with-subcategories'] });
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore cleanup errors
      }
    };
  }, [queryClient]);

  const beginEditCategory = (category: CategoryWithSubcategories) => {
    setEditingCategoryId(category.id);
    setEditValue(category.name);
  };

  const beginEditSubcategory = (subcategoryId: number, name: string) => {
    setEditingSubcategoryId(subcategoryId);
    setEditValue(name);
  };

  const cancelEdit = () => {
    setEditingCategoryId(null);
    setEditingSubcategoryId(null);
    setEditValue('');
  };

  const saveEditCategory = async (category: CategoryWithSubcategories) => {
    const newName = editValue.trim();
    if (!newName || newName === category.name) {
      cancelEdit();
      return;
    }
    setLoading(true);
    try {
      const { error: upErr } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('id', category.id);
      if (upErr) throw upErr;

      const { error: prodErr } = await supabase
        .from('products')
        .update({ category: newName })
        .eq('category', category.name);
      if (prodErr) throw prodErr;

      queryClient.invalidateQueries({ queryKey: [queryKeys.categoryRows, 'with-subcategories'] });
    } catch (e) {
      console.error(e);
      alert('No se pudo renombrar la categoria');
    } finally {
      setLoading(false);
      cancelEdit();
    }
  };

  const removeCategory = async (category: CategoryWithSubcategories) => {
    if (!confirm(`Eliminar la categoria "${category.name}"? Los productos quedaran sin categoria y se eliminaran las subcategorias.`)) return;
    setLoading(true);
    try {
      // First delete all subcategories (cascade should handle this, but doing it explicitly)
      if (category.subcategories.length > 0) {
        const { error: subDelErr } = await supabase
          .from('subcategories')
          .delete()
          .in('category_id', category.subcategories.map(sub => sub.id));
        if (subDelErr) throw subDelErr;
      }

      const { error: prodErr } = await supabase
        .from('products')
        .update({ category: null, subcategory: null })
        .eq('category', category.name);
      if (prodErr) throw prodErr;

      const { error: delErr } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);
      if (delErr) throw delErr;

      queryClient.invalidateQueries({ queryKey: [queryKeys.categoryRows, 'with-subcategories'] });
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar la categoria');
    } finally {
      setLoading(false);
    }
  };

  const addSubcategory = async (categoryId: number) => {
    const name = newSubcategoryValues[categoryId]?.trim();
    if (!name) return;

    setLoading(true);
    try {
      const { success, error } = await createSubcategory(name, categoryId);
      if (!success) throw new Error(error);

      setNewSubcategoryValues(prev => ({ ...prev, [categoryId]: '' }));
      queryClient.invalidateQueries({ queryKey: [queryKeys.categoryRows, 'with-subcategories'] });
    } catch (e) {
      console.error(e);
      alert('No se pudo crear la subcategoría');
    } finally {
      setLoading(false);
    }
  };

  const saveEditSubcategory = async (subcategoryId: number) => {
    const newName = editValue.trim();
    if (!newName) {
      cancelEdit();
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('subcategories')
        .update({ name: newName })
        .eq('id', subcategoryId);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: [queryKeys.categoryRows, 'with-subcategories'] });
    } catch (e) {
      console.error(e);
      alert('No se pudo renombrar la subcategoría');
    } finally {
      setLoading(false);
      cancelEdit();
    }
  };

  const removeSubcategory = async (subcategoryId: number, name: string) => {
    if (!confirm(`Eliminar la subcategoría "${name}"? Los productos quedarán sin subcategoría.`)) return;

    setLoading(true);
    try {
      const { success, error } = await deleteSubcategory(subcategoryId);
      if (!success) throw new Error(error);

      // Update products to remove subcategory reference
      const { error: prodErr } = await supabase
        .from('products')
        .update({ subcategory_id: null, subcategory: null })
        .eq('subcategory_id', subcategoryId);
      if (prodErr) throw prodErr;

      queryClient.invalidateQueries({ queryKey: [queryKeys.categoryRows, 'with-subcategories'] });
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar la subcategoría');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSubcategoryChange = (categoryId: number, value: string) => {
    setNewSubcategoryValues(prev => ({ ...prev, [categoryId]: value }));
  };

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2 text-black">Gestionar categorias y subcategorías</h3>
      <div className="border rounded-md divide-y bg-white border border-black text-black">
        {categories.length === 0 && !isFetching && (
          <div className="px-3 py-2 text-sm text-black/70">No hay categorias aun.</div>
        )}
        {categories.map((category) => (
          <div key={category.id} className="border-b border-gray-200 last:border-b-0">
            {/* Category header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
              {editingCategoryId === category.id ? (
                <>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1"
                    placeholder="Nombre de la categoría"
                  />
                  <Button onClick={() => saveEditCategory(category)} disabled={loading} className="cursor-pointer">
                    Guardar
                  </Button>
                  <Button onClick={cancelEdit} variant="outline" className="cursor-pointer">
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{category.name}</span>
                  <Button
                    onClick={() => beginEditCategory(category)}
                    variant="secondary"
                    disabled={loading}
                    className="cursor-pointer"
                    size="sm"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() => removeCategory(category)}
                    variant="destructive"
                    disabled={loading}
                    className="cursor-pointer"
                    size="sm"
                  >
                    Eliminar
                  </Button>
                </>
              )}
            </div>

            {/* Subcategories */}
            <div className="pl-6 pr-3 pb-2">
              {category.subcategories.length === 0 && (
                <div className="py-2 text-xs text-black/60 italic">Sin subcategorías</div>
              )}
              {category.subcategories.map((subcategory) => (
                <div key={subcategory.id} className="flex items-center gap-2 py-1">
                  {editingSubcategoryId === subcategory.id ? (
                    <>
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 ml-4"
                        placeholder="Nombre de la subcategoría"
                      />
                      <Button onClick={() => saveEditSubcategory(subcategory.id)} disabled={loading} className="cursor-pointer" size="sm">
                        Guardar
                      </Button>
                      <Button onClick={cancelEdit} variant="outline" className="cursor-pointer" size="sm">
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm ml-4">└ {subcategory.name}</span>
                      <Button
                        onClick={() => beginEditSubcategory(subcategory.id, subcategory.name)}
                        variant="secondary"
                        disabled={loading}
                        className="cursor-pointer"
                        size="sm"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => removeSubcategory(subcategory.id, subcategory.name)}
                        variant="destructive"
                        disabled={loading}
                        className="cursor-pointer"
                        size="sm"
                      >
                        Eliminar
                      </Button>
                    </>
                  )}
                </div>
              ))}

              {/* Add new subcategory */}
              <div className="flex items-center gap-2 py-2">
                <Input
                  value={newSubcategoryValues[category.id] || ''}
                  onChange={(e) => handleNewSubcategoryChange(category.id, e.target.value)}
                  className="flex-1 ml-4"
                  placeholder="Nueva subcategoría..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addSubcategory(category.id);
                    }
                  }}
                />
                <Button
                  onClick={() => addSubcategory(category.id)}
                  disabled={loading || !newSubcategoryValues[category.id]?.trim()}
                  className="cursor-pointer"
                  size="sm"
                >
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        ))}
        {isFetching && (
          <div className="px-3 py-2 text-sm text-black/70">Actualizando...</div>
        )}
      </div>
    </div>
  );
}
