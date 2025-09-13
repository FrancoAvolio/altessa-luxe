'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabase';
import { deleteImage, deleteImages } from '../supabase/storage';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import { useAdmin } from '../context/AdminContext';

interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  images?: string[];
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

  const totalPages = Math.ceil(products.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

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
        <div className="text-red-600 text-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Lista de Productos</h1>

        {isAdmin && (
          <div id="admin-panel" className="bg-white rounded-lg shadow-md p-6 mb-8 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Panel de Administrador</h2>
            <p className="text-gray-600 mb-4">GestiÃ³n de productos de la tienda</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold cursor-pointer"
            >
              Agregar Nuevo Producto
            </button>
          </div>
        )}

        {currentProducts.length === 0 ? (
          <div className="text-center text-gray-600">No hay productos disponibles.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentProducts.map(product => (
                <ProductCard key={product.id} product={product} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-1">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === number
                          ? 'text-white bg-blue-600 cursor-pointer'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            )}
          </>
        )}

        {showForm && (
          <ProductForm product={editingProduct} onSave={handleSave} onCancel={handleCancel} />
        )}
      </div>
    </div>
  );
}


