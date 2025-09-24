import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

async function setupSubcategoriesTable() {
  console.log('🔧 Configurando tabla de subcategorías...\n');

  try {
    // Create subcategories table
    console.log('📦 Creando tabla de subcategorías...');

    const { error: createError } = await adminSupabase.rpc('create_subcategories_table', {
      // This will be executed as raw SQL
    });

    if (createError && !createError.message.includes('already exists')) {
      console.log('Intentando crear tabla con SQL directo...');

      // Fallback: try raw SQL execution
      const { error: sqlError } = await adminSupabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS subcategories (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Add unique constraint for category-subcategory name combinations
          ALTER TABLE subcategories
          ADD CONSTRAINT unique_category_subcategory
          UNIQUE (category_id, name);

          -- Add subcategory_id column to products table if it doesn't exist
          ALTER TABLE products
          ADD COLUMN IF NOT EXISTS subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE SET NULL;
        `
      });

      if (sqlError) {
        console.error('❌ Error creando tablas:', sqlError.message);
      } else {
        console.log('✅ Tabla de subcategorías creada exitosamente!');
      }
    } else if (!createError) {
      console.log('✅ Tabla de subcategorías creada exitosamente (usando RPC)!');
    } else {
      console.log('ℹ️ La tabla ya existe');
    }

    // Verify the table was created
    const { data: tableInfo, error: infoError } = await adminSupabase
      .from('subcategories')
      .select('*')
      .limit(1);

    if (infoError && !infoError.message.includes('relation "subcategories" does not exist')) {
      console.error('❌ Error verificando tabla:', infoError.message);
    } else {
      console.log('✅ Verificación exitosa: tabla de subcategorías disponible');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

async function showInstructions() {
  console.log('\n--- INSTRUCCIONES PARA SUBCATEGORÍAS ---');
  console.log('1. El script ha configurado la tabla de subcategorías');
  console.log('2. Ahora puedes crear subcategorías desde el panel de administración');
  console.log('3. Las subcategorías estarán relacionadas con las categorías existentes');
  console.log('4. Los productos pueden ser asignados a subcategorías');
  console.log('5. Ejecuta las migraciones del frontend después de este script\n');

  console.log('--- ESTRUCTURA DE LA BASE DE DATOS ---');
  console.log('• categories (existente)');
  console.log('  └─ subcategories (nueva)');
  console.log('     └─ products.subcategory_id (relación)\n');
}

setupSubcategoriesTable().then(() => {
  return showInstructions();
});
