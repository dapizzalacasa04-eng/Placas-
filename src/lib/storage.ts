import { Plaque, ScanEvent, UserProfile, UserRole } from '../types';
import { getSupabaseClient, ensureSupabaseConfigLoaded } from './supabase';

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

const DELETED_PLAQUES_KEY = 'goldflow_deleted_plaques_v2';

function getDeletedPlaqueIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_PLAQUES_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {
    console.error('Error reading deleted plaques', e);
  }
  return new Set();
}

export function markPlaqueAsDeleted(plaqueId: string) {
  const set = getDeletedPlaqueIds();
  set.add(plaqueId);
  saveStored(DELETED_PLAQUES_KEY, Array.from(set));
}

export function unmarkPlaqueAsDeleted(plaqueId: string) {
  const set = getDeletedPlaqueIds();
  if (set.has(plaqueId)) {
    set.delete(plaqueId);
    saveStored(DELETED_PLAQUES_KEY, Array.from(set));
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

// Plaques — Fully synced with Supabase, bidirectional merge & local tombstone tracking
export async function getPlaques(currentUser: UserProfile): Promise<Plaque[]> {
  const users = getUsers();
  const deletedIds = getDeletedPlaqueIds();

  // Load and clean local plaques
  const rawLocal = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
  const localPlaques = rawLocal.filter(
    (p) =>
      !deletedIds.has(p.id) &&
      p.id !== 'plaque-1' &&
      p.id !== 'plaque-2' &&
      p.id !== 'plaque-3' &&
      p.slug !== 'bistro-royal-balcao' &&
      p.slug !== 'bistro-royal-cardapio' &&
      p.slug !== 'fitprime-checkin'
  );

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // Query plaques from Supabase
      let query = supabase.from('plaques').select('*');
      if (currentUser.role !== 'admin') {
        query = query.eq('client_id', currentUser.id);
      }
      const { data, error } = await query;
      if (!error && data) {
        const remoteMap = new Map<string, Plaque>();
        for (const d of data) {
          if (deletedIds.has(d.id)) continue;
          const owner = users.find((u) => u.id === d.client_id);
          const clientLabel = owner
            ? owner.fullName
              ? `${owner.fullName}${owner.companyName && owner.companyName !== owner.fullName ? ` (${owner.companyName})` : ''}`
              : owner.companyName
            : 'Cliente';

          const mapped: Plaque = {
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
          remoteMap.set(mapped.id, mapped);
        }

        // Bidirectional merge:
        // Start with non-deleted local plaques
        const mergedMap = new Map<string, Plaque>();
        for (const lp of localPlaques) {
          if (!deletedIds.has(lp.id)) {
            mergedMap.set(lp.id, lp);
          }
        }

        // Overlay with remote plaques (authoritative from Supabase)
        for (const [id, rp] of remoteMap.entries()) {
          mergedMap.set(id, rp);
        }

        // Auto-sync any local plaque that wasn't in Supabase yet
        for (const lp of localPlaques) {
          if (!remoteMap.has(lp.id) && !deletedIds.has(lp.id)) {
            if (currentUser.role === 'admin' || lp.clientId === currentUser.id) {
              supabase
                .from('plaques')
                .upsert(
                  {
                    id: lp.id,
                    client_id: lp.clientId,
                    slug: lp.slug,
                    title: lp.title,
                    target_type: lp.targetType,
                    target_url: lp.targetUrl,
                    qr_target_type: lp.qrTargetType || lp.targetType,
                    qr_target_url: lp.qrTargetUrl || lp.targetUrl,
                    is_active: lp.isActive,
                    is_locked: lp.isLocked,
                    lock_reason: lp.lockReason,
                    total_nfc_scans: lp.totalNfcScans || 0,
                    total_qr_scans: lp.totalQrScans || 0,
                    created_at: lp.createdAt,
                    updated_at: lp.updatedAt,
                  },
                  { onConflict: 'id' }
                )
                .then(({ error: syncErr }) => {
                  if (syncErr) console.warn('Auto-sync plaque to Supabase warning:', syncErr);
                });
            }
          }
        }

        const mergedAll = Array.from(mergedMap.values());
        saveStored(PLAQUES_STORAGE_KEY, mergedAll);

        const enriched = mergedAll.map((p) => {
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
    } catch (e) {
      console.warn('Supabase query failed, falling back to local storage', e);
    }
  }

  // Local storage fallback with client enrichment
  const enriched = localPlaques.map((p) => {
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
  if (!slug) return undefined;
  const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
  const clean = decodeURIComponent(slug).trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  const cleanCompact = clean.replace(/[\s_-]+/g, '');

  return allPlaques.find((p) => {
    const s = (p.slug || '').trim().toLowerCase();
    const sCompact = s.replace(/[\s_-]+/g, '');
    return s === clean || sCompact === cleanCompact || p.id.toLowerCase() === clean;
  });
}

export async function fetchPlaqueBySlug(slug: string): Promise<Plaque | undefined> {
  if (!slug) return undefined;
  const cleanSlug = decodeURIComponent(slug).trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!cleanSlug) return undefined;

  // Asynchronously resolve Supabase configuration (localStorage, Vite env, or /goldflow-config.json)
  await ensureSupabaseConfigLoaded();

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // 1. Direct query by slug (case-insensitive)
      const { data, error } = await supabase
        .from('plaques')
        .select('*')
        .ilike('slug', cleanSlug)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Supabase fetchPlaqueBySlug notice:', error.message || error);
      }

      let row = Array.isArray(data) && data.length > 0 ? data[0] : (data && !Array.isArray(data) ? data : null);

      // 2. Alternate slug formats (hyphen vs underscore, or accent-stripped)
      if (!row) {
        const normalizedSlug = cleanSlug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const altSlug = cleanSlug.includes('-') ? cleanSlug.replace(/-/g, '_') : cleanSlug.replace(/_/g, '-');
        
        const { data: altData } = await supabase
          .from('plaques')
          .select('*')
          .or(`slug.ilike.${cleanSlug},slug.ilike.${altSlug},slug.ilike.${normalizedSlug}`)
          .limit(1);

        if (Array.isArray(altData) && altData.length > 0) {
          row = altData[0];
        }
      }

      // 3. Match by UUID ID if scanned with UUID
      if (!row && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug)) {
        const { data: idData } = await supabase
          .from('plaques')
          .select('*')
          .eq('id', cleanSlug)
          .limit(1);
        if (Array.isArray(idData) && idData.length > 0) {
          row = idData[0];
        }
      }

      if (row) {
        const foundPlaque: Plaque = {
          id: row.id,
          clientId: row.client_id,
          slug: row.slug,
          title: row.title || `Placa /${row.slug}`,
          targetType: row.target_type || 'custom',
          targetUrl: row.target_url || row.qr_target_url || 'https://google.com',
          qrTargetType: row.qr_target_type || row.target_type || 'custom',
          qrTargetUrl: row.qr_target_url || row.target_url || 'https://google.com',
          isActive: row.is_active !== false,
          isLocked: Boolean(row.is_locked),
          lockReason: row.lock_reason,
          totalNfcScans: row.total_nfc_scans || 0,
          totalQrScans: row.total_qr_scans || 0,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };

        // Cache in local storage for instant future redirections
        try {
          const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
          const idx = allPlaques.findIndex((item) => item.id === foundPlaque.id || item.slug.toLowerCase() === cleanSlug);
          if (idx >= 0) {
            allPlaques[idx] = { ...allPlaques[idx], ...foundPlaque };
          } else {
            allPlaques.push(foundPlaque);
          }
          saveStored(PLAQUES_STORAGE_KEY, allPlaques);
        } catch (cacheErr) {
          console.warn('Failed to cache plaque locally', cacheErr);
        }

        return foundPlaque;
      }
    } catch (e) {
      console.warn('Supabase fetchPlaqueBySlug error, falling back to local storage', e);
    }
  }

  // Fallback to local storage
  return getPlaqueBySlug(cleanSlug);
}

export async function updatePlaque(
  user: UserProfile,
  plaqueId: string,
  data: {
    title?: string;
    targetType?: Plaque['targetType'];
    targetUrl?: string;
    qrTargetType?: Plaque['targetType'];
    qrTargetUrl?: string;
    targetParams?: Plaque['targetParams'];
    isActive?: boolean;
    isLocked?: boolean;
    lockReason?: string;
    applyScope?: 'both' | 'nfc' | 'qr';
  }
): Promise<Plaque> {
  const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
  const index = allPlaques.findIndex((p) => p.id === plaqueId);
  if (index === -1) throw new Error('Placa não encontrada');

  const plaque = allPlaques[index];

  if (user.role !== 'admin' && plaque.clientId !== user.id) {
    throw new Error('Acesso negado: Você não tem permissão para alterar esta placa.');
  }

  // If plaque was administratively locked, client cannot modify targets
  if (plaque.isLocked && user.role !== 'admin' && data.isLocked === undefined) {
    throw new Error('Esta placa está suspensa administrativamente e não pode ter o destino alterado.');
  }

  const applyScope = data.applyScope || 'both';
  const cleanUrl = data.targetUrl !== undefined ? data.targetUrl.trim() : plaque.targetUrl;
  const cleanQrUrl = data.qrTargetUrl !== undefined ? data.qrTargetUrl.trim() : (plaque.qrTargetUrl || plaque.targetUrl);

  const nextTargetUrl = applyScope === 'qr' ? plaque.targetUrl : cleanUrl;
  const nextTargetType = applyScope === 'qr' ? plaque.targetType : (data.targetType || plaque.targetType);
  const nextQrUrl = applyScope === 'nfc' 
    ? (plaque.qrTargetUrl || plaque.targetUrl) 
    : (data.qrTargetUrl !== undefined ? cleanQrUrl : (applyScope === 'both' ? cleanUrl : (plaque.qrTargetUrl || plaque.targetUrl)));
  const nextQrType = applyScope === 'nfc' 
    ? (plaque.qrTargetType || plaque.targetType) 
    : (data.qrTargetType || (applyScope === 'both' ? (data.targetType || plaque.targetType) : (plaque.qrTargetType || plaque.targetType)));

  const updated: Plaque = {
    ...plaque,
    title: data.title !== undefined && data.title.trim() ? data.title.trim() : plaque.title,
    targetType: nextTargetType,
    targetUrl: nextTargetUrl,
    qrTargetType: nextQrType,
    qrTargetUrl: nextQrUrl,
    targetParams: data.targetParams !== undefined ? data.targetParams : plaque.targetParams,
    isActive: data.isActive !== undefined ? data.isActive : plaque.isActive,
    isLocked: data.isLocked !== undefined ? data.isLocked : plaque.isLocked,
    lockReason: data.lockReason !== undefined ? data.lockReason : plaque.lockReason,
    updatedAt: new Date().toISOString(),
  };

  allPlaques[index] = updated;
  saveStored(PLAQUES_STORAGE_KEY, allPlaques);

  // Sync with Supabase if connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const updatePayload: Record<string, any> = {
        title: updated.title,
        target_type: updated.targetType,
        target_url: updated.targetUrl,
        qr_target_type: updated.qrTargetType,
        qr_target_url: updated.qrTargetUrl,
        is_active: updated.isActive,
        is_locked: updated.isLocked,
        lock_reason: updated.lockReason || null,
        updated_at: updated.updatedAt,
      };

      const { error } = await supabase
        .from('plaques')
        .update(updatePayload)
        .eq('id', plaqueId);

      if (error) {
        console.warn('Supabase plaque update warning:', error.message || error);
      }
    } catch (e) {
      console.warn('Failed to sync plaque update to Supabase', e);
    }
  }

  return updated;
}

