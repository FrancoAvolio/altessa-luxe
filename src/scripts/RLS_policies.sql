-- POLÍTICAS RLS PARA EL BUCKET products-images
-- Ejecuta este SQL en tu Supabase Dashboard:
-- Ve a SQL Editor y copia todo este contenido

-- 1. Política para ver imágenes (SELECT)
CREATE POLICY "Public access" ON storage.objects
FOR SELECT USING (bucket_id = 'products-images');

-- 2. Política para subir archivos (INSERT)
CREATE POLICY "Allow uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'products-images');

-- 3. Política para actualizar archivos (UPDATE)
CREATE POLICY "Allow updates" ON storage.objects
FOR UPDATE USING (bucket_id = 'products-images');

-- 4. Política para borrar archivos (DELETE)
CREATE POLICY "Allow deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'products-images');

-- Estas políticas permitirán que cualquier usuario pueda:
-- • Ver imágenes del bucket products-images
-- • Subir archivos al bucket
-- • Actualizar archivos existentes
-- • Borrar archivos

-- Para mayor seguridad, puedes agregar restricciones adicionales:
-- • Solo usuarios autenticados: auth.role() = 'authenticated'
-- • Solo usuarios admin: auth.jwt() ->> 'role' = 'admin'
-- • Usuarios específicos: auth.uid()::text = 'usuario-autorizado'
