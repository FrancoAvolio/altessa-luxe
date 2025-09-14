'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabase';
import { deleteImage, deleteImages } from '../supabase/storage';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import CategoryForm, { type Category } from '../components/CategoryForm';
import CategoryManager from '../components/CategoryManager';
import { useAdmin } from '../context/AdminContext';

interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  images?: string[];
  category?: string | null;
}

export default function Home() {
  const { isAdmin } = useAdmin();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) {
          setError(error.message);
        } else {
          const base = data || [];
          const ids = base.map(p => p.id).filter(Boolean) as number[];
          if (ids.length) {
            const { data: imgs, error: imgErr } = await supabase
              .from('product_images')
              .select('product_id, url, position')
              .in('product_id', ids)
              .order('position', { ascending: true });

            if (!imgErr && imgs) {
              const grouped: Record<number, string[]> = {};
              for (const img of imgs as any[]) {
                const pid = img.product_id as number;
                if (!grouped[pid]) grouped[pid] = [];
                grouped[pid].push(img.url as string);
              }
              setProducts(base.map(p => ({ ...p, images: grouped[p.id!] || (p.image_url ? [p.image_url] : []) })));
            } else {
              setProducts(base);
            }
          } else {
            setProducts(base);
          }
        }
      } catch (err) {
        setError('Error al conectar con la base de datos');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    // Cargar categorías desde tabla categories
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase.from('categories').select('name');
        if (!error && data) {
          const arr = (data as any[]).map((r) => (r?.name ?? '').toString().trim()).filter(Boolean);
          setCategories(Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b)));
        }
      } catch (_) {
        // ignore
      }
    };
    fetchCategories();
  }, []);

  const handleCreate = async (product: Product) => {
    // Asegurar que el nuevo producto tenga sus imÃ¡genes para el slider
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
    setProducts(prev => [...prev, { ...product, images: finalImages }]);
    setShowForm(false);
  };

  const handleUpdate = async (product: Product) => {
    setProducts(prev => prev.map(p => (p.id === product.id ? product : p)));
    setShowForm(false);
    setEditingProduct(undefined);
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin) {
      setError('Acceso restringido: solo administradores pueden eliminar productos');
      return;
    }

    const toDelete = products.find(p => p.id === id);
    if (toDelete?.images?.length) {
      await deleteImages(toDelete.images.filter(u => u.includes('/storage/')));
    } else if (toDelete?.image_url && toDelete.image_url.includes('/storage/')) {
      await deleteImage(toDelete.image_url);
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleSave = (product: Product) => {
    const exists = product.id ? products.some(p => p.id === product.id) : false;
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

  const totalPages = Math.ceil(products.length / productsPerPage);
  const filtered = selectedCategory ? products.filter(p => (p.category ?? '') === selectedCategory) : products;
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filtered.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando productos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold text-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gold font-fancy">Lista de Productos</h1>

        {isAdmin && (
          <div id="admin-panel" className="bg-white rounded-lg shadow-md p-6 mb-8 border-2 border-gold">
            <h2 className="text-xl font-bold text-black mb-4 font-fancy text-gold">Panel de Administrador</h2>
            <p className="text-black mb-4">Gestión de productos de la tienda</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-black px-6 py-3 rounded-lg font-semibold cursor-pointer"
            >
              Agregar Nuevo Producto
            </button>
            <button
              onClick={() => setShowCategoryForm(true)}
              className="ml-3 btn-gold px-6 py-3 rounded-lg font-semibold cursor-pointer"
            >
              Agregar Categoría
            </button>
            <CategoryManager onChanged={(names) => setCategories(Array.from(new Set(names)).sort((a,b)=>a.localeCompare(b)))} />
          </div>
        )}

        {/* Layout con barra lateral de categorías */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 bg-white rounded-lg shadow p-4 h-fit">
            <h3 className="font-semibold mb-3 text-black">Categorías</h3>
            {(() => {
              const cats = (categories.length
                ? categories
                : Array.from(new Set(products.map(p => (p.category ?? '').toString().trim()).filter(Boolean)))
              ).sort((a, b) => a.localeCompare(b));
              return (
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
                      className={`w-full text-left px-2 py-1 rounded border transition-colors ${selectedCategory === '' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                    >
                      Todos ({products.length})
                    </button>
                  </li>
                  {cats.map((c) => (
                    <li key={c}>
                      <button
                        onClick={() => { setSelectedCategory(c); setCurrentPage(1); }}
                        className={`w-full text-left px-2 py-1 rounded border transition-colors ${selectedCategory === c ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                      >
                        {c} ({products.filter(p => (p.category ?? '') === c).length})
                      </button>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </aside>
          <main className="lg:col-span-3">
            {currentProducts.length === 0 ? (
              <div className="text-center text-black">No hay productos{selectedCategory ? ` en "${selectedCategory}"` : ''}.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {currentProducts.map(product => (
                    <ProductCard key={product.id} product={product} onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                </div>

                {Math.ceil(filtered.length / productsPerPage) > 1 && (
                  <div className="flex justify-center mt-8">
                    <nav className="flex items-center space-x-1">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-black bg-white border border-gold rounded-md hover:bg-black hover:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: Math.ceil(filtered.length / productsPerPage) }, (_, i) => i + 1).map(number => (
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
                        disabled={currentPage === Math.ceil(filtered.length / productsPerPage)}
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
          <ProductForm product={editingProduct} onSave={handleSave} onCancel={handleCancel} categories={categories} />
        )}
        {showCategoryForm && (
          <CategoryForm onSave={handleCategoryCreate} onCancel={() => setShowCategoryForm(false)} />
        )}
      </div>
    </div>
  );
}