export async function updatePlaqueDestination(
  user: UserProfile,
  plaqueId: string,
  targetType: Plaque['targetType'],
  targetUrl: string,
  targetParams?: Plaque['targetParams'],
  applyScope: 'both' | 'nfc' | 'qr' = 'both',
  newTitle?: string
): Promise<Plaque> {
  return updatePlaque(user, plaqueId, {
    title: newTitle,
    targetType,
    targetUrl,
    targetParams,
    applyScope,
  });
}

export async function updatePlaqueQrDestination(
  user: UserProfile,
  plaqueId: string,
  qrTargetUrl: string,
  qrTargetType: Plaque['targetType'] = 'custom'
): Promise<Plaque> {
  return updatePlaque(user, plaqueId, {
    qrTargetUrl,
    qrTargetType,
    applyScope: 'qr',
  });
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
    if (plaque.clientId !== user.id) {
      throw new Error('Acesso negado: Você só pode bloquear ou reativar suas próprias placas.');
    }
    // Prevent client from overriding hard admin lock
    if (plaque.isLocked && plaque.lockReason && plaque.lockReason.toLowerCase().includes('administrativ')) {
      throw new Error('Esta placa foi suspensa administrativamente pela GoldFlow NFC. Solicite a reativação à administração.');
    }
  }

  const effectiveReason = lockState
    ? (reason || (user.role === 'admin' ? 'Bloqueio administrativo temporário.' : 'Suspensão temporária pelo cliente.'))
    : undefined;

  return updatePlaque(user, plaqueId, {
    isLocked: lockState,
    lockReason: effectiveReason,
  });
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

