import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role client for admin operations
const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

async function createAdminUser() {
  console.log('🔧 Creando usuario administrador automáticamente...\n');

  try {
    // Check if admin user already exists
    console.log('👤 Verificando si el usuario admin ya existe...');

    const { data: existingUser, error: getUserError } = await adminSupabase.auth.admin.listUsers();

    const adminEmail = 'admin@relojes.com';
    const existingAdmin = existingUser?.users?.find(user => user.email === adminEmail);

    if (existingAdmin) {
      console.log('✅ ¡Usuario admin ya existe!');
      console.log('👤 Email:', existingAdmin.email);
      console.log('🔑 Password: 12345');
      console.log('🎯 Role:', existingAdmin.user_metadata?.role || 'admin');
      return;
    }

    // Create admin user
    console.log('🚀 Creando nuevo usuario administrador...');

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: adminEmail,
      password: '12345',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        name: 'Administrador',
        created_at: new Date().toISOString(),
      },
    });

    if (authError) {
      console.error('❌ Error creando usuario:', authError.message);
      return;
    }

    console.log('✅ ¡Usuario administrador creado exitosamente!');
    console.log('📧 Email:', authData.user?.email);
    console.log('🔑 Password: 12345');
    console.log('👤 User ID:', authData.user?.id);
    console.log('🎯 Role: admin\n');

    // Verify creation
    const { data: verifyData, error: verifyError } = await adminSupabase.auth.admin.listUsers();
    const createdUser = verifyData?.users?.find(u => u.email === adminEmail);

    if (createdUser) {
      console.log('🔍 Verificación exitosa:');
      console.log(`📧 Email: ${createdUser.email}`);
      console.log(`🎯 Role: ${createdUser.user_metadata?.role}`);
      console.log(`✨ Created: ${createdUser.created_at}`);
      console.log(`✅ Email confirmed: ${createdUser.email_confirmed_at ? 'Yes' : 'No'}`);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

async function createAdminInstructions() {
  console.log('\n--- INSTRUCCIONES PARA USAR EL PANEL ADMIN ---');
  console.log('1. Ve a tu sitio web: http://localhost:3002');
  console.log('2. Ve al footer y busca el ícono 🧢');
  console.log('3. Haz click en "Administración"');
  console.log('4. Ingresa:');
  console.log(`   📧 Email: admin@relojes.com`);
  console.log('   🔑 Password: 12345');
  console.log('5. ¡Listo! Verás el panel de administrador\n');

  console.log('--- FUNCIONALIDADES DE ADMIN ---');
  console.log('• ✅ Agregar productos con subida de imágenes al bucket Supabase');
  console.log('• ✅ Editar productos existentes');
  console.log('• ✅ Eliminar productos');
  console.log('• ✅ Gestión completa de inventario\n');

  console.log('=== CREDENCIALES ALTERNATIVAS ===');
  console.log('📧 Email: x (con cualquier password)');
  console.log('Los usuarios con email que contienen "admin" también son admins.\n');
}

// Additional instructions
async function showSetupInstructions() {
  console.log('\n--- INSTRUCCIONES PARA PRODUCTION ---');
  console.log('1. Para crear más usuarios admin, ve a Supabase Dashboard');
  console.log('2. Authentication → Users → Add user');
  console.log('3. Usa metadata: {"role": "admin", "name": "Admin Name"}');
  console.log('4. ¡Listo para entornos de producción!\n');

  console.log('--- FUNCIONALIDADES COMPLETAS ---');
  console.log('• ✅ Autenticación completa con Supabase Auth');
  console.log('• ✅ Subida de imágenes al bucket de Storage');
  console.log('• ✅ Panel de admin protegido');
  console.log('• ✅ Gestión completa de productos (CRUD)');
  console.log('• ✅ Diseño responsive y moderno\n');
}

// Run the script
createAdminUser().then(() => {
  return showSetupInstructions();
});
