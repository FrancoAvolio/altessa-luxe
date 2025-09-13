-- RLS para tabla public.products
-- Ejecuta este script en el SQL Editor de Supabase
-- Objetivo: cualquiera puede LEER; solo administradores pueden INSERT/UPDATE/DELETE

-- Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas previas (idempotente)
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Admin insert products" ON public.products;
DROP POLICY IF EXISTS "Admin update products" ON public.products;
DROP POLICY IF EXISTS "Admin delete products" ON public.products;

-- Lectura pública
CREATE POLICY "Public read products" ON public.products
FOR SELECT
USING (true);

-- Condición de administrador: por metadata (role=admin) o por email del admin
-- Ajusta el email si cambias el admin
-- Nota: auth.jwt() devuelve null para usuarios anónimos; coalesce evita errores

-- Insert solo admin
CREATE POLICY "Admin insert products" ON public.products
FOR INSERT
WITH CHECK (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  OR coalesce((auth.jwt() ->> 'email'), '') = 'admin@relojes.com'
);

-- Update solo admin
CREATE POLICY "Admin update products" ON public.products
FOR UPDATE
USING (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  OR coalesce((auth.jwt() ->> 'email'), '') = 'admin@relojes.com'
)
WITH CHECK (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  OR coalesce((auth.jwt() ->> 'email'), '') = 'admin@relojes.com'
);

-- Delete solo admin
CREATE POLICY "Admin delete products" ON public.products
FOR DELETE
USING (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  OR coalesce((auth.jwt() ->> 'email'), '') = 'admin@relojes.com'
);

-- Sugerencia: si prefieres permitir solo autenticados (no anónimos) para leer,
-- reemplaza USING (true) por USING (auth.role() = 'authenticated');

