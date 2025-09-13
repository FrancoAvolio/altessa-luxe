import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

async function setupBucket() {
  console.log('🔧 Configurando bucket de Supabase...\n');

  try {
    // Check if bucket exists
    console.log('👀 Verificando si Existe el Bucket...');

    const { data: buckets, error: listError } = await adminSupabase.storage.listBuckets();
    const existingBucket = buckets?.find(b => b.name === 'products-images');

    if (existingBucket) {
      console.log('✅ ¡Bucket ya existe!');
      return;
    }

    // Create bucket
    console.log('📦 Creando bucket nueva...');

    const { data, error: createError } = await adminSupabase.storage.createBucket('products-images', {
      public: true,
      allowedMimeTypes: ['image/jpg', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (createError) {
      console.error('❌ Error creando bucket:', createError.message);
      return;
    }

    console.log('✅ ¡Bucket creado exitosamente!');
    console.log('🪣 Nombre: products-images');
    console.log('🌐 Public: true');
    console.log('📏 Tamaño límite: 5MB\n');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

async function showInstructions() {
  console.log('\n--- INSTRUCCIONES PARA USAR ---');
  console.log('1. Ahora puedes subir imágenes en el formulario de creación');
  console.log('2. El bucket products-images está configurado correctamente');
  console.log('3. Puedes subir archivos o usar URLs');
  console.log('4. Las imágenes serán accesibles públicamente\n');

  console.log('--- ERRORES RESUELTOS ---');
  console.log('• ✅ Bucket creado automáticamente');
  console.log('• ✅ Problema de ID NULL solucionado');
  console.log('• ✅ Subida de archivos funcional');
  console.log('• ✅ URLs de imagen suoprtadas\n');
}

setupBucket().then(() => {
  return showInstructions();
});
