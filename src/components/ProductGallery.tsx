'use client';

import NextImage from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { imgPresets } from "@/lib/images";

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

interface Size2D { w: number; h: number; }
interface RenderedSize extends Size2D { offsetX: number; offsetY: number; }

const ZOOM_SCALE = 1.3;
const LENS_SIZE = 100;

const isVideo = (u: string) =>
  /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(u) || u.startsWith('data:video');

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState<Size2D>({ w: 1, h: 1 });
  const [naturalSize, setNaturalSize] = useState<Size2D>({ w: 0, h: 0 });
  const [renderedSize, setRenderedSize] = useState<RenderedSize>({ w: 1, h: 1, offsetX: 0, offsetY: 0 });
  const [hiResUrl, setHiResUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  const raw = images[active] || "";
  const video = isVideo(raw);

  // URLs optimizadas
  const displaySrc = video ? raw : imgPresets.mid(raw);
  const hiSrc = video ? null : imgPresets.zoomHi(raw);

  // Reset al cambiar media
  useEffect(() => {
    setShowLens(false);
    setLensPos({ x: 0, y: 0 });
    setNaturalSize({ w: 0, h: 0 });
    setHiResUrl(null);
    // Set loading state for the active image
    setImageLoading(prev => ({ ...prev, [active]: true }));
  }, [active, raw]);

  // Initialize loading states for all images on mount
  useEffect(() => {
    const initialLoading: Record<number, boolean> = {};
    images.forEach((_, index) => {
      initialLoading[index] = true; // Assume all start loading
    });
    setImageLoading(initialLoading);
  }, [images]);

  // Observer de tamaño del contenedor
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => setContainerSize({ w: node.clientWidth, h: node.clientHeight });
    update();

    if (typeof ResizeObserver !== 'undefined') {
      const ob = new ResizeObserver(update);
      ob.observe(node);
      return () => ob.disconnect();
    }
    const handle = () => update();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // Cálculo de tamaño renderizado (para lente)
  useEffect(() => {
    if (!naturalSize.w || !naturalSize.h || !containerSize.w || !containerSize.h) return;
    const imageRatio = naturalSize.w / naturalSize.h;
    const containerRatio = containerSize.w / containerSize.h;

    let width = containerSize.w;
    let height = containerSize.h;
    let offsetX = 0;
    let offsetY = 0;

    if (imageRatio > containerRatio) {
      height = containerSize.h;
      width = height * imageRatio;
      offsetX = (width - containerSize.w) / 2;
    } else {
      width = containerSize.w;
      height = width / imageRatio;
      offsetY = (height - containerSize.h) / 2;
    }

    setRenderedSize({ w: width, h: height, offsetX, offsetY });
  }, [naturalSize, containerSize]);

  const containerStyle = useMemo<React.CSSProperties>(() => ({
    width: '100%',
    height: 'clamp(400px, 80vw, 600px)',
  }), []);

  // Fondo del lente: usa hiRes cuando ya esté cargada; si no, la mid
  const bgStyle = useMemo(() => {
    const width = renderedSize.w || containerSize.w;
    const height = renderedSize.h || containerSize.h;
    const offsetX = renderedSize.offsetX || 0;
    const offsetY = renderedSize.offsetY || 0;

    const bgW = width * ZOOM_SCALE;
    const bgH = height * ZOOM_SCALE;
    const maxX = Math.max(bgW - LENS_SIZE, 0);
    const maxY = Math.max(bgH - LENS_SIZE, 0);
    const posX = Math.max(0, Math.min((lensPos.x + offsetX) * ZOOM_SCALE - LENS_SIZE / 2, maxX));
    const posY = Math.max(0, Math.min((lensPos.y + offsetY) * ZOOM_SCALE - LENS_SIZE / 2, maxY));

    const bgImage = hiResUrl ?? displaySrc;

    return {
      backgroundImage: bgImage ? `url(${bgImage})` : undefined,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${bgW}px ${bgH}px`,
      backgroundPosition: `-${posX}px -${posY}px`,
    } as React.CSSProperties;
  }, [displaySrc, hiResUrl, lensPos, renderedSize, containerSize]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setContainerSize({ w: rect.width, h: rect.height });
    setLensPos({ x, y });
  };

  // Pre-carga de hi-res al entrar el mouse
  const handleEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setContainerSize({ w: rect.width, h: rect.height });
    setShowLens(true);

    if (!hiSrc || hiResUrl) return;

    // 👇 Usar el constructor DOM, no el componente NextImage
    if (typeof window !== 'undefined' && typeof window.Image !== 'undefined') {
      const preload = new window.Image();
      preload.onload = () => setHiResUrl(hiSrc);
      preload.src = hiSrc;
    }
  };

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative w-full bg-panel border border-panel rounded-lg overflow-hidden"
        style={containerStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShowLens(false)}
        onMouseMove={onMove}
      >
        {displaySrc ? (
          video ? (
            <video
              key={displaySrc}
              src={displaySrc}
              className="absolute inset-0 w-full h-full object-cover bg-panel"
              controls
              playsInline
              preload="metadata"
              muted
              loop
              autoPlay
              onLoadedMetadata={(ev) => {
                const v = ev.currentTarget;
                if (v.videoWidth && v.videoHeight) {
                  setNaturalSize({ w: v.videoWidth, h: v.videoHeight });
                }
              }}
            />
          ) : (
            <NextImage
              key={displaySrc}
              src={displaySrc}
              alt={alt}
              fill
              className="object-cover select-none bg-panel"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={active === 0}
              loading={active === 0 ? 'eager' : 'lazy'}
              onLoadingComplete={({ naturalWidth, naturalHeight }) => {
                if (naturalWidth && naturalHeight) {
                  setNaturalSize({ w: naturalWidth, h: naturalHeight });
                  // Mark image as loaded
                  setImageLoading(prev => ({ ...prev, [active]: false }));
                }
              }}
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted">
            Sin imagen
          </div>
        )}

        {/* Loading overlay for main image */}
        {imageLoading[active] && displaySrc && !video && (
          <div className="absolute inset-0 pointer-events-none bg-neutral-200/70 animate-pulse" />
        )}

        {showLens && !video && displaySrc && (
          <div
            className="hidden md:block pointer-events-none absolute rounded-full border-2 border-black/30 shadow-xl"
            style={{
              width: LENS_SIZE,
              height: LENS_SIZE,
              left: Math.max(0, Math.min(lensPos.x - LENS_SIZE / 2, containerSize.w - LENS_SIZE)),
              top: Math.max(0, Math.min(lensPos.y - LENS_SIZE / 2, containerSize.h - LENS_SIZE)),
              ...bgStyle,
            }}
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {images.map((img, i) => {
            const isVid = isVideo(img);
            const thumb = isVid ? img : imgPresets.thumb(img);
            return (
              <button
                key={img + i}
                type="button"
                className={`relative aspect-square border rounded overflow-hidden ${
                  i === active ? "ring-2 ring-[var(--gold)]" : "hover:opacity-80"
                }`}
                onClick={() => setActive(i)}
              >
                {isVid ? (
                  <div className="absolute inset-0 bg-black/80 text-white flex items-center justify-center text-lg">{'\u25B6'}</div>
                ) : (
                  <NextImage src={thumb} alt={`${alt} thumbnail ${i + 1}`} fill className="object-cover" sizes="96px" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
