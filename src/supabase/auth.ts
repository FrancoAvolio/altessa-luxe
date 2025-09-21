// Supabase Auth utilities
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Sign up a new user
 * @param email User's email
 * @param password User's password
 * @param metadata Additional user metadata
 * @returns Promise with user data or error
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: Record<string, unknown>
) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    return { user: null, session: null, error };
  }
}

/**
 * Sign in with email and password
 * @param email User's email
 * @param password User's password
 * @returns Promise with session data or error
 */
export async function signIn(
  email: string,
  password: string
) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { session: data.session, user: data.user, error: null };
  } catch (error) {
    return { session: null, user: null, error };
  }
}

/**
 * Sign out the current user
 * @returns Promise with success or error
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Get current session
 * @returns Promise with current session or null
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get current user
 * @returns Promise with current user or null
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Reset password - sends email with reset link
 * @param email User's email
 * @returns Promise with success or error
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Update password for current user
 * @param newPassword New password
 * @returns Promise with success or error
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Auth state change listener
 * @param callback Function called when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// Helper functions for role-based access
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user) return false;
  if (user.user_metadata?.role === 'admin') return true;
  return adminEmail ? user.email === adminEmail : false;
}

export async function requireAdmin(): Promise<boolean> {
  const admin = await isAdmin();
  if (!admin) {
    // Redirect to login or show error
    console.error('Admin access required');
  }
  return admin;
}

// Mock function to create admin user
export async function createMockAdmin() {
  console.log('Define ADMIN_EMAIL and ADMIN_PASSWORD in your environment before seeding admin users.');
  console.log('You can then run a secure seed script (see src/scripts/createAdminUser.ts) or create the user from Supabase Auth > Users.');
}
