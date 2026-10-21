import { Plaque, ScanEvent, UserProfile, UserRole } from '../types';
import { getSupabaseClient } from './supabase';

const USERS_STORAGE_KEY = 'goldflow_users_v1';
const CURRENT_USER_KEY = 'goldflow_current_user_v1';
const PLAQUES_STORAGE_KEY = 'goldflow_plaques_v1';
const SCANS_STORAGE_KEY = 'goldflow_scans_v1';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-admin-1',
    email: 'admin@goldflow.com.br',
    role: 'admin',
    fullName: 'Rodrigo Silva',
    companyName: 'GoldFlow NFC Central',
    phone: '(11) 99876-5432',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'user-client-1',
    email: 'contato@bistroroyal.com.br',
    role: 'client',
    fullName: 'Marcos Lima',
    companyName: 'Bistrô Royal Gastronomia',
    phone: '(11) 98765-4321',
    createdAt: '2026-02-14T14:30:00Z',
  },
  {
    id: 'user-client-2',
    email: 'gestao@fitprime.com.br',
    role: 'client',
    fullName: 'Juliana Rocha',
    companyName: 'Academia FitPrime Moema',
    phone: '(11) 97654-3210',
    createdAt: '2026-03-01T09:15:00Z',
  },
];

export const INITIAL_PLAQUES: Plaque[] = [
  {
    id: 'plaque-1',
    clientId: 'user-client-1',
    clientName: 'Bistrô Royal Gastronomia',
    slug: 'bistro-royal-balcao',
    title: 'Totem Balcão Principal & Caixa',
    targetType: 'google_review',
    targetUrl: 'https://g.page/r/Cbistro-royal/review',
    qrTargetType: 'google_review',
    qrTargetUrl: 'https://g.page/r/Cbistro-royal/review',
    targetParams: {
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    },
    isActive: true,
    isLocked: false,
    totalNfcScans: 284,
    totalQrScans: 196,
    createdAt: '2026-02-15T11:00:00Z',
    updatedAt: '2026-03-12T16:40:00Z',
  },
  {
    id: 'plaque-2',
    clientId: 'user-client-1',
    clientName: 'Bistrô Royal Gastronomia',
    slug: 'bistro-royal-cardapio',
    title: 'Displays de Mesa — Cardápio & Drinks',
    targetType: 'menu',
    targetUrl: 'https://cardapio.bistroroyal.com.br/carta-de-vinhos',
    qrTargetType: 'instagram',
    qrTargetUrl: 'https://instagram.com/bistroroyal',
    isActive: true,
    isLocked: false,
    totalNfcScans: 412,
    totalQrScans: 538,
    createdAt: '2026-02-18T15:20:00Z',
    updatedAt: '2026-03-20T18:10:00Z',
  },
  {
    id: 'plaque-3',
    clientId: 'user-client-2',
    clientName: 'Academia FitPrime Moema',
    slug: 'fitprime-checkin',
    title: 'Placa Recepção — WhatsApp & Check-in',
    targetType: 'whatsapp',
    targetUrl: 'https://wa.me/5511976543210?text=Ol%C3%A1%21%20Gostaria%20de%20agendar%20minha%20aula%20experimental%20na%20FitPrime.',
    qrTargetType: 'whatsapp',
    qrTargetUrl: 'https://wa.me/5511976543210?text=Ol%C3%A1%21%20Gostaria%20de%20agendar%20minha%20aula%20experimental%20na%20FitPrime.',
    targetParams: {
      whatsappNumber: '5511976543210',
      whatsappMessage: 'Olá! Gostaria de agendar minha aula experimental na FitPrime.',
    },
    isActive: true,
    isLocked: false,
    totalNfcScans: 673,
    totalQrScans: 421,
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-04-01T12:00:00Z',
  },
];

// Helper to load or initialize from localStorage
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading ${key}`, err);
  }
  localStorage.setItem(key, JSON.stringify(defaultValue));
  return defaultValue;
}

function saveStored<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key}`, err);
  }
}

// User state
export function getUsers(): UserProfile[] {
  return getStored<UserProfile[]>(USERS_STORAGE_KEY, INITIAL_USERS);
}

