"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAdmin } from "../context/AdminContext";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { imgPresets } from "@/lib/images";

interface Product {
  id?: number;
  name: string;
  description: string;
  image_url: string;
  images?: string[];
}

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

const isVideo = (u: string) =>
  /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(u) || u.startsWith("data:video");

export default function ProductCard({
  product,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const { isAdmin } = useAdmin();
  const [index, setIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [inView, setInView] = useState(false);
  const [isHoveringMedia, setIsHoveringMedia] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [loadedSources, setLoadedSources] = useState<Record<string, boolean>>(
    {}
  );
  const ref = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const mediaSources = useMemo(() => {
    const gallery = Array.isArray(product.images)
      ? product.images.filter((entry): entry is string => Boolean(entry))
      : [];
    if (gallery.length) return gallery;
    return product.image_url ? [product.image_url] : [];
  }, [product.images, product.image_url]);

  const mediaCount = mediaSources.length;
  const next = () => setIndex((prev) => (prev + 1) % Math.max(mediaCount, 1));
  const prev = () =>
    setIndex(
      (prev) => (prev - 1 + Math.max(mediaCount, 1)) % Math.max(mediaCount, 1)
    );

  const href = product.id ? `/products/${product.id}` : "#";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (mediaCount === 0) {
      setIndex(0);
      return;
    }
    setIndex((prev) => (prev >= mediaCount ? 0 : prev));
  }, [mediaCount]);

  useEffect(() => {
    if (!isVideo(mediaSources[index] ?? "")) {
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    if (inView) {
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => {});
      }
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [mediaSources, index, inView]);

  const current = mediaSources[index];
  const poster = undefined; // Don't show poster to avoid image flashing when video starts
  const imgForCard =
    current && !isVideo(current) ? imgPresets.card(current) : current;

  useEffect(() => {
    setImageError(false);
    if (!current || isVideo(current)) {
      setIsImageLoading(false);
      return;
    }
    setIsImageLoading(!loadedSources[current]);
  }, [current, loadedSources]);

  return (
    <Card
      ref={ref}
      className="h-full flex flex-col overflow-hidden relative hover:shadow-xl transition-shadow duration-300 glow-card"
    >
      <Link href={href} className="block">
        <div
          className="relative h-72 bg-gradient-to-br from-white via-white to-neutral-200"
          onPointerEnter={() => setIsHoveringMedia(true)}
          onPointerLeave={() => setIsHoveringMedia(false)}
        >
          {mediaCount > 0 && !imageError ? (
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
                <div className="flex items-center justify-center h-full text-black/60">
                  Video
                </div>
              )
            ) : (
              <>
                <Image
                  key={imgForCard}
                  src={imgForCard}
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  onLoad={(event) => {
                    if (event.currentTarget.complete) {
                      setLoadedSources((prev) => {
                        if (current && prev[current]) return prev;
                        return current ? { ...prev, [current]: true } : prev;
                      });
                      setIsImageLoading(false);
                    }
                  }}
                  onLoadingComplete={() => {
                    setLoadedSources((prev) => {
                      if (current && prev[current]) return prev;
                      return current ? { ...prev, [current]: true } : prev;
                    });
                    setIsImageLoading(false);
                  }}
                  loading={index === 0 ? "eager" : "lazy"}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {isImageLoading && (
                  <div className="absolute inset-0 pointer-events-none bg-neutral-200/70 animate-pulse" />
                )}
              </>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-black/60">
              {imageError ? "Imagen no disponible" : "Sin imagen"}
            </div>
          )}

          {mediaCount > 1 && (
            <>
              <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
                {mediaSources.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${index === i ? "bg-white" : "bg-white/60"}`}
                  />
                ))}
              </div>
              <div className="absolute inset-y-0 left-0 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/40 text-white hover:bg-black cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    prev();
                  }}
                >
                  {"<"}
                </Button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/40 text-white hover:bg-black cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    next();
                  }}
                >
                  {">"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Link>
      <CardContent className="p-5 flex flex-col flex-1">
        <Link href={href} className="block">
          <h3 className="font-semibold text-lg text-black mb-1 hover:underline line-clamp-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-black/70 text-sm line-clamp-1">
              {product.description}
            </p>
          )}
        </Link>
        <div className="mt-auto">
          {isAdmin && (
            <div className="flex space-x-2 mt-2">
              <Button
                onClick={() => onEdit(product)}
                className="flex-1 cursor-pointer"
                variant="secondary"
              >
                Editar
              </Button>
              <Button
                onClick={() => product.id && onDelete(product.id)}
                className="flex-1 cursor-pointer"
                variant="destructive"
              >
                Eliminar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
