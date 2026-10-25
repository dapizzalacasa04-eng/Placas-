import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient, ensureSupabaseConfigLoaded } from './supabase';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

// Local cache key for auth status fallback
const AUTH_USER_KEY = 'goldflow_auth_user_v2';

export async function getInitialAuthState(): Promise<AuthState> {
  await ensureSupabaseConfigLoaded();
  const supabase = getSupabaseClient();

  if (!supabase) {
    // If no Supabase configured yet, check local session cache
    const cached = localStorage.getItem(AUTH_USER_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          isAuthenticated: true,
          user: parsed,
          session: null,
          loading: false,
          error: null,
        };
      } catch {}
    }
    return {
      isAuthenticated: false,
      user: null,
      session: null,
      loading: false,
      error: null,
    };
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Supabase getSession notice:', error.message);
      return {
        isAuthenticated: false,
        user: null,
        session: null,
        loading: false,
        error: error.message,
      };
    }

    if (data?.session?.user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.session.user));
      return {
        isAuthenticated: true,
        user: data.session.user,
        session: data.session,
        loading: false,
        error: null,
      };
    }
  } catch (err) {
    console.warn('Error reading Supabase auth session:', err);
  }

  return {
    isAuthenticated: false,
    user: null,
    session: null,
    loading: false,
    error: null,
  };
}

// Real Supabase Auth login with email & password (NO hardcoded password)
export async function signInOwner(
  email: string,
  password: string
): Promise<{ user: User | null; session: Session | null; error: string | null }> {
  await ensureSupabaseConfigLoaded();
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      user: null,
      session: null,
      error: 'Supabase não conectado. Configure a URL e Chave Anon do projeto primeiro.',
    };
  }

  const cleanEmail = email.trim();
  const cleanPassword = password;

  if (!cleanEmail || !cleanPassword) {
    return { user: null, session: null, error: 'E-mail e senha são obrigatórios.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (error) {
      let friendlyMsg = error.message;
      if (error.message.includes('Invalid login credentials')) {
        friendlyMsg = 'E-mail ou senha incorretos. Verifique suas credenciais.';
      } else if (error.message.includes('Email not confirmed')) {
        friendlyMsg = 'E-mail ainda não confirmado no Supabase. Verifique sua caixa de entrada ou desative a confirmação de e-mail no dashboard do Supabase (Auth > Providers > Email).';
      }
      return { user: null, session: null, error: friendlyMsg };
    }

    if (data?.user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    }

    return { user: data?.user || null, session: data?.session || null, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { user: null, session: null, error: `Falha na autenticação: ${msg}` };
  }
}

// Register owner with Supabase Auth (for initial account setup)
export async function signUpOwner(
  email: string,
  password: string,
  fullName?: string
): Promise<{ user: User | null; session: Session | null; error: string | null; message?: string }> {
  await ensureSupabaseConfigLoaded();
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      user: null,
      session: null,
      error: 'Supabase não conectado. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY primeiro.',
    };
  }

  const cleanEmail = email.trim();
  const cleanPassword = password;

  if (!cleanEmail || !cleanPassword) {
    return { user: null, session: null, error: 'E-mail e senha são obrigatórios.' };
  }

  if (cleanPassword.length < 6) {
    return { user: null, session: null, error: 'A senha deve ter no mínimo 6 caracteres.' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          full_name: fullName?.trim() || 'Proprietário GoldFlow',
          role: 'admin',
        },
      },
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    if (data?.user) {
      // Create owner profile in public.profiles table
      try {
        await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            email: data.user.email,
            role: 'admin',
            full_name: fullName?.trim() || 'Proprietário GoldFlow',
            company_name: 'GoldFlow NFC',
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (profErr) {
        console.warn('Profile creation during signup notice:', profErr);
      }
    }

    if (data?.session) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      return {
        user: data.user,
        session: data.session,
        error: null,
        message: 'Conta de administrador criada e autenticada com sucesso!',
      };
    }

    return {
      user: data?.user || null,
      session: null,
      error: null,
      message: 'Conta criada! Se a confirmação de e-mail estiver ativada no seu Supabase, verifique sua caixa de entrada para confirmar o acesso.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { user: null, session: null, error: `Falha ao registrar administrador: ${msg}` };
  }
}

// Sign out from Supabase Auth
export async function signOutOwner(): Promise<{ error: string | null }> {
  localStorage.removeItem(AUTH_USER_KEY);
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
  }
  return { error: null };
}

// Send password reset email via Supabase Auth
export async function resetPasswordForOwner(email: string): Promise<{ success: boolean; message: string }> {
  await ensureSupabaseConfigLoaded();
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { success: false, message: 'Supabase não conectado.' };
  }

  const cleanEmail = email.trim();
  if (!cleanEmail) {
    return { success: false, message: 'Por favor, informe o seu e-mail cadastrado.' };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin + '/gestao-privada-goldflow',
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: 'Instruções de recuperação enviadas para o seu e-mail cadastrado!',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Erro ao solicitar recuperação: ${msg}` };
  }
}

// Subscribe to auth state changes
export function subscribeToAuthChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem(AUTH_USER_KEY);
    }
    callback(event, session);
  });

  return () => {
    data.subscription.unsubscribe();
  };
}
