'use client';

import { useAdmin } from '../context/AdminContext';
import Link from 'next/link';
import Image from 'next/image';

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
    <nav className="fixed top-0 left-0 right-0 bg-black shadow-md z-50 border-b border-gold text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <Image src="/altessa-wordmark.svg" alt="ALTESSA logo" width={160} height={40} className="rounded" />
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/contact" className="text-sm text-gold font-fancy hover:text-white">Contacto</Link>
            {isLogged ? (
              <>
                <span className="text-sm text-gold">Bienvenido, {user?.email}</span>
                <button
                  onClick={handleViewAsCustomer}
                  className="text-sm btn-black px-3 py-1 rounded cursor-pointer"
                  title="Cerrar sesión y ver como cliente"
                >
                  Ver como cliente
                </button>
                <button
                  onClick={signOut}
                  className="text-sm text-gold hover:text-white px-3 py-1 border border-gold rounded hover:border-white cursor-pointer"
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











