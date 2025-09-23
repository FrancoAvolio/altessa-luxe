'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { imgPresets } from '@/lib/images';

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

const isVideo = (u: string) =>
  /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(u) || u.startsWith('data:video');

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const { isAdmin } = useAdmin();
  const [index, setIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [inView, setInView] = useState(false);
  const [isHoveringMedia, setIsHoveringMedia] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const images = (product.images && product.images.length > 0)
    ? product.images
    : (product.image_url ? [product.image_url] : []);

  const next = () => setIndex((prev) => (prev + 1) % Math.max(images.length, 1));
  const prev = () => setIndex((prev) => (prev - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1));

  const href = product.id ? `/products/${product.id}` : '#';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { rootMargin: '200px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!isVideo(images[index] ?? '')) {
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    if (inView && isHoveringMedia) {
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => {});
      }
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [images, index, inView, isHoveringMedia]);

  const current = images[index];
  const poster = images[0] && !isVideo(images[0]) ? imgPresets.thumb(images[0]) : undefined;
  const imgForCard = current && !isVideo(current) ? imgPresets.card(current) : current;

  return (
    <Card ref={ref} className="h-full flex flex-col overflow-hidden relative hover:shadow-xl transition-shadow duration-300 glow-card">
      <Link href={href} className="block">
        <div
          className="relative h-72 bg-white"
          onPointerEnter={() => setIsHoveringMedia(true)}
          onPointerLeave={() => setIsHoveringMedia(false)}
        >
          {images.length > 0 && !imageError ? (
            isVideo(current) ? (
              inView ? (
                <video
                  key={current}
                  ref={videoRef}
                  src={current}
                  className="absolute inset-0 w-full h-full object-cover"
                  preload="metadata"
                  muted
                  loop
                  playsInline
                  controls={false}
                  poster={poster}
                />
              ) : poster ? (
                <Image
                  src={poster}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-black/60">Video</div>
              )
            ) : (
              <Image
                key={imgForCard}
                src={imgForCard}
                alt={product.name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-black/60">
              {imageError ? 'Imagen no disponible' : 'Sin imagen'}
            </div>
          )}

          {images.length > 1 && (
            <>
              <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
                {images.map((_, i) => (
                  <span key={i} className={`h-1.5 w-1.5 rounded-full ${index === i ? 'bg-white' : 'bg-white/60'}`} />
                ))}
              </div>
              <div className="absolute inset-y-0 left-0 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/40 text-white hover:bg-black cursor-pointer"
                  onClick={(e) => { e.preventDefault(); prev(); }}
                >{"<"}</Button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/40 text-white hover:bg-black cursor-pointer"
                  onClick={(e) => { e.preventDefault(); next(); }}
                >{">"}</Button>
              </div>
            </>
          )}
        </div>
      </Link>
      <CardContent className="p-5 flex flex-col flex-1">
        <Link href={href} className="block">
          <h3 className="font-semibold text-lg text-black mb-1 hover:underline line-clamp-2">{product.name}</h3>
          {product.description && <p className="text-black/70 text-sm line-clamp-1">{product.description}</p>}
        </Link>
        <div className="mt-auto">
          <p className="text-xl font-bold text-black">${product.price}</p>
          {isAdmin && (
            <div className="flex space-x-2 mt-2">
              <Button onClick={() => onEdit(product)} className="flex-1 cursor-pointer" variant="secondary">Editar</Button>
              <Button onClick={() => product.id && onDelete(product.id)} className="flex-1 cursor-pointer" variant="destructive">Eliminar</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
