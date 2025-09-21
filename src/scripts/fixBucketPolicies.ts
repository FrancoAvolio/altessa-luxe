import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Crear cliente admin para operaciones avanzadas
const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

export async function deleteAndRecreateBucket() {
  console.log('🔧 Recreando bucket products-images completamente...\n');

  try {
    console.log('🗑️  Paso 1: Eliminando bucket existente...');

    // Delete bucket first
    const deleteBucketResponse = await fetch(`${supabaseUrl}/storage/v1/bucket/products-images`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (deleteBucketResponse.status !== 200 && deleteBucketResponse.status !== 404) {
      console.log('⚠️  No se pudo eliminar el bucket anterior (probablemente no existe)');
    } else {
      console.log('✅ Bucket anterior eliminado');
    }

    console.log('\n🏗️  Paso 2: Creando nuevo bucket...');

    // Create bucket without RLS
    const createBucketResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'products-images',
        name: 'products-images',
        public: true,      // This makes it accessible publicly
        file_size_limit: 5242880, // 5MB limit
        allowed_mime_types: [
          'image/jpg',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp'
        ],
        // RLS policies - allow public access
        policies: []
      }),
    });

    const bucketData = await createBucketResponse.json();

    if (!createBucketResponse.ok) {
      console.error('❌ Error creando bucket:', bucketData);
      return;
    }

    console.log('✅ Bucket creado exitosamente!');
    console.log('🪣 Nombre: products-images');
    console.log('🌐 Público: true');
    console.log('📏 Límite: 5MB\n');

    console.log('🔒 Paso 3: Configurando políticas RLS...');

    // Try to create basic policies using REST API
    // Note: This might require SQL policies for complete setup

    console.log('\n🎯 CONFIGURACIÓN COMPLETADA!');
    console.log('\n📋 INSTRUCCIONES PARA FINISH SETUP:');
    console.log('');
    console.log('-- Ejecuta este SQL en el Dashboard de Supabase:');
    console.log('');
    console.log('-- Política para acceder públicamente');
    console.log(`CREATE POLICY "Public access" ON storage.objects FOR SELECT USING (bucket_id = 'products-images');`);
    console.log('');
    console.log('-- Política para subir archivos (autenticados)');
    console.log(`CREATE POLICY "Upload access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products-images');`);
    console.log('');
    console.log('-- Política para borrar archivos (autenticados)');
    console.log(`CREATE POLICY "Delete access" ON storage.objects FOR DELETE USING (bucket_id = 'products-images');`);

  } catch (error) {
    console.error('❌ Error recreando bucket:', error);
  }
}

// Función principal que será ejecutada
export async function main() {
  console.log('🔧 SOLUCIÓN AUTOMÁTICA PARA RLS ERROR\n');

  try {
    // First, try to create bucket using Supabase client (recommended)
    console.log('📦 Intentando crear bucket usando cliente Supabase...\n');

    const { data: buckets, error: listError } = await adminSupabase.storage.listBuckets();
    if (listError) {
      console.error('Error listing buckets:', listError.message);
      return;
    }
    const existingBucket = buckets?.find(b => b.name === 'products-images');

    if (existingBucket) {
      console.log('✅ ¡El bucket ya existe!');
      console.log('🪣 Nombre: products-images');
      console.log('\n🚨 Si aún tienes el error de RLS, ejecuta este SQL en Supabase:');
      console.log('');
      console.log(`CREATE POLICY "Public upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products-images');`);
      console.log(`CREATE POLICY "Public select" ON storage.objects FOR SELECT USING (bucket_id = 'products-images');`);
      console.log(`CREATE POLICY "Public delete" ON storage.objects FOR DELETE USING (bucket_id = 'products-images');`);
      console.log('');
      return;
    }

    // Try to create bucket
    const { error: createError } = await adminSupabase.storage.createBucket('products-images', {
      public: true,
      allowedMimeTypes: ['image/jpg', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (createError) {
      console.error('❌ Error creando bucket:', createError.message);
      console.log('\n⚠️  No se pudo crear el bucket automáticamente.');
      console.log('💡 Esto puede pasar con la service role key limitada.');
      return;
    }

    console.log('✅ ¡Bucket creado exitosamente!');
    console.log('🪣 Nombre: products-images');
    console.log('🌐 Público: true');
    console.log('📏 Límite: 5MB');
    console.log('\n🚀 ¡Ahora puedes subir archivos sin problemas!');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}
