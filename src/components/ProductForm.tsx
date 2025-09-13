'use client';

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
}

interface ProductFormProps {
  product?: Product;
  onSave: (product: Product) => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Product>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    image_url: product?.image_url || ''
  });

  const [existingImages, setExistingImages] = useState<string[]>(
    product?.images?.length ? product.images! : (product?.image_url ? [product.image_url] : [])
  );
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [newUrls, setNewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

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
        image_url: product.image_url || ''
      });
    } else {
      setExistingImages([]);
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setNewFiles(prev => [...prev, ...files]);
      const readers = files.map(f => new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(f);
      }));
      Promise.all(readers).then(imgs => setNewPreviews(prev => [...prev, ...imgs]));
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
          })
          .eq('id', pid)
          .select()
          .single();
        if (upErr) throw upErr;

        onSave({ ...(updated as any), images: finalImages });
      } else {
        // Crear producto primero
        const { data: created, error: insErr } = await supabase
          .from('products')
          .insert([{ name: formData.name, description: formData.description, price: formData.price, image_url: '' }])
          .select()
          .single();
        if (insErr) throw insErr;
        const pid = created.id as number;

        const toInsert = [...uploadedUrls, ...newUrls].map((url, idx) => ({ product_id: pid, url, position: idx }));
        if (toInsert.length) await supabase.from('product_images').insert(toInsert);

        const cover = toInsert[0]?.url || '';
        if (cover) await supabase.from('products').update({ image_url: cover }).eq('id', pid);

        onSave({ ...(created as any), image_url: cover, images: toInsert.map(t => t.url) });
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
        <h2 className="text-xl font-bold mb-4 text-gray-800">{product ? 'Editar Producto' : 'Crear Producto'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label className="mb-1 block">Nombre</Label>
            <Input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nombre del producto" required />
          </div>
          <div className="mb-4">
            <Label className="mb-1 block">DescripciÃ³n</Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="DescripciÃ³n del producto"
            />
          </div>
          <div className="mb-4">
            <Label className="mb-1 block">Precio</Label>
            <Input type="number" name="price" value={formData.price} onChange={handleChange} step="0.01" placeholder="0.00" required />
          </div>

          <div className="mb-4">
            <Label className="mb-1 block">ImÃ¡genes del producto</Label>

            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {existingImages.map((url) => (
                  <div key={url} className="relative group">
                    <img src={url} alt="img" className="w-full h-24 object-cover rounded border" />
                    <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100" onClick={() => removeExistingImage(url)} title="Eliminar">âœ•</Button>
                  </div>
                ))}
              </div>
            )}

            {newPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {newPreviews.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <img src={src} alt="new" className="w-full h-24 object-cover rounded border" />
                    <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100" onClick={() => removeNewFile(idx)} title="Quitar">âœ•</Button>
                  </div>
                ))}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilesChange} className="hidden" />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>+ Agregar imágenes</Button>
            <p className="text-xs text-gray-500 mt-1">Puedes seleccionar varias imÃ¡genes</p>

            <div className="flex items-center gap-2 mt-3">
              <Input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" />
              <Button type="button" variant="outline" onClick={addUrl}>Agregar URL</Button>
            </div>
            {newUrls.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {newUrls.map((u, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border">{u}</span>
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




