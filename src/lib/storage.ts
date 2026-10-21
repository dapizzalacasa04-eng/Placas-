import { Plaque, ScanEvent, UserProfile, UserRole } from '../types';
import { getSupabaseClient } from './supabase';

const USERS_STORAGE_KEY = 'goldflow_users_v2';
const CURRENT_USER_KEY = 'goldflow_current_user_v2';
const PLAQUES_STORAGE_KEY = 'goldflow_plaques_v2';
const SCANS_STORAGE_KEY = 'goldflow_scans_v2';

// Standard UUID Generator for clean Supabase PostgreSQL compatibility
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Default root administrator (no mock clients or fictitious examples)
export const DEFAULT_ADMIN_USER: UserProfile = {
  id: '00000000-0000-4000-a000-000000000001',
  email: 'admin@goldflow.com.br',
  role: 'admin',
  fullName: 'Administrador GoldFlow',
  companyName: 'GoldFlow NFC',
  phone: '',
  createdAt: '2026-01-01T00:00:00Z',
};

export const INITIAL_USERS: UserProfile[] = [DEFAULT_ADMIN_USER];
export const INITIAL_PLAQUES: Plaque[] = [];

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

const DELETED_USERS_KEY = 'goldflow_deleted_users_v2';

function getDeletedUserIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_USERS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {
    console.error('Error reading deleted users', e);
  }
  return new Set();
}

function markUserAsDeleted(userId: string) {
  const set = getDeletedUserIds();
  set.add(userId);
  saveStored(DELETED_USERS_KEY, Array.from(set));
}

function unmarkUserAsDeleted(userId: string) {
  const set = getDeletedUserIds();
  if (set.has(userId)) {
    set.delete(userId);
    saveStored(DELETED_USERS_KEY, Array.from(set));
  }
}

// User state — purely real users without mock or fictitious accounts
export function getUsers(): UserProfile[] {
  const loaded = getStored<UserProfile[]>(USERS_STORAGE_KEY, INITIAL_USERS);
  const deletedSet = getDeletedUserIds();

  // Filter out any obsolete mock examples and deleted users
  const cleaned = loaded.filter(
    (u) =>
      !deletedSet.has(u.id) &&
      u.id !== 'user-client-1' &&
      u.id !== 'user-client-2' &&
      u.email !== 'contato@bistroroyal.com.br' &&
      u.email !== 'gestao@fitprime.com.br'
  );
  if (cleaned.length !== loaded.length) {
    saveStored(USERS_STORAGE_KEY, cleaned);
  }
  return cleaned.length > 0 ? cleaned : [DEFAULT_ADMIN_USER];
}

// Fetch real people/profiles from Supabase with smart bidirectional merge
export async function fetchUsers(): Promise<UserProfile[]> {
  const localUsers = getUsers();
  const deletedSet = getDeletedUserIds();
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Supabase fetch profiles notice:', error.message || error);
      } else if (data) {
        const mappedRemote: UserProfile[] = data
          .filter((d: any) => !deletedSet.has(d.id))
          .map((d: any) => ({
            id: d.id,
            email: d.email || '',
            role: (d.role as UserRole) || 'client',
            fullName: d.full_name || d.company_name || 'Cliente',
            companyName: d.company_name || d.full_name || 'Empresa',
            phone: d.phone || '',
            createdAt: d.created_at || new Date().toISOString(),
          }));

        // Merge Strategy: Combine remote and local records
        // Remote takes precedence for existing IDs, but newly created local records are PRESERVED!
        const userMap = new Map<string, UserProfile>();

        // 1. Add all valid remote users
        for (const remote of mappedRemote) {
          userMap.set(remote.id, remote);
        }

        // 2. Add local users that may not have synced to Supabase yet
        for (const local of localUsers) {
          if (!deletedSet.has(local.id)) {
            if (!userMap.has(local.id)) {
              userMap.set(local.id, local);
              // Asynchronous auto-sync: Push missing local company to Supabase in background
              supabase
                .from('profiles')
                .upsert({
                  id: local.id,
                  email: local.email,
                  role: local.role,
                  full_name: local.fullName,
                  company_name: local.companyName,
                  phone: local.phone,
                  created_at: local.createdAt,
                })
                .then(({ error: syncErr }) => {
                  if (syncErr) console.warn('Auto-sync profile to Supabase warning:', syncErr);
                });
            }
          }
        }

        const merged = Array.from(userMap.values());
        const hasAdmin = merged.some((u) => u.role === 'admin');
        const finalUsers = hasAdmin ? merged : [DEFAULT_ADMIN_USER, ...merged];

        saveStored(USERS_STORAGE_KEY, finalUsers);
        return finalUsers;
      }
    } catch (e) {
      console.warn('Failed to fetch profiles from Supabase, using local cache', e);
    }
  }

  return localUsers;
}

