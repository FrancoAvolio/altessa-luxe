import { createClient } from '@supabase/supabase-js';
import type { AdminUserAttributes, User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL ?? '';
const adminPassword = process.env.ADMIN_PASSWORD ?? '';

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase project credentials (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
}

if (!adminEmail || !adminPassword) {
  throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.');
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

function buildAdminMetadata(user?: User | null) {
  const base = user?.user_metadata ?? {};
  return {
    ...base,
    role: 'admin',
    name: typeof base.name === 'string' && base.name.trim() ? base.name : 'Administrador',
    admin_synced_at: new Date().toISOString(),
  };
}

async function updateExistingAdmin(existingAdmin: User) {
  const updates: AdminUserAttributes = {
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: buildAdminMetadata(existingAdmin),
  };

  const { data, error } = await adminSupabase.auth.admin.updateUserById(existingAdmin.id, updates);

  if (error) {
    throw error;
  }

  console.log('Admin user metadata synchronized.');
  console.log('   Email:', data.user?.email);
  console.log('   Role:', data.user?.user_metadata?.role);
  console.log('   Name:', data.user?.user_metadata?.name);
}

async function createNewAdmin() {
  console.log('Creating new admin user...');

  const { data, error } = await adminSupabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: buildAdminMetadata(),
  });

  if (error) {
    throw error;
  }

  console.log('Admin user created successfully.');
  console.log('   Email:', data.user?.email);
  console.log('   User ID:', data.user?.id);
  console.log('   Role:', data.user?.user_metadata?.role);
}

async function ensureAdminUser() {
  console.log('Checking for existing admin user...');

  const { data, error } = await adminSupabase.auth.admin.listUsers();

  if (error) {
    throw error;
  }

  const existingAdmin = data.users.find((user) => user.email?.toLowerCase() === adminEmail.toLowerCase());

  if (existingAdmin) {
    console.log('Admin user already exists. Updating metadata/password to match environment.');
    await updateExistingAdmin(existingAdmin);
    return;
  }

  await createNewAdmin();
}

ensureAdminUser()
  .then(() => {
    console.log('Next steps:');
    console.log(' - Validate that email confirmations are enabled in Supabase Auth settings.');
    console.log(' - Rotate ADMIN_PASSWORD periodically and update the .env.local file.');
  })
  .catch((error) => {
    console.error('Error ensuring admin user:', error);
    process.exitCode = 1;
  });
