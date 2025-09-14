"use client";

import { useState } from 'react';
import { supabase } from '../supabase/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export interface Category {
  id?: number;
  name: string;
}

interface CategoryFormProps {
  onSave: (category: Category) => void;
  onCancel: () => void;
}

export default function CategoryForm({ onSave, onCancel }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: value }])
        .select()
        .single();
      if (error) throw error;
      onSave({ id: data?.id, name: data?.name });
    } catch (err) {
      console.error(err);
      alert('No se pudo crear la categoría');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gold font-fancy">Agregar categoría</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label className="mb-1 block">Nombre de la categoría</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: RELOJES AAA+, Hombre, Mujer, ..."
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="cursor-pointer" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="cursor-pointer">{saving ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
