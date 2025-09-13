'use client';

import { useAdmin } from '../context/AdminContext';
import Link from 'next/link';

export default function Navbar() {
  const { user, signOut } = useAdmin();
  const isLogged = !!user;

  const handleViewAsCustomer = async () => {
    try {
      await signOut();
      // No hace falta recargar: el estado se actualiza y oculta acciones de admin
      // Si querÃ©s forzar recarga descomentÃ¡: window.location.reload();
    } catch (err) {
      console.error('Error al cerrar sesiÃ³n:', err);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-900 shadow-md z-50 border-b border-gray-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="ml-3 text-xl font-bold text-white">Relojes</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/contact" className="text-sm text-gray-300 hover:text-white">Contacto</Link>
            {isLogged ? (
              <>
                <span className="text-sm text-gray-300">Bienvenido, {user?.email}</span>
                <button
                  onClick={handleViewAsCustomer}
                  className="text-sm bg-gray-500 hover:bg-blue-700 text-white px-3 py-1 rounded cursor-pointer"
                  title="Cerrar sesión y ver como cliente"
                >
                  Ver como cliente
                </button>
                <button
                  onClick={signOut}
                  className="text-sm text-gray-300 hover:text-white px-3 py-1 border border-gray-600 rounded hover:border-gray-400 cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}







