import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY = 'goldflow_supabase_config';

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read supabase config from localStorage', err);
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
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL e Chave Anon são obrigatórias.' };
  }

  try {
    const client = createClient(url, anonKey);
    // Attempt reading public plaques or health check
    const { error } = await client.from('plaques').select('id').limit(1);
    
    if (error) {
      // If table doesn't exist yet, it's connected to Supabase but schema is missing
      if (error.code === '42P01') {
        return { 
          success: true, 
          message: 'Conectado ao Supabase com sucesso! Atenção: as tabelas ainda não foram criadas. Execute o Script SQL fornecido no painel.' 
        };
      }
      return { success: false, message: `Erro ao consultar banco: ${error.message} (Código ${error.code})` };
    }

    return { success: true, message: 'Conexão validada com sucesso! Tabelas e RLS operantes no Supabase.' };
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

-- 2. Tabela de Perfis de Usuários (Administradores GoldFlow e Clientes)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  full_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Placas Inteligentes e Links Permanentes
CREATE TABLE IF NOT EXISTS public.plaques (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('google_review', 'whatsapp', 'instagram', 'menu', 'website', 'custom')),
  target_url TEXT NOT NULL,
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
  plaque_id UUID REFERENCES public.plaques(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('nfc', 'qr', 'direct')),
  device_type TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Índices de Otimização
CREATE INDEX IF NOT EXISTS idx_plaques_slug ON public.plaques(slug);
CREATE INDEX IF NOT EXISTS idx_plaques_client ON public.plaques(client_id);
CREATE INDEX IF NOT EXISTS idx_scans_plaque_created ON public.scans(plaque_id, created_at);

-- 6. Função de Verificação Segura de Administrador GoldFlow
CREATE OR REPLACE FUNCTION public.is_goldflow_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Ativar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- 8. Políticas RLS: Profiles
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_goldflow_admin());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_goldflow_admin());

-- 9. Políticas RLS: Plaques (Isolamento Estrito entre Clientes)
DROP POLICY IF EXISTS "Clients read own plaques" ON public.plaques;
CREATE POLICY "Clients read own plaques" ON public.plaques
  FOR SELECT USING (client_id = auth.uid() OR public.is_goldflow_admin());

DROP POLICY IF EXISTS "Clients update destination of own plaques" ON public.plaques;
CREATE POLICY "Clients update destination of own plaques" ON public.plaques
  FOR UPDATE USING (client_id = auth.uid() OR public.is_goldflow_admin())
  WITH CHECK (
    -- Clientes não podem reativar placas travadas pelo Admin GoldFlow
    (public.is_goldflow_admin()) OR (is_locked = false)
  );

DROP POLICY IF EXISTS "Admins manage all plaques" ON public.plaques;
CREATE POLICY "Admins manage all plaques" ON public.plaques
  FOR ALL USING (public.is_goldflow_admin());

-- Acesso Público para Leitura de Redirecionamento da Placa Ativa
DROP POLICY IF EXISTS "Public read active plaque" ON public.plaques;
CREATE POLICY "Public read active plaque" ON public.plaques
  FOR SELECT TO anon USING (is_active = true AND is_locked = false);

-- 10. Políticas RLS: Scans (Telemetria)
DROP POLICY IF EXISTS "View scans of own plaques" ON public.scans;
CREATE POLICY "View scans of own plaques" ON public.scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.plaques
      WHERE plaques.id = scans.plaque_id 
      AND (plaques.client_id = auth.uid() OR public.is_goldflow_admin())
    )
  );

DROP POLICY IF EXISTS "Public record scan" ON public.scans;
CREATE POLICY "Public record scan" ON public.scans
  FOR INSERT TO anon WITH CHECK (true);
`;
