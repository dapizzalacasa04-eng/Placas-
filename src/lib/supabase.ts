import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY = 'goldflow_supabase_config';

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read supabase config from localStorage', err);
  }

  // Check Vite environment variables if configured
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
  const envAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

  if (envUrl && envAnonKey) {
    return {
      url: envUrl,
      anonKey: envAnonKey,
      isConnected: true,
    };
  }

  return {
    url: '',
    anonKey: '',
    isConnected: false,
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save supabase config to localStorage', err);
  }
}

let activeClient: SupabaseClient | null = null;
let configLoadPromise: Promise<SupabaseConfig> | null = null;

export async function ensureSupabaseConfigLoaded(): Promise<SupabaseConfig> {
  const current = getStoredSupabaseConfig();
  if (current.isConnected && current.url && current.anonKey) {
    return current;
  }

  if (configLoadPromise) {
    return configLoadPromise;
  }

  configLoadPromise = (async () => {
    try {
      const res = await fetch('/goldflow-config.json', { cache: 'no-cache' });
      if (res.ok) {
        const json = await res.json();
        const url = (json.VITE_SUPABASE_URL || json.url || json.supabaseUrl || '').trim();
        const anonKey = (
          json.VITE_SUPABASE_ANON_KEY || 
          json.anonKey || 
          json.anon_key || 
          json.supabaseAnonKey || 
          ''
        ).trim();

        if (url && anonKey) {
          const loadedConfig: SupabaseConfig = {
            url,
            anonKey,
            isConnected: true,
          };
          saveStoredSupabaseConfig(loadedConfig);
          resetSupabaseClient();
          return loadedConfig;
        }
      }
    } catch {
      // Ignore network errors when goldflow-config.json is absent
    }
    return getStoredSupabaseConfig();
  })();

  return configLoadPromise;
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  if (!activeClient) {
    try {
      activeClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.error('Failed to init supabase client', e);
      return null;
    }
  }

  return activeClient;
}

export function resetSupabaseClient() {
  activeClient = null;
  configLoadPromise = null;
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL e Chave Anon são obrigatórias.' };
  }

  try {
    const client = createClient(url, anonKey);
    // Test profiles table read
    const { error: profilesErr } = await client.from('profiles').select('id').limit(1);
    
    if (profilesErr) {
      if (profilesErr.code === '42P01') {
        return { 
          success: true, 
          message: 'Conectado ao Supabase! AVISO: A tabela "profiles" ainda não existe. Copie e execute o Script SQL no SQL Editor do Supabase para criar as tabelas e liberar o RLS.' 
        };
      }
      if (profilesErr.code === '42501') {
        return {
          success: false,
          message: 'Aviso de RLS (Permissão Negada): As políticas RLS do Supabase estão bloqueando a leitura da tabela "profiles". Execute o Script SQL fornecido na aba "Script SQL" para liberar o acesso ao client anônimo.'
        };
      }
      return { success: false, message: `Erro ao consultar banco: ${profilesErr.message} (Código ${profilesErr.code})` };
    }

    return { success: true, message: 'Conexão validada com sucesso! Tabelas "profiles" e "plaques" operantes com RLS liberado.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Falha na conexão: ${msg}` };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- ============================================================
-- GOLDFLOW NFC — SCRIPT SQL COMPLETO COM POSTGRESQL & RLS
-- Execute no Supabase: Dashboard > SQL Editor > New Query > RUN
-- ============================================================

-- 1. Habilitar extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuários e Empresas (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'client',
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir remoção de restrições legadas que possam bloquear cadastro de empresas
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN full_name DROP NOT NULL;

-- 3. Tabela de Placas Inteligentes e Links Permanentes
CREATE TABLE IF NOT EXISTS public.plaques (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'google_review',
  target_url TEXT NOT NULL DEFAULT 'https://google.com',
  qr_target_type TEXT DEFAULT 'custom',
  qr_target_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_locked BOOLEAN DEFAULT false NOT NULL,
  lock_reason TEXT,
  total_nfc_scans INTEGER DEFAULT 0 NOT NULL,
  total_qr_scans INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Telemetria de Acessos (Scans)
CREATE TABLE IF NOT EXISTS public.scans (
  id BIGSERIAL PRIMARY KEY,
  plaque_id UUID NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('nfc', 'qr', 'direct')),
  device_type TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Índices de Otimização
CREATE INDEX IF NOT EXISTS idx_plaques_slug ON public.plaques(slug);
CREATE INDEX IF NOT EXISTS idx_plaques_client ON public.plaques(client_id);
CREATE INDEX IF NOT EXISTS idx_scans_plaque_created ON public.scans(plaque_id, created_at);

-- 6. Ativar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- 7. Limpar políticas antigas/restritivas que impediam inserção anônima
DROP POLICY IF EXISTS "Public and users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public delete profiles" ON public.profiles;

CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update profiles" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Allow public delete profiles" ON public.profiles FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow all read plaques" ON public.plaques;
DROP POLICY IF EXISTS "Allow all insert plaques" ON public.plaques;
DROP POLICY IF EXISTS "Allow all update plaques" ON public.plaques;
DROP POLICY IF EXISTS "Allow all delete plaques" ON public.plaques;
DROP POLICY IF EXISTS "Clients read own plaques" ON public.plaques;
DROP POLICY IF EXISTS "Clients update destination of own plaques" ON public.plaques;
DROP POLICY IF EXISTS "Admins full plaque management" ON public.plaques;
DROP POLICY IF EXISTS "Allow public read plaques" ON public.plaques;
DROP POLICY IF EXISTS "Allow public insert plaques" ON public.plaques;
DROP POLICY IF EXISTS "Allow public update plaques" ON public.plaques;
DROP POLICY IF EXISTS "Allow public delete plaques" ON public.plaques;

CREATE POLICY "Allow public read plaques" ON public.plaques FOR SELECT USING (true);
CREATE POLICY "Allow public insert plaques" ON public.plaques FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update plaques" ON public.plaques FOR UPDATE USING (true);
CREATE POLICY "Allow public delete plaques" ON public.plaques FOR DELETE USING (true);

DROP POLICY IF EXISTS "View scans of own plaques" ON public.scans;
DROP POLICY IF EXISTS "Public record scan" ON public.scans;
DROP POLICY IF EXISTS "Allow public read scans" ON public.scans;
DROP POLICY IF EXISTS "Allow public insert scans" ON public.scans;

CREATE POLICY "Allow public read scans" ON public.scans FOR SELECT USING (true);
CREATE POLICY "Allow public insert scans" ON public.scans FOR INSERT WITH CHECK (true);

-- 8. Conceder permissões para roles do Supabase
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.plaques TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.scans TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
`;
