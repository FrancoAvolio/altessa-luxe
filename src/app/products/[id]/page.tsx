"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import ProductGallery from "@/components/ProductGallery";
import { buildInstagramDmLink } from "@/lib/instagram";
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

  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useQuery<DBProduct>({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });

  const { data: images = [], isLoading: imagesLoading } = useQuery<string[]>({
    queryKey: ["productImages", id],
    queryFn: () => fetchProductImages(id),
    enabled: !!id,
  });

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
  const instagramDmUrl = buildInstagramDmLink();
  const contactSubject = encodeURIComponent(`Consulta sobre ${product.name}`);
  const contactMessage = encodeURIComponent(
    `Hola, me interesa este producto: ${product.name}.`
  );
  const contactHref = `/contact?subject=${contactSubject}&message=${contactMessage}`;

  const crumbs: Array<{ label: string; href?: string }> = [
    { label: "Inicio", href: "/" },
  ];

  if (product.category) {
    crumbs.push({ label: product.category });
  }

  if (product.subcategory) {
    crumbs.push({ label: product.subcategory });
  }

  crumbs.push({ label: title });

  const isVideo = (u: string) =>
    /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(u || "") ||
    (u || "").startsWith("data:video");

  return (
    <div className="min-h-screen page-surface text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4 text-sm text-muted flex flex-wrap items-center gap-1">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            const content = crumb.href ? (
              <Link
                key={crumb.label}
                href={crumb.href}
                className="hover:underline"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                key={crumb.label}
                className={isLast ? "text-foreground" : "capitalize"}
              >
                {crumb.label}
              </span>
            );

            return (
              <span
                key={`${crumb.label}-${index}`}
                className="flex items-center gap-1"
              >
                {content}
                {!isLast && <span className="mx-1">/</span>}
              </span>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ProductGallery images={images} alt={title} />
          </div>

          <div className="text-foreground space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
            {product.category && (
              <div className="text-sm text-muted">
                Categoría: {product.category}
              </div>
            )}
            {product.subcategory && (
              <div className="text-sm text-muted">
                Subcategoría {product.subcategory}
              </div>
            )}
            {product.description && (
              <p className="text-muted-strong leading-relaxed whitespace-pre-wrap mt-4">
                {product.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-6 flex-wrap">
              <button
                className="btn-black px-6 py-3 rounded-lg font-semibold cursor-pointer"
                onClick={() => router.back()}
              >
                Volver
              </button>
              <a
                href={instagramDmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white transition-colors"
              >
                Consultar por Instagram
              </a>
              <Link
                href={contactHref}
                className="px-6 py-3 rounded-lg font-semibold border border-[#d5aa3b] text-[#d5aa3b] hover:bg-[#d5aa3b] hover:text-black transition-colors"
              >
                Consultar por correo
              </Link>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
              Tambien podría interesarte
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
                    <div className="mt-2 space-y-1">
                      <div className="text-foreground font-semibold leading-tight group-hover:underline line-clamp-1">
                        {p.name}
                      </div>
                      {p.subcategory ? (
                        <div className="text-xs uppercase tracking-wide text-muted">
                          {p.subcategory}
                        </div>
                      ) : p.category ? (
                        <div className="text-xs uppercase tracking-wide text-muted">
                          {p.category}
                        </div>
                      ) : null}
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