// Create new Plaque (Admin or Client for own company)
export async function createPlaque(
  user: UserProfile,
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
  if (user.role !== 'admin' && data.clientId !== user.id) {
    throw new Error('Acesso negado: Você só pode cadastrar placas vinculadas à sua própria empresa.');
  }

  const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
  const cleanSlug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

  if (!cleanSlug) {
    throw new Error('O identificador (slug) da placa é obrigatório.');
  }

  if (allPlaques.some((p) => p.slug.toLowerCase() === cleanSlug)) {
    throw new Error(`O identificador /${cleanSlug} já está em uso por outra placa.`);
  }

  const users = getUsers();
  const owner = users.find((u) => u.id === data.clientId);

  const qrUrl = data.qrTargetUrl?.trim() || data.targetUrl.trim();
  const qrType = data.qrTargetType || data.targetType;
  const newPlaqueId = generateUuid();

  unmarkPlaqueAsDeleted(newPlaqueId);

  const newPlaque: Plaque = {
    id: newPlaqueId,
    clientId: data.clientId,
    clientName: owner
      ? owner.fullName
        ? `${owner.fullName}${owner.companyName && owner.companyName !== owner.fullName ? ` (${owner.companyName})` : ''}`
        : owner.companyName
      : 'Cliente',
    slug: cleanSlug,
    title: data.title.trim() || `Placa /${cleanSlug}`,
    targetType: data.targetType,
    targetUrl: data.targetUrl.trim(),
    qrTargetType: qrType,
    qrTargetUrl: qrUrl,
    isActive: true,
    isLocked: false,
    totalNfcScans: 0,
    totalQrScans: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedPlaques = allPlaques.filter((p) => p.id !== newPlaqueId);
  updatedPlaques.push(newPlaque);
  saveStored(PLAQUES_STORAGE_KEY, updatedPlaques);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('plaques').upsert(
        {
          id: newPlaqueId,
          client_id: data.clientId,
          slug: cleanSlug,
          title: newPlaque.title,
          target_type: data.targetType,
          target_url: newPlaque.targetUrl,
          qr_target_type: qrType,
          qr_target_url: qrUrl,
          is_active: true,
          is_locked: false,
          total_nfc_scans: 0,
          total_qr_scans: 0,
          created_at: newPlaque.createdAt,
          updated_at: newPlaque.updatedAt,
        },
        { onConflict: 'id' }
      );
      if (error) {
        console.warn('Supabase plaque upsert warning:', error.message || error);
      }
    } catch (e) {
      console.warn('Failed to insert new plaque in Supabase', e);
    }
  }

  return newPlaque;
}

// Delete Plaque (Admin or Client for own plaque)
export async function deletePlaque(
  user: UserProfile,
  plaqueId: string
): Promise<void> {
  const allPlaques = getStored<Plaque[]>(PLAQUES_STORAGE_KEY, INITIAL_PLAQUES);
  const plaque = allPlaques.find((p) => p.id === plaqueId);
  if (!plaque) return;

  if (user.role !== 'admin' && plaque.clientId !== user.id) {
    throw new Error('Acesso negado: Você só pode excluir suas próprias placas.');
  }

  markPlaqueAsDeleted(plaqueId);

  const remaining = allPlaques.filter((p) => p.id !== plaqueId);
  saveStored(PLAQUES_STORAGE_KEY, remaining);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('plaques').delete().eq('id', plaqueId);
      if (error) {
        console.warn('Supabase delete plaque warning:', error.message || error);
      }
    } catch (e) {
      console.warn('Failed to delete plaque in Supabase', e);
    }
  }
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
