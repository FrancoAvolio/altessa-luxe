"use client";

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { fetchCategoryRows, type CategoryRow } from '@/lib/categories';
import { queryKeys } from '@/lib/queryKeys';

type CategoryManagerProps = { onChanged?: (names: string[]) => void; refreshToken?: number | string };

const categoryRowsQueryFn = async (): Promise<CategoryRow[]> => {
  const { items, error } = await fetchCategoryRows();
  if (error) throw new Error(error);
  return items;
};

export default function CategoryManager({ onChanged, refreshToken }: CategoryManagerProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: items = [], isFetching } = useQuery<CategoryRow[]>({
    queryKey: queryKeys.categoryRows,
    queryFn: categoryRowsQueryFn,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (onChanged) {
      onChanged(items.map((row) => row.name));
    }
  }, [items, onChanged]);

  useEffect(() => {
    if (refreshToken !== undefined) {
      queryClient.invalidateQueries({ queryKey: queryKeys.categoryRows });
    }
  }, [refreshToken, queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel('categories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.categoryRows });
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

  const beginEdit = (row: CategoryRow) => {
    setEditingId(row.id);
    setEditValue(row.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (row: CategoryRow) => {
    const newName = editValue.trim();
    if (!newName || newName === row.name) {
      cancelEdit();
      return;
    }
    setLoading(true);
    try {
      const { error: upErr } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('id', row.id);
      if (upErr) throw upErr;

      const { error: prodErr } = await supabase
        .from('products')
        .update({ category: newName })
        .eq('category', row.name);
      if (prodErr) throw prodErr;

      queryClient.setQueryData<CategoryRow[]>(queryKeys.categoryRows, (prev = []) =>
        prev.map((item) => (item.id === row.id ? { ...item, name: newName } : item)));
    } catch (e) {
      console.error(e);
      alert('No se pudo renombrar la categoria');
    } finally {
      setLoading(false);
      cancelEdit();
    }
  };

  const remove = async (row: CategoryRow) => {
    if (!confirm(`Eliminar la categoria "${row.name}"? Los productos quedaran sin categoria.`)) return;
    setLoading(true);
    try {
      const { error: prodErr } = await supabase
        .from('products')
        .update({ category: null })
        .eq('category', row.name);
      if (prodErr) throw prodErr;

      const { error: delErr } = await supabase
        .from('categories')
        .delete()
        .eq('id', row.id);
      if (delErr) throw delErr;

      queryClient.setQueryData<CategoryRow[]>(queryKeys.categoryRows, (prev = []) =>
        prev.filter((item) => item.id !== row.id));
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar la categoria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2 text-black">Gestionar categorias</h3>
      <div className="border rounded-md divide-y bg-white border border-black text-black">
        {items.length === 0 && !isFetching && (
          <div className="px-3 py-2 text-sm text-black/70">No hay categorias aun.</div>
        )}
        {items.map((row) => (
          <div key={row.id} className="flex items-center gap-2 px-3 py-2">
            {editingId === row.id ? (
              <>
                <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1" />
                <Button onClick={() => saveEdit(row)} disabled={loading} className="cursor-pointer">Guardar</Button>
                <Button onClick={cancelEdit} variant="outline" className="cursor-pointer">Cancelar</Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{row.name}</span>
                <Button onClick={() => beginEdit(row)} variant="secondary" disabled={loading} className="cursor-pointer">Editar</Button>
                <Button onClick={() => remove(row)} variant="destructive" disabled={loading} className="cursor-pointer">Eliminar</Button>
              </>
            )}
          </div>
        ))}
        {isFetching && (
          <div className="px-3 py-2 text-sm text-black/70">Actualizando...</div>
        )}
      </div>
    </div>
  );
}
