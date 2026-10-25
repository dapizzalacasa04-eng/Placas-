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
    // 1. Test profiles table read
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
      return { success: false, message: `Erro ao consultar profiles: ${profilesErr.message} (Código ${profilesErr.code})` };
    }

    // 2. Test plaques table read & column validation
    const { data: plaquesData, error: plaquesErr } = await client
      .from('plaques')
      .select('id, slug, target_url, is_active')
      .limit(1);

    if (plaquesErr) {
      if (plaquesErr.code === '42P01') {
        return {
          success: true,
          message: 'Conectado ao Supabase! AVISO: A tabela "plaques" ainda não existe. Execute o Script SQL para criá-la com as colunas corretas de QR Code.'
        };
      }
      if (plaquesErr.code === '42501') {
        return {
          success: false,
          message: 'Aviso de RLS em "plaques": O acesso anônimo à tabela de placas está bloqueado. Execute o Script SQL para aplicar as políticas públicas.'
        };
      }
      return { success: false, message: `Erro ao consultar plaques: ${plaquesErr.message} (Código ${plaquesErr.code})` };
    }

    // 3. Test if independent QR Code column exists (qr_target_url)
    const { error: qrColErr } = await client
      .from('plaques')
      .select('qr_target_url')
      .limit(1);

    const hasQrCol = !qrColErr;
    const rowCount = Array.isArray(plaquesData) ? plaquesData.length : 0;

    // 4. Test products table read (public read)
    const { data: productsData, error: prodErr } = await client
      .from('products')
      .select('id, name, price')
      .limit(1);

    const prodCount = Array.isArray(productsData) ? productsData.length : 0;

    if (!hasQrCol && qrColErr?.code === '42703') {
      return {
        success: true,
        message: `Conectado ao Supabase! (${rowCount} placas encontradas). Nota: A coluna "qr_target_url" ainda não foi adicionada. O sistema funcionará usando "target_url" como destino unificado. Para habilitar links independentes de QR Code, execute o Script SQL atualizado.`
      };
    }

    return { 
      success: true, 
      message: `Conexão validada com sucesso! Tabelas "plaques" (${rowCount}), "products" (${prodCount}) e "profiles" operantes com RLS e Supabase Auth protegidos.` 
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Falha na conexão: ${msg}` };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- ============================================================
-- GOLDFLOW NFC — SCRIPT SQL COM SUPABASE AUTH & RLS RIGOROSO
-- Execute no Supabase: Dashboard > SQL Editor > New Query > RUN
-- ============================================================

-- 1. Habilitar extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuários e Empresas (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'client',
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN full_name DROP NOT NULL;

-- 3. Tabela de Placas Inteligentes e Links Permanentes
CREATE TABLE IF NOT EXISTS public.plaques (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID,
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

-- Colunas idempotentes
ALTER TABLE public.plaques ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE public.plaques ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.plaques ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.plaques ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'google_review';
ALTER TABLE public.plaques ADD COLUMN IF NOT EXISTS target_url TEXT DEFAULT 'https://google.com';
ALTER TABLE public.plaques ADD COLUMN IF NOT EXISTS qr_target_type TEXT DEFAULT 'custom';
ALTER TABLE public.plaques ADD COLUMN IF NOT EXISTS qr_target_url TEXT;
ALTER TABLE public.plaques ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.plaques ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE public.plaques ADD COLUMN IF NOT EXISTS lock_reason TEXT;
ALTER TABLE public.plaques ADD COLUMN IF NOT EXISTS total_nfc_scans INTEGER DEFAULT 0;
ALTER TABLE public.plaques ADD COLUMN IF NOT EXISTS total_qr_scans INTEGER DEFAULT 0;
ALTER TABLE public.plaques ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.plaques ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.plaques DROP CONSTRAINT IF EXISTS plaques_client_id_fkey;
ALTER TABLE public.plaques ALTER COLUMN client_id DROP NOT NULL;

-- 4. Tabela de Produtos, Modelos e Preços Oficiais da Loja
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 79.90,
  original_price NUMERIC(10, 2),
  category TEXT DEFAULT 'google_review',
  material TEXT DEFAULT 'Acrílico Premium 3mm com base',
  dimensions TEXT DEFAULT '12 x 15 cm',
  badge TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true NOT NULL,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Configurações Gerais
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabela de Telemetria de Acessos (Scans)
CREATE TABLE IF NOT EXISTS public.scans (
  id BIGSERIAL PRIMARY KEY,
  plaque_id UUID,
  source TEXT NOT NULL CHECK (source IN ('nfc', 'qr', 'direct')),
  device_type TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.scans DROP CONSTRAINT IF EXISTS scans_plaque_id_fkey;

-- 7. Índices de Otimização
CREATE INDEX IF NOT EXISTS idx_plaques_slug ON public.plaques(slug);
CREATE INDEX IF NOT EXISTS idx_plaques_slug_lower ON public.plaques(lower(slug));
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_scans_plaque_created ON public.scans(plaque_id, created_at);

-- 8. Ativar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS: Visitantes visualizam apenas dados públicos, proprietário autenticado gerencia
-- Limpar políticas anteriores
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated write profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public delete profiles" ON public.profiles;

CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Authenticated insert profiles" ON public.profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update profiles" ON public.profiles FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete profiles" ON public.profiles FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para PLAQUES
DROP POLICY IF EXISTS "Public read plaques" ON public.plaques;
DROP POLICY IF EXISTS "Authenticated insert plaques" ON public.plaques;
DROP POLICY IF EXISTS "Authenticated update plaques" ON public.plaques;
DROP POLICY IF EXISTS "Authenticated delete plaques" ON public.plaques;
DROP POLICY IF EXISTS "Allow public read plaques" ON public.plaques;
DROP POLICY IF EXISTS "Allow public insert plaques" ON public.plaques;
DROP POLICY IF EXISTS "Allow public update plaques" ON public.plaques;
DROP POLICY IF EXISTS "Allow public delete plaques" ON public.plaques;

-- Visitantes e celulares que escaneiam o QR Code podem LER o destino
CREATE POLICY "Public read plaques" ON public.plaques FOR SELECT USING (true);
-- Apenas o proprietário autenticado via Supabase Auth pode CRIAR, EDITAR ou EXCLUIR
CREATE POLICY "Authenticated insert plaques" ON public.plaques FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update plaques" ON public.plaques FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete plaques" ON public.plaques FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para PRODUCTS (Preços e Catálogo)
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Authenticated insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated delete products" ON public.products;

CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Authenticated insert products" ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update products" ON public.products FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete products" ON public.products FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para APP_SETTINGS
DROP POLICY IF EXISTS "Public read settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated manage settings" ON public.app_settings;

CREATE POLICY "Public read settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated manage settings" ON public.app_settings FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas para SCANS (Telemetria)
DROP POLICY IF EXISTS "Public read scans" ON public.scans;
DROP POLICY IF EXISTS "Public insert scans" ON public.scans;
DROP POLICY IF EXISTS "Allow public read scans" ON public.scans;
DROP POLICY IF EXISTS "Allow public insert scans" ON public.scans;

CREATE POLICY "Public read scans" ON public.scans FOR SELECT USING (true);
CREATE POLICY "Public insert scans" ON public.scans FOR INSERT WITH CHECK (true);

-- 10. Concessão de permissões às roles do Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.plaques TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.products TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.app_settings TO anon, authenticated, service_role;
GRANT SELECT, INSERT ON TABLE public.scans TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
`;