export function getCurrentUser(): UserProfile {
  const users = getUsers();
  const currentId = localStorage.getItem(CURRENT_USER_KEY);
  const found = users.find((u) => u.id === currentId);
  if (found) return found;

  const fallback = users[0] || DEFAULT_ADMIN_USER;
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
  const users = getUsers();
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let query = supabase.from('plaques').select('*');
      if (currentUser.role !== 'admin') {
        query = query.eq('client_id', currentUser.id);
      }
      const { data, error } = await query;
      if (!error && data) {
        const mappedPlaques: Plaque[] = data.map((d: any) => {
          const owner = users.find((u) => u.id === d.client_id);
          const clientLabel = owner
            ? owner.fullName
              ? `${owner.fullName}${owner.companyName && owner.companyName !== owner.fullName ? ` (${owner.companyName})` : ''}`
              : owner.companyName
            : 'Cliente';

          return {
            id: d.id,
            clientId: d.client_id,
            clientName: clientLabel,
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
          };
        });

        // Cache clean Supabase plaques in localStorage
        if (currentUser.role === 'admin') {
          saveStored(PLAQUES_STORAGE_KEY, mappedPlaques);
        }
        return mappedPlaques;
      }
    } catch (e) {
      console.warn('Supabase query failed, falling back to local storage', e);
    }
  }

  const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
  // Clean mock plaques if any
  const cleaned = allPlaques.filter(
    (p) =>
      p.id !== 'plaque-1' &&
      p.id !== 'plaque-2' &&
      p.id !== 'plaque-3' &&
      p.slug !== 'bistro-royal-balcao' &&
      p.slug !== 'bistro-royal-cardapio' &&
      p.slug !== 'fitprime-checkin'
  );
  if (cleaned.length !== allPlaques.length) {
    saveStored(PLAQUES_STORAGE_KEY, cleaned);
  }

  // Populate clientName and ensure qrTargetUrl is set
  const enriched = cleaned.map((p) => {
    const owner = users.find((u) => u.id === p.clientId);
    return {
      ...p,
      qrTargetUrl: p.qrTargetUrl || p.targetUrl,
      qrTargetType: p.qrTargetType || p.targetType,
      clientName: owner
        ? owner.fullName
          ? `${owner.fullName}${owner.companyName && owner.companyName !== owner.fullName ? ` (${owner.companyName})` : ''}`
          : owner.companyName
        : p.clientName || 'Cliente',
    };
  });

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

export async function fetchPlaqueBySlug(slug: string): Promise<Plaque | undefined> {
  const normalized = slug.trim().toLowerCase();
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('plaques')
        .select('*')
        .eq('slug', normalized)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          clientId: data.client_id,
          slug: data.slug,
          title: data.title,
          targetType: data.target_type,
          targetUrl: data.target_url,
          qrTargetType: data.qr_target_type || data.target_type,
          qrTargetUrl: data.qr_target_url || data.target_url,
          isActive: data.is_active,
          isLocked: data.is_locked,
          lockReason: data.lock_reason,
          totalNfcScans: data.total_nfc_scans || 0,
          totalQrScans: data.total_qr_scans || 0,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Supabase fetchPlaqueBySlug error, falling back to local storage', e);
    }
  }
  return getPlaqueBySlug(slug);
}

