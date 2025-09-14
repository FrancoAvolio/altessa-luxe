'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabase/supabase';
import type { User } from '@supabase/supabase-js';

interface AdminContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = user?.user_metadata?.role === process.env.NEXT_PUBLIC_ADMIN_ROLE || user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    try {
      // Intento sign out global; si no hay sesión, no debe romper el flujo
      const { error } = await supabase.auth.signOut({ /* @ts-ignore */ scope: 'global' as any });
      if (error && !String(error.message).toLowerCase().includes('auth session missing')) {
        throw error;
      }
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      if (!msg.includes('auth session missing')) {
        // Fallback: limpiar token local por si quedó huérfano
        try { await supabase.auth.signOut({ /* @ts-ignore */ scope: 'local' as any }); } catch {}
        throw err;
      }
    } finally {
      // Asegurar estado local consistente
      setUser(null);
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: email.includes('admin') ? 'admin' : 'user',
        },
      },
    });
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const value: AdminContextType = {
    user,
    isAdmin,
    isLoading,
    signIn,
    signOut,
    signUp,
    resetPassword,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
