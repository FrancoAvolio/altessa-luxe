"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';

export interface CategoryRow {
  id: number;
  name: string;
}

interface Props {
  onChanged?: (names: string[]) => void; // notifica a la pÃ¡gina para refrescar el select/filtro
}

type CategoryManagerProps = { onChanged?: (names: string[]) => void; refreshToken?: number | string };

export default function CategoryManager({ onChanged, refreshToken }: CategoryManagerProps) {
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('categories').select('id, name').order('name');
      if (!error && data) {
        const arr = data as { id: number; name: string }[];
        setItems(arr);
        onChanged?.(arr.map((c) => c.name));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Suscripción en tiempo real para reflejar inserts/updates/deletes sin refrescar
    const channel = supabase
      .channel('categories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        load();
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch (_) {}
    };
  }, []);

  // Forzar recarga cuando cambie el token desde el padre (p. ej., al crear una categoría)
  useEffect(() => {
    if (refreshToken !== undefined) {
      load();
    }
  }, [refreshToken]);

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
      // Actualiza nombre en tabla categories
      const { error: upErr } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('id', row.id);
      if (upErr) throw upErr;

      // Sincroniza productos que usaban el nombre anterior
      const { error: prodErr } = await supabase
        .from('products')
        .update({ category: newName })
        .eq('category', row.name);
      if (prodErr) throw prodErr;

      await load();
    } catch (e) {
      console.error(e);
      alert('No se pudo renombrar la categorÃ­a');
    } finally {
      setLoading(false);
      cancelEdit();
    }
  };

  const remove = async (row: CategoryRow) => {
    if (!confirm(`Eliminar la categoría "${row.name}"? Los productos quedarán sin categoría.`)) return;
    setLoading(true);
    try {
      // Primero limpia productos
      const { error: prodErr } = await supabase
        .from('products')
        .update({ category: null })
        .eq('category', row.name);
      if (prodErr) throw prodErr;

      // Luego elimina la categorÃ­a
      const { error: delErr } = await supabase
        .from('categories')
        .delete()
        .eq('id', row.id);
      if (delErr) throw delErr;

      await load();
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar la categorÃ­a');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2 text-black">Gestionar categorías</h3>
      <div className="border rounded-md divide-y bg-white border border-black text-black">
        {items.length === 0 && (
          <div className="px-3 py-2 text-sm text-black/70">No hay categorís aún.</div>
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
                <Button onClick={() => beginEdit(row)} variant="secondary" className="cursor-pointer">Editar</Button>
                <Button onClick={() => remove(row)} variant="destructive" className="cursor-pointer">Eliminar</Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}



