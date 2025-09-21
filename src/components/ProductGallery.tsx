"use client";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

interface Size2D {
  w: number;
  h: number;
}

interface RenderedSize extends Size2D {
  offsetX: number;
  offsetY: number;
}

const ZOOM_SCALE = 1.6;
const LENS_SIZE = 100;

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState<Size2D>({ w: 1, h: 1 });
  const [naturalSize, setNaturalSize] = useState<Size2D>({ w: 0, h: 0 });
  const [renderedSize, setRenderedSize] = useState<RenderedSize>({ w: 1, h: 1, offsetX: 0, offsetY: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const src = images[active] || "";
  const isVideo = (u: string) => /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(u) || u.startsWith('data:video');

  useEffect(() => {
    setShowLens(false);
    setLensPos({ x: 0, y: 0 });
    setNaturalSize({ w: 0, h: 0 });
  }, [src]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      setContainerSize({ w: node.clientWidth, h: node.clientHeight });
    };

    update();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => update());
      observer.observe(node);
      return () => observer.disconnect();
    }

    if (typeof window !== 'undefined') {
      const handle = () => update();
      window.addEventListener('resize', handle);
      return () => window.removeEventListener('resize', handle);
    }

    return () => {};
  }, []);

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
    height: 'clamp(280px, 55vw, 400px)',
  }), []);

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

    return {
      backgroundImage: src ? `url(${src})` : undefined,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${bgW}px ${bgH}px`,
      backgroundPosition: `-${posX}px -${posY}px`,
    } as React.CSSProperties;
  }, [src, lensPos, renderedSize]);

  const updateNaturalSize = (width: number, height: number) => {
    if (width && height) {
      setNaturalSize({ w: width, h: height });
    }
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setContainerSize({ w: rect.width, h: rect.height });
    setLensPos({ x, y });
  };

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative w-full bg-panel border border-panel rounded-lg overflow-hidden"
        style={containerStyle}
        onMouseEnter={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setContainerSize({ w: rect.width, h: rect.height });
          setShowLens(true);
        }}
        onMouseLeave={() => setShowLens(false)}
        onMouseMove={onMove}
      >
        {src ? (
          isVideo(src) ? (
            <video
              key={src}
              src={src}
              className="absolute inset-0 w-full h-full object-cover bg-panel"
              controls
              playsInline
              onLoadedMetadata={(event) => {
                updateNaturalSize(event.currentTarget.videoWidth, event.currentTarget.videoHeight);
              }}
            />
          ) : (
            <Image
              key={src}
              src={src}
              alt={alt}
              fill
              className="object-cover select-none bg-panel"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              onLoadingComplete={({ naturalWidth, naturalHeight }) => {
                updateNaturalSize(naturalWidth, naturalHeight);
              }}
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted">
            Sin imagen
          </div>
        )}

        {showLens && src && !isVideo(src) && (
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
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              className={`relative aspect-square border rounded overflow-hidden ${
                i === active ? "ring-2 ring-[var(--gold)]" : "hover:opacity-80"
              }`}
              onClick={() => setActive(i)}
            >
              {isVideo(img) ? (
                <div className="absolute inset-0 bg-black/80 text-white flex items-center justify-center text-lg">{'\u25B6'}</div>
              ) : (
                <Image src={img} alt={`${alt} thumbnail ${i + 1}`} fill className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

