"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import ProductGallery from "@/components/ProductGallery";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  fetchProduct,
  fetchProductImages,
  fetchRelatedProducts,
  DBProduct,
  RelatedProduct,
} from "@/lib/queries/products";

import ProductDetailSkeleton from "../ui/ProductDetailSkeleton";

type ParamsInput = { id: string } | Promise<{ id: string }>;

type PageProps = {
  params: ParamsInput;
};

function isPromiseLike(value: ParamsInput): value is Promise<{ id: string }> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as PromiseLike<unknown>).then === "function"
  );
}

function toParamsPromise(value: ParamsInput): Promise<{ id: string }> {
  return isPromiseLike(value) ? value : Promise.resolve(value);
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(toParamsPromise(params));
  const id = Number(resolvedParams.id);
  const router = useRouter();

  // Producto principal
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useQuery<DBProduct>({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });

  // Imágenes
  const { data: images = [], isLoading: imagesLoading } = useQuery<string[]>({
    queryKey: ["productImages", id],
    queryFn: () => fetchProductImages(id),
    enabled: !!id,
  });

  // Relacionados
  const { data: related = [] } = useQuery<RelatedProduct[]>({
    queryKey: ["relatedProducts", id],
    queryFn: () => fetchRelatedProducts(product!),
    enabled: !!product,
  });

  if (productLoading || imagesLoading) return <ProductDetailSkeleton />;

  if (productError || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-foreground">
          {productError instanceof Error
            ? productError.message
            : "Producto no encontrado"}
        </p>
        <Link href="/" className="btn-gold px-4 py-2 rounded">
          Volver a inicio
        </Link>
      </div>
    );
  }

  const title = product.name;

  const isVideo = (u: string) =>
    /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(u || "") ||
    (u || "").startsWith("data:video");

  return (
    <div className="min-h-screen page-surface text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-muted">
          <Link href="/" className="hover:underline">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          {product.category ? (
            <span className="capitalize">{product.category}</span>
          ) : (
            <span>Producto</span>
          )}
          <span className="mx-2">/</span>
          <span className="text-foreground">{title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Galería */}
          <div>
            <ProductGallery images={images} alt={title} />
          </div>

          {/* Detalles */}
          <div className="text-foreground">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {product.name}
            </h1>
            {product.category && (
              <div className="text-sm text-muted mb-3">
                Categoria: {product.category}
              </div>
            )}
            {product.price !== null && (
              <div className="text-2xl font-semibold mb-4">
                ${product.price}
              </div>
            )}
            {product.description && (
              <p className="text-muted-strong leading-relaxed whitespace-pre-wrap mb-6">
                {product.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-4">
              <button
                className="btn-black px-6 py-3 rounded-lg font-semibold cursor-pointer"
                onClick={() => router.back()}
              >
                Volver
              </button>
              <a
                href={buildWhatsAppLink(
                  `Hola! Me interesa este producto: ${product.name}`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-lg font-semibold border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
              >
                Consultar por este producto
              </a>
            </div>
          </div>
        </div>

        {/* Relacionados */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
              Tambien podria interesarte
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p) => {
                const cover = p.images[0] || p.image_url || "";
                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="group block"
                  >
                    <div className="relative h-44 bg-panel border border-panel rounded-lg overflow-hidden">
                      {cover ? (
                        isVideo(cover) ? (
                          <video
                            src={cover}
                            className="absolute inset-0 h-full w-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                          />
                        ) : (
                          <Image
                            src={cover}
                            alt={p.name}
                            fill
                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        )
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="text-foreground font-semibold leading-tight group-hover:underline line-clamp-1">
                        {p.name}
                      </div>
                      {p.price !== null && (
                        <div className="text-muted-strong">${p.price}</div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
