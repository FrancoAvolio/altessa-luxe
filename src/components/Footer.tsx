'use client';

import { useState } from 'react';
import { useAdmin } from '../context/AdminContext';

export default function Footer() {
  const { isAdmin, signIn, signOut: adminSignOut } = useAdmin();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      setShowAdminLogin(false);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesiÃ³n');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminSignOut();
    } catch (err: any) {
      console.error('Error al cerrar sesiÃ³n:', err);
    }
  };

  return (
    <footer className="bg-black-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <h3 className="text-xl font-bold mb-4">Relojes</h3>
            <p className="text-gray-300">Tu tienda de confianza para relojes de calidad.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Categorías</h4>
            <ul className="space-y-2 text-gray-300">
              <li>Relojes Deportivos</li>
              <li>Relojes Clásicos</li>
              <li>Relojes Inteligentes</li>
              <li>Relojes de Bolsillo</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Atención al Cliente</h4>
            <ul className="space-y-2 text-gray-300">
              <li>Compras Seguras</li>
              <li>Garantía</li>
              <li>Envíos Gratuitos</li>
              <li>Devoluciones</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Siguenos</h4>
            <div className="flex space-x-4 text-gray-300">
              <span>Facebook</span>
              <span>Instagram</span>
              <span>Twitter</span>
            </div>
          </div>
        </div>

        {/* Admin (discreto) */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAdminLogin(!showAdminLogin)}
              className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 cursor-pointer"
            >
              Administrar
            </button>
          </div>

          {showAdminLogin && (
            <div className="mt-3 max-w-sm ml-auto">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-sm font-semibold mb-3 text-right">
                  {isAdmin ? 'Panel de AdministraciÃ³n' : 'Inicio de SesiÃ³n'}
                </h4>

                {isAdmin ? (
                  <div className="text-right">
                    <button
                      onClick={handleLogout}
                      className="text-red-400 hover:text-red-300 text-xs cursor-pointer"
                    >
                      Cerrar sesiÃ³n
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-3">
                    <div>
                      <label htmlFor="email" className="block text-xs font-medium text-gray-300 mb-1">Usuario</label>
                      <input
                        type="text"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="admin o x"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-xs font-medium text-gray-300 mb-1">ContraseÃ±a</label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="12345"
                        required
                      />
                    </div>
                    {error && <div className="text-red-400 text-xs text-right">{error}</div>}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Iniciando...' : 'Iniciar SesiÃ³n'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; 2024 Relojes. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}


