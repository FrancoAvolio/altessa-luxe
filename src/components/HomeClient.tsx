"use client";

import { useEffect, useMemo, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import ProductForm from '@/components/ProductForm';
import CategoryForm, { type Category } from '@/components/CategoryForm';
import CategoryManager from '@/components/CategoryManager';
import { useAdmin } from '@/context/AdminContext';
import { supabase } from '@/supabase/supabase';
import { deleteImage, deleteImages } from '@/supabase/storage';
import {
  fetchCategoriesList,
  fetchProductsWithImages,
  type ProductWithImages,
} from '@/lib/products';

interface HomeClientProps {
  initialProducts: ProductWithImages[];
  initialCategories: string[];
  initialError?: string | null;
}

type Product = ProductWithImages;

function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="border border-panel bg-panel rounded-2xl p-4 flex flex-col gap-4 shadow-sm"
        >
          <div className="skeleton-block rounded-xl" style={{ paddingTop: '65%' }} />
          <div className="space-y-3">
            <div className="skeleton-block h-4 rounded" />
            <div className="skeleton-block h-3 rounded" />
            <div className="skeleton-block h-6 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomeClient({ initialProducts, initialCategories, initialError }: HomeClientProps) {
  const { isAdmin } = useAdmin();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  useEffect(() => {
    setError(initialError ?? null);
  }, [initialError]);


  useEffect(() => {
    setProducts(initialProducts);
    setLoading(initialProducts.length === 0);
  }, [initialProducts]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      if (initialProducts.length) return;
      setLoading(true);
      const { items, error: fetchError } = await fetchProductsWithImages();
      if (!active) return;
      if (fetchError) {
        setError(fetchError);
      } else {
        setError(null);
      }
      setProducts(items);
      setLoading(false);
    };

    const loadCategories = async () => {
      if (initialCategories.length) return;
      const { items, error: catError } = await fetchCategoriesList();
      if (!active) return;
      if (catError) {
        setError((prev) => prev ?? catError);
      } else {
        setError((prev) => (prev && prev !== initialError ? prev : null));
      }
      setCategories(items);
    };

    loadProducts();
    loadCategories();

    const channel = supabase
      .channel('categories-listener')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
        const { items } = await fetchCategoriesList();
        if (active) {
          setCategories(items);
        }
      })
      .subscribe();

    return () => {
      active = false;
      try {
        supabase.removeChannel(channel);
      } catch {
        /* ignore */
      }
    };
  }, [initialProducts.length, initialCategories.length, initialError]);

  const handleCreate = async (product: Product) => {
    let finalImages = product.images || (product.image_url ? [product.image_url] : []);
    if (product.id) {
      const { data: imgs } = await supabase
        .from('product_images')
        .select('url, position')
        .eq('product_id', product.id)
        .order('position', { ascending: true });
      if (imgs && imgs.length) {
        finalImages = imgs.map((i: any) => i.url);
      }
    }
    setProducts((prev) => [...prev, { ...product, images: finalImages }]);
    setShowForm(false);
  };

  const handleUpdate = async (product: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    setShowForm(false);
    setEditingProduct(undefined);
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin) {
      setError('Acceso restringido: solo administradores pueden eliminar productos');
      return;
    }

    const toDelete = products.find((p) => p.id === id);
    if (toDelete?.images?.length) {
      await deleteImages(toDelete.images.filter((u) => u.includes('/storage/')));
    } else if (toDelete?.image_url && toDelete.image_url.includes('/storage/')) {
      await deleteImage(toDelete.image_url);
    }

    const { error: deleteError } = await supabase.from('products').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleSave = (product: Product) => {
    const exists = product.id ? products.some((p) => p.id === product.id) : false;
    if (exists) {
      handleUpdate(product);
    } else {
      handleCreate(product);
    }
  };

  const handleEdit = (product: Product) => {
    if (!isAdmin) return;
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(undefined);
  };

  const handleCategoryCreate = (cat: Category) => {
    setCategories((prev) => Array.from(new Set([...(prev || []), cat.name])).sort((a, b) => a.localeCompare(b)));
    setShowCategoryForm(false);
  };

  const filtered = useMemo(() => (
    selectedCategories.length
      ? products.filter((p) => selectedCategories.includes((p.category ?? '').toString()))
      : products
  ), [products, selectedCategories]);

  const totalPages = Math.ceil(filtered.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filtered.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold text-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-surface p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gold font-fancy">Lista de Productos</h1>
          <p className="text-muted mt-2">Explora el catalogo de piezas disponibles.</p>
        </header>

        {isAdmin && (
          <section id="admin-panel" className="bg-white border-2 border-gold rounded-lg shadow p-6 mb-10 space-y-4">
            <div>
              <h2 className="text-xl font-bold font-fancy text-gold">Panel de Administrador</h2>
              <p className="text-black mt-1">Gestion de productos de la tienda</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="btn-black px-6 py-3 rounded-lg font-semibold cursor-pointer"
              >
                Agregar nuevo producto
              </button>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="btn-gold px-6 py-3 rounded-lg font-semibold cursor-pointer"
              >
                Agregar categoria
              </button>
              <div>
                <span className="text-sm font-semibold text-black block mb-2">Gestionar categorias</span>
                <CategoryManager
                  onChanged={(names) =>
                    setCategories(Array.from(new Set(names)).sort((a, b) => a.localeCompare(b)))
                  }
                />
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 bg-white border border-gold rounded-lg shadow p-4 h-fit">
            <h3 className="font-semibold mb-3 text-black">Categorias</h3>
            {(() => {
              const usedSet = new Set<string>();
              products.forEach((p) => {
                const c = (p.category ?? '').toString().trim();
                if (c) usedSet.add(c);
              });
              const inferred = Array.from(usedSet);
              const cats = (categories.length ? categories.filter((c) => usedSet.has(c)) : inferred)
                .sort((a, b) => a.localeCompare(b));
              return (
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => {
                        setSelectedCategories([]);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-2 py-1 rounded border transition-colors cat-btn ${selectedCategories.length === 0 ? 'active' : ''}`}
                    >
                      Todos ({products.length})
                    </button>
                  </li>
                  {cats.map((c) => (
                    <li key={c}>
                      <button
                        onClick={() => {
                          setSelectedCategories((prev) => {
                            const exists = prev.includes(c);
                            return exists ? prev.filter((x) => x !== c) : [...prev, c];
                          });
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-2 py-1 rounded border transition-colors cat-btn ${selectedCategories.includes(c) ? 'active' : ''}`}
                      >
                        {c} ({products.filter((p) => (p.category ?? '') === c).length})
                      </button>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </aside>

          <main className="lg:col-span-3 space-y-8">
            {loading ? (
              <ProductGridSkeleton />
            ) : currentProducts.length === 0 ? (
              <div className="text-center text-foreground">
                No hay productos
                {selectedCategories.length ? ` en ${selectedCategories.join(', ')}` : ''}.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentProducts.map((product) => (
                    <ProductCard key={product.id ?? product.name} product={product} onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <nav className="flex items-center space-x-1">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-black bg-white border border-gold rounded-md hover:bg-black hover:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === number
                              ? 'text-black bg-gold cursor-pointer'
                              : 'text-black bg-white border border-gold hover:bg-black hover:text-white cursor-pointer'
                          }`}
                        >
                          {number}
                        </button>
                      ))}
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-black bg-white border border-gold rounded-md hover:bg-black hover:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {showForm && (
          <ProductForm
            product={editingProduct}
            onSave={handleSave}
            onCancel={handleCancel}
            categories={categories}
          />
        )}
        {showCategoryForm && (
          <CategoryForm onSave={handleCategoryCreate} onCancel={() => setShowCategoryForm(false)} />
        )}
      </div>
    </div>
  );
}
