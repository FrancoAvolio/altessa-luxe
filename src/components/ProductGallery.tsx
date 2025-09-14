"use client";
import Image from "next/image";
import React, { useMemo, useRef, useState } from "react";

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ w: 1, h: 1 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const src = images[active] || "";
  const isVideo = (u: string) => /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(u) || u.startsWith('data:video');
  const lensSize = 160; // px
  const zoomScale = 2.2; // magnification

  const bgStyle = useMemo(() => {
    const bgW = containerSize.w * zoomScale;
    const bgH = containerSize.h * zoomScale;
    const posX = Math.max(0, Math.min(lensPos.x * zoomScale - lensSize / 2, bgW));
    const posY = Math.max(0, Math.min(lensPos.y * zoomScale - lensSize / 2, bgH));
    return {
      backgroundImage: `url(${src})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${bgW}px ${bgH}px`,
      backgroundPosition: `-${posX}px -${posY}px`,
    } as React.CSSProperties;
  }, [src, lensPos, containerSize.w, containerSize.h]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setContainerSize({ w: rect.width, h: rect.height });
    setLensPos({ x, y });
  };

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative w-full bg-white border rounded-lg overflow-hidden"
        style={{ height: "440px" }}
        onMouseEnter={() => setShowLens(true)}
        onMouseLeave={() => setShowLens(false)}
        onMouseMove={onMove}
      >
        {src ? (
          isVideo(src) ? (
            <video
              key={src}
              src={src}
              className="absolute inset-0 w-full h-full object-contain bg-white"
              controls
              playsInline
            />
          ) : (
            <Image
              key={src}
              src={src}
              alt={alt}
              fill
              className="object-contain select-none bg-white"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-black/60">
            Sin imagen
          </div>
        )}

        {/* Lens - hidden on touch/small screens */}
        {showLens && src && !isVideo(src) && (
          <div
            className="hidden md:block pointer-events-none absolute rounded-full border-2 border-black/30 shadow-xl"
            style={{
              width: lensSize,
              height: lensSize,
              left: Math.max(0, Math.min(lensPos.x - lensSize / 2, containerSize.w - lensSize)),
              top: Math.max(0, Math.min(lensPos.y - lensSize / 2, containerSize.h - lensSize)),
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
                <div className="absolute inset-0 bg-black/80 text-white flex items-center justify-center text-lg">▶</div>
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