export function getCurrentUser(): UserProfile {
  const users = getUsers();
  const currentId = localStorage.getItem(CURRENT_USER_KEY);
  const found = users.find((u) => u.id === currentId);
  if (found) return found;
  // Default to Admin or first client
  const fallback = users[0] || INITIAL_USERS[0];
  localStorage.setItem(CURRENT_USER_KEY, fallback.id);
  return fallback;
}

export function setCurrentUser(userId: string): UserProfile {
  const users = getUsers();
  const found = users.find((u) => u.id === userId);
  if (!found) throw new Error('Usuário não encontrado');
  localStorage.setItem(CURRENT_USER_KEY, found.id);
  return found;
}

// Plaques
export async function getPlaques(currentUser: UserProfile): Promise<Plaque[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let query = supabase.from('plaques').select('*');
      if (currentUser.role !== 'admin') {
        query = query.eq('client_id', currentUser.id);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          clientId: d.client_id,
          slug: d.slug,
          title: d.title,
          targetType: d.target_type,
          targetUrl: d.target_url,
          qrTargetType: d.qr_target_type || d.target_type,
          qrTargetUrl: d.qr_target_url || d.target_url,
          isActive: d.is_active,
          isLocked: d.is_locked,
          lockReason: d.lock_reason,
          totalNfcScans: d.total_nfc_scans || 0,
          totalQrScans: d.total_qr_scans || 0,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase query failed, falling back to local storage', e);
    }
  }

  const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
  const users = getUsers();

  // Populate clientName and ensure qrTargetUrl is set
  const enriched = allPlaques.map((p) => {
    const owner = users.find((u) => u.id === p.clientId);
    return {
      ...p,
      qrTargetUrl: p.qrTargetUrl || p.targetUrl,
      qrTargetType: p.qrTargetType || p.targetType,
      clientName: owner ? owner.companyName : p.clientName || 'Cliente GoldFlow',
    };
  });

  // Strict RLS isolation rule:
  // If role is client, ONLY return plaques belonging to this client!
  if (currentUser.role === 'client') {
    return enriched.filter((p) => p.clientId === currentUser.id);
  }

  return enriched;
}

export function getPlaqueBySlug(slug: string): Plaque | undefined {
  const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
  const normalized = slug.trim().toLowerCase();
  return allPlaques.find((p) => p.slug.toLowerCase() === normalized);
}

export async function updatePlaqueDestination(
  user: UserProfile,
  plaqueId: string,
  targetType: Plaque['targetType'],
  targetUrl: string,
  targetParams?: Plaque['targetParams']
): Promise<Plaque> {
  const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
  const index = allPlaques.findIndex((p) => p.id === plaqueId);
  if (index === -1) throw new Error('Placa não encontrada');

  const plaque = allPlaques[index];

  // Security Check (RLS emulation):
  if (user.role !== 'admin' && plaque.clientId !== user.id) {
    throw new Error('Acesso negado: Você não tem permissão para alterar esta placa.');
  }

  if (plaque.isLocked && user.role !== 'admin') {
    throw new Error('Esta placa está bloqueada pela administração e não pode ter o destino alterado.');
  }

  const updated: Plaque = {
    ...plaque,
    targetType,
    targetUrl,
    targetParams: targetParams || plaque.targetParams,
    updatedAt: new Date().toISOString(),
  };

  allPlaques[index] = updated;
  saveStored(PLAQUES_STORAGE_KEY, allPlaques);

  // Sync with Supabase if connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('plaques')
        .update({
          target_type: targetType,
          target_url: targetUrl,
          updated_at: updated.updatedAt,
        })
        .eq('id', plaqueId);
    } catch (e) {
      console.warn('Failed to sync plaque update to Supabase', e);
    }
  }

  return updated;
}

