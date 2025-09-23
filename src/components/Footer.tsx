"use client";

import { useState } from "react";
import { useAdmin } from "../context/AdminContext";
import { FaRedhat, FaInstagram, FaTiktok } from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
  const { isAdmin, signIn, signOut: adminSignOut } = useAdmin();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signIn(email, password);
      setShowAdminLogin(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar sesion";
      setError(message || "Error al iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminSignOut();
    } catch (err) {
      console.error("Error al cerrar sesion:", err);
    }
  };

  return (
    <footer className="bg-black text-white mt-16 border-t border-gold">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <h3 className="text-xl font-bold mb-4 font-fancy text-gold">
              Productos
            </h3>
            <p className="text-white/80">
              Tu tienda de confianza para productos de calidad.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 font-fancy text-gold">
              Categorías
            </h4>
            <ul className="space-y-2 text-white/80">
              <li>Relojes</li>
              <li>Bolsos</li>
              <li>Camperas</li>
              <li>Billeteras</li>
              <li>Portadocumentos</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 font-fancy text-gold">
              Atención al Cliente
            </h4>
            <ul className="space-y-2 text-white/80">
              <li>Compras Seguras</li>
              <li>Garantía</li>
              <li>Atención Postventa</li>
              <li>Devoluciones</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 font-fancy text-gold">
              Síguenos
            </h4>
            <div className="flex space-x-4 text-white/80">
              <Link
                href="https://www.instagram.com/altessaluxe/"
                target="_blank"
              >
                <FaInstagram className="h-6 w-6 cursor-pointer text-gold hover:text-white/80 underline underline-offset-2" />
              </Link>
              <Link href="https://www.tiktok.com/@altessa.luxe" target="_blank">
                <FaTiktok className="h-6 w-6 cursor-pointer text-gold hover:text-white/80 underline underline-offset-2" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gold/40">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAdminLogin(!showAdminLogin)}
              className="text-xs text-gold hover:text-white/80 underline underline-offset-2 cursor-pointer"
            >
              <FaRedhat className="h-6 w-6 cursor-pointer" />
            </button>
          </div>

          {showAdminLogin && (
            <div className="mt-3 max-w-sm ml-auto">
              <div className="bg-black p-4 rounded-lg">
                <h4 className="text-sm font-semibold mb-3 text-right">
                  {isAdmin ? "Panel de Administración" : "Inicio de Sesión"}
                </h4>

                {isAdmin ? (
                  <div className="text-right">
                    <button
                      onClick={handleLogout}
                      className="text-gold hover:text-white text-xs cursor-pointer"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-3">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-xs font-medium text-white/80 mb-1"
                      >
                        Usuario
                      </label>
                      <input
                        type="text"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-black text-white rounded border border-gold focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                        placeholder="admin o x"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-xs font-medium text-white/80 mb-1"
                      >
                        Contraseña
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-black text-white rounded border border-gold focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                        placeholder="Contraseña"
                        required
                      />
                    </div>
                    {error && (
                      <div className="text-gold text-xs text-right">
                        {error}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-gold py-2 rounded  cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Iniciando..." : "Iniciar Sesión"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-gold/40 text-center text-white/70">
          <p>&copy; 2025 ALTESSA. Todos los derechos reservados.</p>
          <p className="flex justify-center items-center gap-1">
            Desarrollado por
            <Link
              href="https://www.nehros.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-[#9747FF] font-medium"
            >
              Nehros
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