export async function updatePlaqueDestination(
  user: UserProfile,
  plaqueId: string,
  targetType: Plaque['targetType'],
  targetUrl: string,
  targetParams?: Plaque['targetParams'],
  applyScope: 'both' | 'nfc' | 'qr' = 'both'
): Promise<Plaque> {
  const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
  const index = allPlaques.findIndex((p) => p.id === plaqueId);
  if (index === -1) throw new Error('Placa não encontrada');

  const plaque = allPlaques[index];

  if (user.role !== 'admin' && plaque.clientId !== user.id) {
    throw new Error('Acesso negado: Você não tem permissão para alterar esta placa.');
  }

  if (plaque.isLocked && user.role !== 'admin') {
    throw new Error('Esta placa está bloqueada pela administração e não pode ter o destino alterado.');
  }

  const cleanUrl = targetUrl.trim();
  const nextTargetUrl = applyScope === 'qr' ? plaque.targetUrl : cleanUrl;
  const nextTargetType = applyScope === 'qr' ? plaque.targetType : targetType;
  const nextQrUrl = applyScope === 'nfc' ? (plaque.qrTargetUrl || plaque.targetUrl) : cleanUrl;
  const nextQrType = applyScope === 'nfc' ? (plaque.qrTargetType || plaque.targetType) : targetType;

  const updated: Plaque = {
    ...plaque,
    targetType: nextTargetType,
    targetUrl: nextTargetUrl,
    qrTargetType: nextQrType,
    qrTargetUrl: nextQrUrl,
    targetParams: targetParams || plaque.targetParams,
    updatedAt: new Date().toISOString(),
  };

  allPlaques[index] = updated;
  saveStored(PLAQUES_STORAGE_KEY, allPlaques);

  // Sync with Supabase if connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const updateData: Record<string, any> = {
        updated_at: updated.updatedAt,
      };

      if (applyScope === 'both' || applyScope === 'nfc') {
        updateData.target_type = nextTargetType;
        updateData.target_url = nextTargetUrl;
      }
      if (applyScope === 'both' || applyScope === 'qr') {
        updateData.qr_target_type = nextQrType;
        updateData.qr_target_url = nextQrUrl;
      }

      await supabase
        .from('plaques')
        .update(updateData)
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
  saveStored(SCANS_STORAGE_KEY, scans.slice(0, 100));

  // Sync scan count to Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('plaques')
        .update({
          total_nfc_scans: plaque.totalNfcScans,
          total_qr_scans: plaque.totalQrScans,
          updated_at: plaque.updatedAt,
        })
        .eq('slug', slug);

      await supabase.from('scans').insert({
        plaque_id: plaque.id,
        source,
        device_type: deviceType,
        user_agent: ua,
      });
    } catch (e) {
      console.warn('Failed to sync scan event to Supabase', e);
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
  const newPlaqueId = generateUuid();

  const newPlaque: Plaque = {
    id: newPlaqueId,
    clientId: data.clientId,
    clientName: owner
      ? owner.fullName
        ? `${owner.fullName}${owner.companyName && owner.companyName !== owner.fullName ? ` (${owner.companyName})` : ''}`
        : owner.companyName
      : 'Cliente',
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
        id: newPlaqueId,
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

// Create new Client / Company Profile (Admin only, saved to Supabase & localStorage)
export async function createClientProfile(
  adminUser: UserProfile,
  data: {
    email?: string;
    fullName?: string;
    companyName?: string;
    phone?: string;
  }
): Promise<UserProfile> {
  if (adminUser.role !== 'admin') {
    throw new Error('Apenas administradores podem cadastrar empresas e clientes.');
  }

  const rawCompany = (data.companyName || '').trim();
  const rawFullName = (data.fullName || '').trim();

  const cleanCompany = rawCompany || rawFullName;
  const cleanFullName = rawFullName || rawCompany;
  const cleanPhone = (data.phone || '').trim();

  if (!cleanCompany && !cleanFullName) {
    throw new Error('O nome da empresa ou do responsável é obrigatório.');
  }

  const cleanSlug = cleanCompany
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  const cleanEmail = (data.email || '').trim() || `contato@${cleanSlug || 'empresa'}.com.br`;

  const users = getUsers();
  // Check if an existing profile with this email exists; if so, update or use existing ID
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail.toLowerCase());
  const targetId = existing ? existing.id : generateUuid();

  unmarkUserAsDeleted(targetId);

  const newUser: UserProfile = {
    id: targetId,
    email: cleanEmail,
    role: 'client',
    fullName: cleanFullName,
    companyName: cleanCompany,
    phone: cleanPhone,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  const updatedUsers = users.filter((u) => u.id !== targetId);
  updatedUsers.push(newUser);
  saveStored(USERS_STORAGE_KEY, updatedUsers);

  // Sync to Supabase table `profiles`
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('profiles').upsert(
        {
          id: targetId,
          email: newUser.email,
          role: 'client',
          full_name: cleanFullName,
          company_name: cleanCompany,
          phone: cleanPhone,
          created_at: newUser.createdAt,
        },
        { onConflict: 'id' }
      );
      if (error) {
        console.warn('Supabase profile upsert notice:', error.message || error);
      }
    } catch (e) {
      console.warn('Failed to sync profile to Supabase', e);
    }
  }

  return newUser;
}

// Delete Client Profile (Admin only)
export async function deleteClientProfile(
  adminUser: UserProfile,
  clientId: string
): Promise<void> {
  if (adminUser.role !== 'admin') {
    throw new Error('Apenas administradores podem excluir clientes.');
  }

  markUserAsDeleted(clientId);

  let users = getUsers();
  users = users.filter((u) => u.id !== clientId);
  saveStored(USERS_STORAGE_KEY, users);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('profiles').delete().eq('id', clientId);
    } catch (e) {
      console.warn('Failed to delete profile from Supabase', e);
    }
  }
}
