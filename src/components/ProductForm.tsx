'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase/supabase';
import { uploadImages, deleteImage } from '../supabase/storage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  images?: string[];
  category?: string | null;
}

type DbProductRow = {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category: string | null;
};

interface ProductFormProps {
  product?: Product;
  onSave: (product: Product) => void;
  onCancel: () => void;
  categories?: string[];
}

export default function ProductForm({ product, onSave, onCancel, categories }: ProductFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Product>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    image_url: product?.image_url || '',
    category: product?.category ?? ''
  });

  const [existingImages, setExistingImages] = useState<string[]>(
    product?.images?.length ? product.images! : (product?.image_url ? [product.image_url] : [])
  );
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<{ src: string; type: 'image' | 'video'; }[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [newUrls, setNewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(categories ?? []);

  useEffect(() => {
    if (product) {
      setExistingImages(product.images?.length ? product.images : (product.image_url ? [product.image_url] : []));
      setRemovedImages([]);
      setNewFiles([]);
      setNewPreviews([]);
      setNewUrls([]);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        image_url: product.image_url || '',
        category: product.category ?? ''
      });
    } else {
      setExistingImages([]);
    }
  }, [product]);

  useEffect(() => {
    const fromProps = (categories ?? []).map((entry) => entry?.toString().trim() ?? "").filter((value) => value.length > 0);
    const current = (formData.category ?? "").toString().trim();
    const merged = new Set<string>(fromProps);
    if (current) {
      merged.add(current);
    }
    setCategoryOptions(Array.from(merged).sort((a, b) => a.localeCompare(b)));
  }, [categories, formData.category]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setNewFiles(prev => [...prev, ...files]);
      const readers = files.map(f => new Promise<{ src: string; type: 'image' | 'video'; }>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve({ src: r.result as string, type: (f.type || '').startsWith('video') ? 'video' : 'image' });
        r.readAsDataURL(f);
      }));
      Promise.all(readers).then(previews => setNewPreviews(prev => [...prev, ...previews]));
    }
  };

  const removeExistingImage = (url: string) => {
    setRemovedImages(prev => [...prev, url]);
    setExistingImages(prev => prev.filter(u => u !== url));
  };
  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };
  const addUrl = () => {
    if (!urlInput) return;
    setNewUrls(prev => [...prev, urlInput]);
    setUrlInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const uploadedUrls = await uploadImages(newFiles);
      const remainingExisting = existingImages;
      const finalImages = [...remainingExisting, ...uploadedUrls, ...newUrls];
      const normalizedCategory = (formData.category ?? '').toString().trim() || null;

      if (product?.id) {
        const pid = product.id;

        // Borrar removidas
        const supabaseRemovals = removedImages.filter(u => u.includes('/storage/'));
        for (const url of supabaseRemovals) {
          await deleteImage(url);
        }
        if (removedImages.length) {
          await supabase
            .from('product_images')
            .delete()
            .eq('product_id', pid)
            .in('url', removedImages);
        }

        // Insertar nuevas
        const toInsert = [...uploadedUrls, ...newUrls].map((url, idx) => ({
          product_id: pid,
          url,
          position: remainingExisting.length + idx,
        }));
        if (toInsert.length) await supabase.from('product_images').insert(toInsert);

        // Actualizar producto
        const { data: updated, error: upErr } = await supabase
          .from('products')
          .update({
            name: formData.name,
            description: formData.description,
            price: formData.price,
            image_url: finalImages[0] || '',
            category: normalizedCategory,
          })
          .eq('id', pid)
          .select()
          .single();
        if (upErr) throw upErr;

        const updatedRow = (updated ?? null) as DbProductRow | null;
        if (!updatedRow) {
          throw new Error('No se pudo obtener el producto actualizado');
        }

        const normalized: Product = {
          id: updatedRow.id,
          name: updatedRow.name ?? formData.name,
          description: updatedRow.description ?? '',
          price: typeof updatedRow.price === 'number' ? updatedRow.price : formData.price,
          image_url: finalImages[0] ?? updatedRow.image_url ?? '',
          images: finalImages,
          category: updatedRow.category ?? normalizedCategory,
        };

        onSave(normalized);
      } else {
        // Crear producto primero
        const { data: created, error: insErr } = await supabase
          .from('products')
          .insert([{ name: formData.name, description: formData.description, price: formData.price, image_url: '', category: normalizedCategory }])
          .select()
          .single();
        if (insErr) throw insErr;
        const createdRow = (created ?? null) as DbProductRow | null;
        if (!createdRow) {
          throw new Error('No se pudo crear el producto');
        }
        const pid = createdRow.id;

        const toInsert = [...uploadedUrls, ...newUrls].map((url, idx) => ({ product_id: pid, url, position: idx }));
        if (toInsert.length) await supabase.from('product_images').insert(toInsert);

        const cover = toInsert[0]?.url || finalImages[0] || '';
        if (cover) await supabase.from('products').update({ image_url: cover }).eq('id', pid);

        const normalized: Product = {
          id: pid,
          name: createdRow.name ?? formData.name,
          description: createdRow.description ?? '',
          price: typeof createdRow.price === 'number' ? createdRow.price : formData.price,
          image_url: cover || createdRow.image_url || '',
          images: finalImages.length ? finalImages : toInsert.map((t) => t.url),
          category: createdRow.category ?? normalizedCategory,
        };

        onSave(normalized);
      }
    } catch (err) {
      console.error(err);
      alert('Error al guardar producto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full">
        <h2 className="text-xl font-bold mb-4 text-black">{product ? 'Editar Producto' : 'Crear Producto'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label className="mb-1 block">Nombre</Label>
            <Input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nombre del producto" required />
          </div>
          <div className="mb-4">
            <Label className="mb-1 block">Descripción</Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gold rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              placeholder="Descripción del producto"
            />
          </div>
          <div className="mb-4">
            <Label className="mb-1 block">Categoría</Label>
            {categoryOptions.length ? (
              <select
                name="category"
                value={formData.category ?? ''}
                onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gold rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[var(--gold)] bg-white"
              >
                <option value="">Sin categoría</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <Input
                name="category"
                value={formData.category ?? ''}
                onChange={handleChange}
                placeholder="Escribe una categoría"
              />
            )}
            <p className="text-xs text-black/70 mt-1">Selecciona una existente o deja vacío.</p>
          </div>
          <div className="mb-4">
            <Label className="mb-1 block">Precio</Label>
            <Input type="number" name="price" value={formData.price} onChange={handleChange} step="0.01" placeholder="0.00" required />
          </div>

          <div className="mb-4">
            <Label className="mb-1 block">Imágenes/Videos del producto</Label>
            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {existingImages.map((url) => {
                  const isVid = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
                  return (
                    <div key={url} className="relative group">
                      {isVid ? (
                        <div className="w-full h-24 rounded border bg-black/80 text-white flex items-center justify-center">Video</div>
                      ) : (
                        <div className="relative w-full h-24 rounded border overflow-hidden">
            <Image
              src={url}
              alt="Imagen existente"
              fill
              className="object-cover"
              sizes="96px"
              unoptimized
            />
          </div>
                      )}
                      <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 cursor-pointer" onClick={() => removeExistingImage(url)} title="Eliminar">×</Button>
                    </div>
                  );
                })}
              </div>
            )}

            {newPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {newPreviews.map((p, idx) => (
                  <div key={idx} className="relative group">
                    {p.type === 'video' ? (
                      <div className="w-full h-24 rounded border bg-black/80 text-white flex items-center justify-center">Video</div>
                    ) : (
                      <div className="relative w-full h-24 rounded border overflow-hidden">
            <Image
              src={p.src}
              alt={`Nuevo archivo ${idx + 1}`}
              fill
              className="object-cover"
              sizes="96px"
              unoptimized
            />
          </div>
                    )}
                    <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 cursor-pointer" onClick={() => removeNewFile(idx)} title="Quitar">×</Button>
                  </div>
                ))}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFilesChange} className="hidden" />
            <Button className='cursor-pointer' type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>+ Agregar imágenes/videos</Button>
            <p className="text-xs text-black/70 mt-1">Puedes seleccionar varias imágenes/videos (hasta 50MB por archivo)</p>

            <div className="flex items-center gap-2 mt-3">
              <Input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" />
              <Button type="button" variant="outline" className="cursor-pointer" onClick={addUrl}>Agregar URL</Button>
            </div>
            {newUrls.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {newUrls.map((u, i) => (
                  <span key={i} className="text-xs bg-white text-black px-2 py-1 rounded border">{u}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button className='cursor-pointer' type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button className='cursor-pointer' type="submit" disabled={uploading}>{uploading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}


