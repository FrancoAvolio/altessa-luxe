"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/supabase/supabase";
import ProductGallery from "@/components/ProductGallery";
import { buildWhatsAppLink } from "@/lib/whatsapp";

interface DBProduct {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category?: string | null;
}

interface ProductImageRow {
  product_id: number;
  url: string;
  position: number;
}

interface RelatedProduct extends DBProduct {
  images: string[];
}

type ParamsInput = { id: string } | Promise<{ id: string }>;

type PageProps = {
  params: ParamsInput;
};

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(
    typeof (params as any)?.then === "function"
      ? (params as Promise<{ id: string }>)
      : Promise.resolve(params as { id: string })
  );
  const id = Number(resolvedParams.id);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<DBProduct | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [related, setRelated] = useState<RelatedProduct[]>([]);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError("Producto invalido");
      setLoading(false);
      return;
    }
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data: p, error: pErr } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();
        if (pErr) throw pErr;
        if (!active) return;
        const prod = p as unknown as DBProduct;
        setProduct(prod);

        const { data: imgs, error: iErr } = await supabase
          .from("product_images")
          .select("url, position")
          .eq("product_id", id)
          .order("position", { ascending: true });
        if (iErr) {
          const fallback = prod?.image_url ? [prod.image_url] : [];
          setImages(fallback);
        } else {
          const rows = (imgs ?? []) as { url: string; position: number }[];
          const list = rows.map((i) => i.url);
          if (!list.length && prod?.image_url) list.push(prod.image_url);
          setImages(list);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el producto");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  // Load related products (prefer same category, exclude current)
  useEffect(() => {
    const fetchRelated = async () => {
      if (!product) return;
      try {
        const baseQuery = supabase.from("products").select("*").neq("id", product.id);
        const byCat = (product.category ?? "").toString().trim();
        const { data: primary, error: qErr } = byCat
          ? await baseQuery.eq("category", byCat)
          : await baseQuery;
        if (qErr) throw qErr;
        let pool = (primary ?? []) as DBProduct[];

        // Fallback: widen pool if less than 4
        if (pool.length < 4) {
          const { data: extra } = await supabase
            .from("products")
            .select("*")
            .neq("id", product.id)
            .limit(20);
          if (extra) {
            const map = new Map<number, DBProduct>();
            pool.forEach((p) => map.set(p.id, p));
            (extra as DBProduct[]).forEach((p) => { if (!map.has(p.id)) map.set(p.id, p); });
            pool = Array.from(map.values());
          }
        }

        if (!pool.length) { setRelated([]); return; }
        const ids = pool.map((p) => p.id);
        const { data: imgs } = await supabase
          .from("product_images")
          .select("product_id, url, position")
          .in("product_id", ids)
          .order("position", { ascending: true });
        const rows = (imgs ?? []) as ProductImageRow[];
        const grouped: Record<number, string[]> = {};
        for (const r of rows) {
          if (!grouped[r.product_id]) grouped[r.product_id] = [];
          grouped[r.product_id].push(r.url);
        }
        const enriched: RelatedProduct[] = pool.map((p) => ({
          ...p,
          images: grouped[p.id]?.length ? grouped[p.id] : (p.image_url ? [p.image_url] : []),
        }));

        const shuffled = [...enriched].sort(() => Math.random() - 0.5);
        setRelated(shuffled.slice(0, 4));
      } catch {
        // Silent fail; section just won't render
        setRelated([]);
      }
    };
    fetchRelated();
  }, [product]);

  const title = useMemo(() => product?.name || "Producto", [product?.name]);
  const isVideo = (u: string) => /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(u || "") || (u || "").startsWith('data:video');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando producto...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-foreground">{error || "Producto no encontrado"}</p>
        <Link href="/" className="btn-gold px-4 py-2 rounded">Volver a inicio</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-surface text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4 text-sm text-muted">
          <Link href="/" className="hover:underline">Inicio</Link>
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
          {/* Gallery */}
          <div>
            <ProductGallery images={images} alt={title} />
          </div>

          {/* Details */}
          <div className="text-foreground">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
            {product.category && (
              <div className="text-sm text-muted mb-3">Categoria: {product.category}</div>
            )}
            {product.price !== null && (
              <div className="text-2xl font-semibold mb-4">${product.price}</div>
            )}
            {product.description && (
              <p className="text-muted-strong leading-relaxed whitespace-pre-wrap mb-6">{product.description}</p>
            )}

            <div className="flex items-center gap-3 mt-4">
              <button
                className="btn-black px-6 py-3 rounded-lg font-semibold cursor-pointer"
                onClick={() => router.back()}
              >
                Volver
              </button>
              <a
                href={buildWhatsAppLink(`Hola! Me interesa este producto: ${product.name}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-lg font-semibold border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
              >
                Consultar por este producto
              </a>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">Tambien podria interesarte</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p) => {
                const cover = p.images[0] || p.image_url || "";
                return (
                  <Link key={p.id} href={`/products/${p.id}`} className="group block">
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
                          <Image src={cover} alt={p.name} fill className="object-cover transition-transform duration-200 group-hover:scale-105" />
                        )
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted">Sin imagen</div>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="text-foreground font-semibold leading-tight group-hover:underline line-clamp-1">{p.name}</div>
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