export async function updatePlaqueQrDestination(
  user: UserProfile,
  plaqueId: string,
  qrTargetUrl: string,
  qrTargetType: Plaque['targetType'] = 'custom'
): Promise<Plaque> {
  const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
  const index = allPlaques.findIndex((p) => p.id === plaqueId);
  if (index === -1) throw new Error('Placa não encontrada');

  const plaque = allPlaques[index];

  // Security Check (RLS check):
  if (user.role !== 'admin' && plaque.clientId !== user.id) {
    throw new Error('Acesso negado: Você não tem permissão para alterar o QR Code desta placa.');
  }

  const updated: Plaque = {
    ...plaque,
    qrTargetUrl: qrTargetUrl.trim(),
    qrTargetType,
    updatedAt: new Date().toISOString(),
  };

  allPlaques[index] = updated;
  saveStored(PLAQUES_STORAGE_KEY, allPlaques);

  // Sync with Supabase if connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('plaques')
        .update({
          qr_target_url: updated.qrTargetUrl,
          qr_target_type: updated.qrTargetType,
          updated_at: updated.updatedAt,
        })
        .eq('id', plaqueId);
    } catch (e) {
      console.warn('Failed to sync plaque QR update to Supabase', e);
    }
  }

  return updated;
}

export async function togglePlaqueLock(
  user: UserProfile,
  plaqueId: string,
  lockState: boolean,
  reason?: string
): Promise<Plaque> {
  const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
  const index = allPlaques.findIndex((p) => p.id === plaqueId);
  if (index === -1) throw new Error('Placa não encontrada');

  const plaque = allPlaques[index];

  // Only GoldFlow Admin can set administrative lock!
  // Client can toggle isActive on/off for pause, but NOT isLocked!
  if (user.role !== 'admin') {
    throw new Error('Apenas administradores GoldFlow podem bloquear/desbloquear placas remotamente.');
  }

  const updated: Plaque = {
    ...plaque,
    isLocked: lockState,
    lockReason: lockState ? (reason || 'Bloqueio administrativo temporário.') : undefined,
    updatedAt: new Date().toISOString(),
  };

  allPlaques[index] = updated;
  saveStored(PLAQUES_STORAGE_KEY, allPlaques);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('plaques')
        .update({
          is_locked: lockState,
          lock_reason: updated.lockReason,
          updated_at: updated.updatedAt,
        })
        .eq('id', plaqueId);
    } catch (e) {
      console.warn('Failed to sync plaque lock to Supabase', e);
    }
  }

  return updated;
}

export async function togglePlaqueActive(
  user: UserProfile,
  plaqueId: string,
  activeState: boolean
): Promise<Plaque> {
  const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
  const index = allPlaques.findIndex((p) => p.id === plaqueId);
  if (index === -1) throw new Error('Placa não encontrada');

  const plaque = allPlaques[index];
  if (user.role !== 'admin' && plaque.clientId !== user.id) {
    throw new Error('Acesso negado');
  }

  const updated: Plaque = {
    ...plaque,
    isActive: activeState,
    updatedAt: new Date().toISOString(),
  };

  allPlaques[index] = updated;
  saveStored(PLAQUES_STORAGE_KEY, allPlaques);
  return updated;
}

// Record scan event (NFC or QR Code)
export async function recordPlaqueScan(
  slug: string,
  source: 'nfc' | 'qr' | 'direct'
): Promise<{ plaque: Plaque; scan: ScanEvent } | null> {
  const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
  const index = allPlaques.findIndex((p) => p.slug.toLowerCase() === slug.toLowerCase());
  if (index === -1) return null;

  const plaque = allPlaques[index];
  
  // Detect mobile device
  const ua = navigator.userAgent;
  let deviceType: 'iOS' | 'Android' | 'Desktop' = 'Desktop';
  if (/iPad|iPhone|iPod/.test(ua)) {
    deviceType = 'iOS';
  } else if (/Android/.test(ua)) {
    deviceType = 'Android';
  }

  // Atomic increments
  if (source === 'nfc') {
    plaque.totalNfcScans = (plaque.totalNfcScans || 0) + 1;
  } else if (source === 'qr') {
    plaque.totalQrScans = (plaque.totalQrScans || 0) + 1;
  } else {
    // direct
    plaque.totalNfcScans = (plaque.totalNfcScans || 0) + 1;
  }

  plaque.updatedAt = new Date().toISOString();
  allPlaques[index] = plaque;
  saveStored(PLAQUES_STORAGE_KEY, allPlaques);

  const scan: ScanEvent = {
    id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    plaqueId: plaque.id,
    source,
    deviceType,
    userAgent: ua,
    timestamp: new Date().toISOString(),
  };

  const scans = getStored<ScanEvent[]>(SCANS_STORAGE_KEY, []);
  scans.unshift(scan);
  // Keep last 500 scans in local storage
  if (scans.length > 500) scans.length = 500;
  saveStored(SCANS_STORAGE_KEY, scans);

  // Sync to Supabase if available
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('scans').insert({
        plaque_id: plaque.id,
        source,
        device_type: deviceType,
        user_agent: ua,
      });
    } catch (e) {
      console.warn('Failed to insert scan in Supabase', e);
    }
  }

  return { plaque, scan };
}

