"use client";

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProductCard from '@/components/ProductCard';
import ProductForm from '@/components/ProductForm';
import CategoryForm, { type Category } from '@/components/CategoryForm';
import CategoryManager from '@/components/CategoryManager';
import { useAdmin } from '@/context/AdminContext';
import { supabase } from '@/supabase/supabase';
import { deleteImage, deleteImages } from '@/supabase/storage';
import { fetchProductsWithImages, type ProductWithImages } from '@/lib/products';
import { fetchCategoryRows, type CategoryRow } from '@/lib/categories';
import { queryKeys } from '@/lib/queryKeys';

type Product = ProductWithImages;

const productsQueryFn = async (): Promise<Product[]> => {
  const { items, error } = await fetchProductsWithImages();
  if (error) throw new Error(error);
  return items;
};

const categoryRowsQueryFn = async (): Promise<CategoryRow[]> => {
  const { items, error } = await fetchCategoryRows();
  if (error) throw new Error(error);
  return items;
};

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

interface HomeClientProps {
  initialProducts: ProductWithImages[];
  initialCategoryRows: CategoryRow[];
  initialError?: string | null;
}

export default function HomeClient({ initialProducts, initialCategoryRows, initialError }: HomeClientProps) {
  const { isAdmin } = useAdmin();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  const productsQuery = useQuery<Product[]>({
    queryKey: queryKeys.products,
    queryFn: productsQueryFn,
    initialData: initialProducts.length ? initialProducts : undefined,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const categoryRowsQuery = useQuery<CategoryRow[]>({
    queryKey: queryKeys.categoryRows,
    queryFn: categoryRowsQueryFn,
    initialData: initialCategoryRows.length ? initialCategoryRows : undefined,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const categoryRows = useMemo(() => categoryRowsQuery.data ?? [], [categoryRowsQuery.data]);
  const categories = useMemo(() => categoryRows.map((row) => row.name), [categoryRows]);
  const showSkeleton = productsQuery.status === 'pending';

  useEffect(() => {
    const queryError =
      (productsQuery.error as Error | null | undefined) ??
      (categoryRowsQuery.error as Error | null | undefined) ??
      null;

    if (queryError) {
      setError(queryError.message);
      return;
    }

    if (initialError && productsQuery.status === 'pending' && products.length === 0) {
      setError(initialError);
      return;
    }

    setError(null);
  }, [initialError, productsQuery.error, categoryRowsQuery.error, productsQuery.status, products.length]);

  useEffect(() => {
    const channel = supabase
      .channel('categories-listener')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.categoryRows });
        },
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore cleanup issues
      }
    };
  }, [queryClient]);

  const filtered = useMemo(() => (
    selectedCategories.length
      ? products.filter((p) => {
          const category = (p.category ?? '').toString();
          return selectedCategories.includes(category);
        })
      : products
  ), [products, selectedCategories]);

  useEffect(() => {
    const total = Math.max(1, Math.ceil(Math.max(filtered.length, 1) / productsPerPage));
    setCurrentPage((prev) => Math.min(prev, total));
  }, [filtered.length, productsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / productsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const indexOfLastProduct = safePage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filtered.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (pageNumber: number) => {
    const next = Math.min(Math.max(pageNumber, 1), totalPages);
    setCurrentPage(next);
  };

  const handleCreate = (product: Product) => {
    queryClient.setQueryData<Product[]>(queryKeys.products, (prev = []) => {
      if (product.id && prev.some((p) => p.id === product.id)) {
        return prev.map((p) => (p.id === product.id ? product : p));
      }
      return [...prev, product];
    });
    setShowForm(false);
    setEditingProduct(undefined);
    setCurrentPage(1);
    setError(null);
  };

  const handleUpdate = (product: Product) => {
    queryClient.setQueryData<Product[]>(queryKeys.products, (prev = []) =>
      prev.map((p) => (p.id === product.id ? product : p)),
    );
    setShowForm(false);
    setEditingProduct(undefined);
    setError(null);
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin) {
      setError('Acceso restringido: solo administradores pueden eliminar productos');
      return;
    }

    const snapshot = queryClient.getQueryData<Product[]>(queryKeys.products) ?? [];
    const toDelete = snapshot.find((p) => p.id === id);

    try {
      if (toDelete?.images?.length) {
        await deleteImages(toDelete.images.filter((url) => url.includes('/storage/')));
      } else if (toDelete?.image_url && toDelete.image_url.includes('/storage/')) {
        await deleteImage(toDelete.image_url);
      }

      const { error: deleteError } = await supabase.from('products').delete().eq('id', id);
      if (deleteError) throw deleteError;

      queryClient.setQueryData<Product[]>(queryKeys.products, (prev = []) => prev.filter((p) => p.id !== id));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar el producto';
      setError(message);
    }
  };

  const handleSave = (product: Product) => {
    const exists = typeof product.id === 'number' && products.some((p) => p.id === product.id);
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
    if (typeof cat.id === 'number' && cat.name) {
      const trimmed = cat.name.trim();
      if (trimmed) {
        queryClient.setQueryData<CategoryRow[]>(queryKeys.categoryRows, (prev = []) => {
          const exists = prev.some((row) => row.id === cat.id);
          const next = exists
            ? prev.map((row) => (row.id === cat.id ? { ...row, name: trimmed } : row))
            : [...prev, { id: cat.id, name: trimmed }];
          return next.sort((a, b) => a.name.localeCompare(b.name));
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.categoryRows });
    setShowCategoryForm(false);
  };

  const hasProducts = products.length > 0;
  if (error && !hasProducts) {
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
                <CategoryManager />
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
            {showSkeleton ? (
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
                        disabled={safePage === 1}
                        className="px-3 py-2 text-sm font-medium text-black bg-white border border-gold rounded-md hover:bg-black hover:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            safePage === number
                              ? 'text-black bg-gold cursor-pointer'
                              : 'text-black bg-white border border-gold hover:bg-black hover:text-white cursor-pointer'
                          }`}
                        >
                          {number}
                        </button>
                      ))}
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={safePage === totalPages}
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

