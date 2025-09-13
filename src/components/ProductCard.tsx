"use client";
import Image from 'next/image';
import { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  images?: string[];
}

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const { isAdmin } = useAdmin();
  const [index, setIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const images = (product.images && product.images.length > 0)
    ? product.images
    : (product.image_url ? [product.image_url] : []);

  const next = () => setIndex((prev) => (prev + 1) % Math.max(images.length, 1));
  const prev = () => setIndex((prev) => (prev - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1));

  return (
    <Card className="overflow-hidden relative hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-48 bg-gray-100">
        {images.length > 0 && !imageError ? (
          <Image
            key={images[index]}
            src={images[index]}
            alt={product.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            {imageError ? 'Imagen no disponible' : 'Sin imagen'}
          </div>
        )}

        {images.length > 1 && (
          <>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
              {images.map((_, i) => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full ${index === i ? 'bg-white' : 'bg-white/60'}`}></span>
              ))}
            </div>
            <div className="absolute inset-y-0 left-0 flex items-center">
              <Button variant="ghost" size="icon" className="bg-black/40 text-white hover:bg-gray-800 cursor-pointer" onClick={prev}>{"<"}</Button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center">
              <Button variant="ghost" size="icon" className="bg-black/40 text-white hover:bg-gray-800 cursor-pointer" onClick={next}>{">"}</Button>
            </div>
          </>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-gray-800 mb-2">{product.name}</h3>
        {product.description && (
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
        )}
        <p className="text-xl font-bold text-gray-900">${product.price}</p>
        {isAdmin && (
          <div className="flex space-x-2 mt-2">
            <Button onClick={() => onEdit(product)} className="flex-1 cursor-pointer" variant="secondary">Editar</Button>
            <Button onClick={() => product.id && onDelete(product.id)} className="flex-1 cursor-pointer" variant="destructive">Eliminar</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