export function getRecentScans(user: UserProfile, plaqueId?: string): ScanEvent[] {
  const scans = getStored<ScanEvent[]>(SCANS_STORAGE_KEY, []);
  const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);

  if (user.role === 'admin') {
    if (plaqueId) return scans.filter((s) => s.plaqueId === plaqueId);
    return scans;
  }

  // Client role: only scans for their own plaques
  const clientPlaqueIds = new Set(allPlaques.filter((p) => p.clientId === user.id).map((p) => p.id));
  return scans.filter((s) => clientPlaqueIds.has(s.plaqueId) && (!plaqueId || s.plaqueId === plaqueId));
}

// Create new Plaque (Admin only)
export async function createPlaque(
  adminUser: UserProfile,
  data: {
    clientId: string;
    slug: string;
    title: string;
    targetType: Plaque['targetType'];
    targetUrl: string;
    qrTargetUrl?: string;
    qrTargetType?: Plaque['targetType'];
  }
): Promise<Plaque> {
  if (adminUser.role !== 'admin') {
    throw new Error('Apenas administradores podem criar novas placas.');
  }

  const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
  const cleanSlug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

  if (allPlaques.some((p) => p.slug.toLowerCase() === cleanSlug)) {
    throw new Error(`O slug "${cleanSlug}" já está em uso por outra placa.`);
  }

  const users = getUsers();
  const owner = users.find((u) => u.id === data.clientId);

  const qrUrl = data.qrTargetUrl?.trim() || data.targetUrl.trim();
  const qrType = data.qrTargetType || data.targetType;

  const newPlaque: Plaque = {
    id: `plaque-${Date.now()}`,
    clientId: data.clientId,
    clientName: owner?.companyName || 'Cliente GoldFlow',
    slug: cleanSlug,
    title: data.title,
    targetType: data.targetType,
    targetUrl: data.targetUrl,
    qrTargetType: qrType,
    qrTargetUrl: qrUrl,
    isActive: true,
    isLocked: false,
    totalNfcScans: 0,
    totalQrScans: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  allPlaques.push(newPlaque);
  saveStored(PLAQUES_STORAGE_KEY, allPlaques);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('plaques').insert({
        client_id: data.clientId,
        slug: cleanSlug,
        title: data.title,
        target_type: data.targetType,
        target_url: data.targetUrl,
        qr_target_type: qrType,
        qr_target_url: qrUrl,
        is_active: true,
        is_locked: false,
      });
    } catch (e) {
      console.warn('Failed to insert new plaque in Supabase', e);
    }
  }

  return newPlaque;
}

// Create new Client Profile (Admin only)
export async function createClientProfile(
  adminUser: UserProfile,
  data: {
    email: string;
    fullName: string;
    companyName: string;
    phone: string;
  }
): Promise<UserProfile> {
  if (adminUser.role !== 'admin') {
    throw new Error('Apenas administradores podem cadastrar clientes.');
  }

  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error(`O e-mail "${data.email}" já está cadastrado.`);
  }

  const newUser: UserProfile = {
    id: `user-${Date.now()}`,
    email: data.email,
    role: 'client',
    fullName: data.fullName,
    companyName: data.companyName,
    phone: data.phone,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveStored(USERS_STORAGE_KEY, users);
  return newUser;
}
