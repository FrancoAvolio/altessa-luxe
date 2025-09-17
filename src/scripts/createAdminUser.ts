import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase project credentials (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
}

if (!adminEmail || !adminPassword) {
  throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.');
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

async function createAdminUser() {
  console.log('Checking for existing admin user...');

  try {
    const { data: listedUsers, error: listError } = await adminSupabase.auth.admin.listUsers({
      email: adminEmail,
    });

    if (listError) {
      throw listError;
    }

    const existingAdmin = listedUsers?.users?.find(user => user.email === adminEmail);

    if (existingAdmin) {
      console.log('Admin user already exists.');
      console.log('   Email:', existingAdmin.email);
      console.log('   Password: value from ADMIN_PASSWORD (not printed)');
      console.log('   Role:', existingAdmin.user_metadata?.role ?? 'admin');
      return;
    }

    console.log('Creating new admin user...');

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        name: 'Administrador',
        created_at: new Date().toISOString(),
      },
    });

    if (authError) {
      throw authError;
    }

    console.log('Admin user created successfully.');
    console.log('   Email:', authData.user?.email);
    console.log('   Password: value from ADMIN_PASSWORD (not printed)');
    console.log('   User ID:', authData.user?.id);
    console.log('   Role:', authData.user?.user_metadata?.role);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exitCode = 1;
  }
}

createAdminUser().then(() => {
  console.log('Next steps:');
  console.log(' - Validate that email confirmations are enabled in Supabase Auth settings.');
  console.log(' - Rotate ADMIN_PASSWORD periodically and update the .env.local file.');
});
