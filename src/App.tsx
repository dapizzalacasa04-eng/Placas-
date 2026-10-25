import React, { useState, useEffect, useCallback } from 'react';
import { 
  Radio, 
  Layers, 
  Plus, 
  Search, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  ExternalLink,
  Lock,
  Smartphone,
  QrCode,
  Download,
  Image as ImageIcon,
  FileCode,
  Save,
  Link2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Edit3
} from 'lucide-react';
import { downloadQRCodePNG, downloadQRCodeSVG } from './lib/qrCodeHelper';
import { Plaque, ScanEvent, UserProfile, TargetType, ScanSource, Product, AppSettings } from './types';
import { 
  getCurrentUser, 
  getUsers, 
  fetchUsers,
  setCurrentUser, 
  getPlaques, 
  updatePlaqueDestination, 
  updatePlaqueQrDestination,
  togglePlaqueLock, 
  getRecentScans,
  createPlaque,
  deletePlaque,
  createClientProfile,
  deleteClientProfile,
  recordPlaqueScan
} from './lib/storage';
import { getStoredSupabaseConfig } from './lib/supabase';
import { 
  fetchProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  fetchAppSettings, 
  saveAppSettings,
  INITIAL_PRODUCTS,
  DEFAULT_APP_SETTINGS
} from './lib/productsStorage';
import { 
  getInitialAuthState, 
  subscribeToAuthChanges, 
  signOutOwner, 
  AuthState 
} from './lib/auth';
import { Navbar } from './components/Navbar';
import { BottomTabBar, TabType } from './components/BottomTabBar';
import { PlaqueCard } from './components/PlaqueCard';
import { PlaqueEditorModal } from './components/PlaqueEditorModal';
import { QRCodeStudioModal } from './components/QRCodeStudioModal';
import { QrDestinationModal } from './components/QrDestinationModal';
import { NfcSimulatorModal } from './components/NfcSimulatorModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { AnalyticsView } from './components/AnalyticsView';
import { AdminClientsView } from './components/AdminClientsView';
import { PublicRedirectView } from './components/PublicRedirectView';
import { GuideStepByStepView } from './components/GuideStepByStepView';
import { CreatePlaqueModal } from './components/CreatePlaqueModal';
import { AdminAuthView } from './components/AdminAuthView';
import { PublicCatalogView } from './components/PublicCatalogView';
import { ProductsManagerView } from './components/ProductsManagerView';

export type AppRoute = 
  | { type: 'redirect'; slug: string; source: ScanSource }
  | { type: 'admin' }
  | { type: 'public' };

function parseCurrentRoute(): AppRoute {
  try {
    const rawPath = window.location.pathname;
    const hash = window.location.hash || '';
    const params = new URLSearchParams(window.location.search);
    const srcParam = (params.get('src') || 'nfc') as ScanSource;

    // 1. Direct query parameters ?q=slug or ?qr=slug
    const queryQr = params.get('q') || params.get('qr');
    if (queryQr) {
      const clean = decodeURIComponent(queryQr).trim().replace(/^\/+|\/+$/g, '');
      if (clean) return { type: 'redirect', slug: clean, source: 'qr' };
    }

    // 2. Direct query parameter ?r=slug
    const querySlug = params.get('r');
    if (querySlug) {
      const clean = decodeURIComponent(querySlug).trim().replace(/^\/+|\/+$/g, '');
      if (clean) return { type: 'redirect', slug: clean, source: srcParam };
    }

    // 3. Handle path passed via fallback query param e.g. ?p=/q/minha-placa (from 404.html on Netlify)
    const pParam = params.get('p');
    let effectivePath = pParam ? decodeURIComponent(pParam) : rawPath;

    if (effectivePath.startsWith('http://') || effectivePath.startsWith('https://')) {
      try {
        effectivePath = new URL(effectivePath).pathname;
      } catch {
        // Fallback
      }
    }

    // Normalize path (strip trailing slashes)
    const normalized = effectivePath.trim().replace(/\/+$/, '');

    // 4. Undisclosed Admin Route (No visible button on public site for visitors)
    // Routes: /gestao-privada-goldflow, /painel-restrito, /admin-restrito, #/gestao-privada-goldflow
    // Or query parameters: ?admin=gestao-privada-goldflow, ?admin=1, ?painel=1
    const isAdminRoute = 
      /^\/?(?:gestao-privada-goldflow|painel-restrito|admin-restrito|admin-privado)(?:\/|$)/i.test(normalized) ||
      /^#\/?(?:gestao-privada-goldflow|painel-restrito|admin-restrito|admin-privado)(?:\/|$)/i.test(hash) ||
      params.get('admin') === 'gestao-privada-goldflow' ||
      params.get('admin') === '1' ||
      params.get('painel') === '1';

    if (isAdminRoute) {
      return { type: 'admin' };
    }

    // 5. Handle QR routes /q/:slug or /qr/:slug or #/q/:slug
    const qrMatch = normalized.match(/^\/?(?:q|qr)\/([^\/?#]+)/i) ||
                    hash.match(/^#\/?(?:q|qr)\/([^\/?#]+)/i);
    if (qrMatch && qrMatch[1]) {
      const clean = decodeURIComponent(qrMatch[1]).trim().replace(/^\/+|\/+$/g, '');
      if (clean) return { type: 'redirect', slug: clean, source: 'qr' };
    }

    // 6. Handle NFC / general short links /r/:slug or #/r/:slug
    const rMatch = normalized.match(/^\/?r\/([^\/?#]+)/i) ||
                   hash.match(/^#\/?r\/([^\/?#]+)/i);
    if (rMatch && rMatch[1]) {
      const clean = decodeURIComponent(rMatch[1]).trim().replace(/^\/+|\/+$/g, '');
      if (clean) return { type: 'redirect', slug: clean, source: srcParam };
    }
  } catch (e) {
    console.warn('Public route parsing error:', e);
  }

  // Default: Public visitor view (catalog of products, prices, specifications)
  return { type: 'public' };
}

export default function App() {
  // Current active route: public catalog, secret admin panel, or direct QR/NFC redirection
  const [route, setRoute] = useState<AppRoute>(() => parseCurrentRoute());

  // Supabase Auth state for owner
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Public products & settings state
  const [products, setProductsList] = useState<Product[]>(INITIAL_PRODUCTS);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

  // Keep routing synced if user navigates history
  useEffect(() => {
    const handleUrlChange = () => {
      setRoute(parseCurrentRoute());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Initial Auth & Products loading
  useEffect(() => {
    getInitialAuthState().then((st) => setAuthState(st));
    fetchProducts().then((prods) => setProductsList(prods));
    fetchAppSettings().then((cfg) => setSettings(cfg));

    const unsubscribe = subscribeToAuthChanges((_event, session) => {
      setAuthState({
        isAuthenticated: Boolean(session?.user),
        user: session?.user || null,
        session: session || null,
        loading: false,
        error: null,
      });
    });

    return () => unsubscribe();
  }, []);

  // State
  const [users, setUsersList] = useState<UserProfile[]>([]);
  const [currentUser, setUser] = useState<UserProfile>(() => getCurrentUser());
  const [plaques, setPlaquesList] = useState<Plaque[]>([]);
  const [scans, setScansList] = useState<ScanEvent[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('plaques');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(
    () => getStoredSupabaseConfig().isConnected
  );

  // Modals
  const [isCreatePlaqueOpen, setIsCreatePlaqueOpen] = useState(false);
  const [editingPlaque, setEditingPlaque] = useState<Plaque | null>(null);
  const [qrDestinationPlaque, setQrDestinationPlaque] = useState<Plaque | null>(null);
  const [qrStudioPlaque, setQrStudioPlaque] = useState<Plaque | null>(null);
  const [isNfcSimulatorOpen, setIsNfcSimulatorOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Quick Standalone QR Generator State in QR Tab
  const [quickQrUrl, setQuickQrUrl] = useState('https://google.com');
  const [quickQrPlaqueId, setQuickQrPlaqueId] = useState('');
  const [quickDownloadingPng, setQuickDownloadingPng] = useState(false);
  const [quickDownloadingSvg, setQuickDownloadingSvg] = useState(false);

  // Refresh data
  const refreshData = useCallback(async (user: UserProfile) => {
    const loadedUsers = await fetchUsers();
    setUsersList(loadedUsers);

    const loadedPlaques = await getPlaques(user);
    setPlaquesList(loadedPlaques);

    const loadedScans = getRecentScans(user);
    setScansList(loadedScans);
  }, []);

  useEffect(() => {
    refreshData(currentUser);
  }, [currentUser, refreshData]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const navigateToPublic = () => {
    try {
      window.history.pushState({}, '', '/');
    } catch {}
    setRoute({ type: 'public' });
  };

  const navigateToAdmin = () => {
    try {
      window.history.pushState({}, '', '/gestao-privada-goldflow');
    } catch {}
    setRoute({ type: 'admin' });
  };

  // Switch active profile (Admin <-> Client)
  const handleSwitchUser = (userId: string) => {
    const nextUser = setCurrentUser(userId);
    setUser(nextUser);
    showToast(`Perfil alterado para: ${nextUser.fullName} (${nextUser.companyName})`, 'info');
  };

  // Edit destination & plaque metadata
  const handleSaveDestination = async (
    plaqueId: string,
    targetType: TargetType,
    targetUrl: string,
    targetParams?: Plaque['targetParams'],
    applyScope: 'both' | 'nfc' | 'qr' = 'both',
    newTitle?: string
  ) => {
    await updatePlaqueDestination(currentUser, plaqueId, targetType, targetUrl, targetParams, applyScope, newTitle);
    await refreshData(currentUser);
    showToast(
      applyScope === 'both'
        ? 'Destino e dados da placa atualizados no Supabase!'
        : applyScope === 'qr'
        ? 'Destino do QR Code permanente atualizado no Supabase!'
        : 'Destino do chip NFC atualizado no Supabase!',
      'success'
    );
  };

  // Delete plaque
  const handleDeletePlaque = async (plaqueId: string) => {
    try {
      await deletePlaque(currentUser, plaqueId);
      await refreshData(currentUser);
      showToast('Placa excluída com sucesso.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
    }
  };

  // Edit independent permanent QR Code destination
  const handleSaveQrLink = async (plaqueId: string, newQrUrl: string, qrTargetType: TargetType = 'custom') => {
    await updatePlaqueQrDestination(currentUser, plaqueId, newQrUrl, qrTargetType);
    await refreshData(currentUser);
    showToast('Destino do QR Code permanente atualizado no Supabase com sucesso!', 'success');
  };

  const handleDownloadQuickPng = async () => {
    if (!quickQrUrl.trim()) {
      showToast('Por favor, informe um link válido.', 'error');
      return;
    }
    setQuickDownloadingPng(true);
    try {
      await downloadQRCodePNG(quickQrUrl.trim(), 'goldflow-qr-code-1024px', {
        width: 1024,
        errorCorrectionLevel: 'H',
      });
      showToast('QR Code PNG (1024px) baixado com sucesso!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Erro ao baixar PNG.', 'error');
    } finally {
      setQuickDownloadingPng(false);
    }
  };

  const handleDownloadQuickSvg = async () => {
    if (!quickQrUrl.trim()) {
      showToast('Por favor, informe um link válido.', 'error');
      return;
    }
    setQuickDownloadingSvg(true);
    try {
      await downloadQRCodeSVG(quickQrUrl.trim(), 'goldflow-qr-code-vector', {
        errorCorrectionLevel: 'H',
      });
      showToast('QR Code SVG vetorial baixado com sucesso!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Erro ao exportar SVG.', 'error');
    } finally {
      setQuickDownloadingSvg(false);
    }
  };

  const handleSaveQuickToPlaque = async () => {
    if (!quickQrPlaqueId) {
      showToast('Selecione uma placa para vincular este link de QR Code.', 'error');
      return;
    }
    if (!quickQrUrl.trim()) {
      showToast('Por favor, informe um link válido.', 'error');
      return;
    }
    await handleSaveQrLink(quickQrPlaqueId, quickQrUrl.trim(), 'custom');
  };

  // Toggle Remote Lock
  const handleToggleLock = async (plaque: Plaque) => {
    try {
      const nextLockState = !plaque.isLocked;
      await togglePlaqueLock(
        currentUser,
        plaque.id,
        nextLockState,
        nextLockState ? 'Bloqueio administrativo temporário.' : undefined
      );
      await refreshData(currentUser);
      showToast(
        nextLockState
          ? `Placa /r/${plaque.slug} bloqueada remotamente.`
          : `Placa /r/${plaque.slug} desbloqueada e reativada.`,
        nextLockState ? 'error' : 'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
    }
  };

  // Execute scan from simulator
  const handleExecuteScanFromSimulator = async (slug: string, source: 'nfc' | 'qr') => {
    setIsNfcSimulatorOpen(false);
    setRoute({ type: 'redirect', slug, source });
  };

  // Test exclusive QR Code route
  const handleTestQrRoute = (plaque: Plaque) => {
    const url = `/q/${plaque.slug}`;
    try {
      const win = window.open(url, '_blank');
      if (!win) {
        setRoute({ type: 'redirect', slug: plaque.slug, source: 'qr' });
      }
    } catch {
      setRoute({ type: 'redirect', slug: plaque.slug, source: 'qr' });
    }
  };

  // Create Client (Saved to Supabase & localStorage)
  const handleCreateClient = async (data: {
    email?: string;
    fullName?: string;
    companyName?: string;
    phone?: string;
  }) => {
    await createClientProfile(currentUser, data);
    await refreshData(currentUser);
    const label = data.companyName || data.fullName || 'Empresa';
    showToast(`Empresa "${label}" cadastrada e salva no Supabase com sucesso!`, 'success');
  };

  // Delete Client
  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteClientProfile(currentUser, clientId);
      await refreshData(currentUser);
      showToast('Cliente excluído com sucesso.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
    }
  };

  // Create Plaque
  const handleCreatePlaque = async (data: {
    clientId: string;
    slug: string;
    title: string;
    targetType: Plaque['targetType'];
    targetUrl: string;
  }) => {
    await createPlaque(currentUser, data);
    await refreshData(currentUser);
    showToast(`Placa /r/${data.slug} criada com sucesso!`, 'success');
  };

  // Product management handlers (Owner only, protected by Supabase Auth and RLS)
  const handleCreateProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createProduct(data);
      const updated = await fetchProducts();
      setProductsList(updated);
      showToast('Produto cadastrado e protegido no Supabase!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleUpdateProduct = async (id: string, patch: Partial<Omit<Product, 'id'>>) => {
    try {
      await updateProduct(id, patch);
      const updated = await fetchProducts();
      setProductsList(updated);
      showToast('Produto e preço atualizados no Supabase!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      const updated = await fetchProducts();
      setProductsList(updated);
      showToast('Produto excluído com sucesso.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleSaveSettings = async (patch: Partial<AppSettings>) => {
    try {
      const updated = await saveAppSettings(patch);
      setSettings(updated);
      showToast('Configurações salvas no Supabase!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleSignOut = async () => {
    await signOutOwner();
    setAuthState({
      isAuthenticated: false,
      user: null,
      session: null,
      loading: false,
      error: null,
    });
    showToast('Sessão administrativa encerrada.', 'info');
    navigateToPublic();
  };

  // 1. ROUTE A: Public Redirect Route (/q/:slug or /r/:slug)
  if (route.type === 'redirect') {
    return (
      <PublicRedirectView
        slug={route.slug}
        source={route.source}
        onReturnToDashboard={navigateToPublic}
      />
    );
  }

  // 2. ROUTE B: Public Visitor View (Default / route with zero admin buttons for visitors)
  if (route.type === 'public') {
    return (
      <PublicCatalogView
        products={products}
        settings={settings}
        samplePlaques={plaques}
        onTestPublicRoute={(slug, source) => setRoute({ type: 'redirect', slug, source })}
      />
    );
  }

  // 3. ROUTE C: Private Admin Route (/gestao-privada-goldflow)
  // Protected by Supabase Auth: If not authenticated, render login screen
  if (!authState.isAuthenticated) {
    return (
      <AdminAuthView
        onAuthenticated={() => {
          getInitialAuthState().then(setAuthState);
          showToast('Autenticado com sucesso via Supabase Auth!', 'success');
        }}
        onReturnToPublic={navigateToPublic}
        onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
      />
    );
  }

  // Filter plaques by search
  const filteredPlaques = plaques.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.targetUrl.toLowerCase().includes(q) ||
      (p.clientName && p.clientName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#060b17] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar Contract */}
      <Navbar
        currentUser={currentUser}
        users={users}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onSwitchUser={handleSwitchUser}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenNfcSimulator={() => setIsNfcSimulatorOpen(true)}
        onOpenNewPlaqueModal={() => setIsCreatePlaqueOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        onSignOut={handleSignOut}
        onViewPublicSite={navigateToPublic}
        authEmail={authState.user?.email}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-top-2 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-2xl ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950 border-emerald-700 text-emerald-200'
                : toastMessage.type === 'error'
                ? 'bg-red-950 border-red-700 text-red-200'
                : 'bg-[#0b1528] border-[#1e355b] text-blue-200'
            }`}
          >
            {toastMessage.type === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
            {toastMessage.type === 'info' && <ShieldCheck className="w-4 h-4 text-blue-400" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* TAB 1: PLAQUES LIST */}
        {activeTab === 'plaques' && (
          <div className="max-w-5xl mx-auto px-4 pt-4 sm:pt-6 pb-28 flex flex-col gap-6">
            {/* Friendly Welcome & Quick Guide Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-[#0c1830] via-[#091224] to-[#070e1c] border border-[#1b2f52] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-heading font-extrabold text-white text-base sm:text-lg">
                    {currentUser.role === 'admin' ? 'Painel Geral GoldFlow NFC' : `Placas de ${currentUser.companyName}`}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                    Troque os destinos do NFC e do QR Code a qualquer momento sem regravar o chip ou reimprimir a placa
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('guide')}
                  className="flex-1 sm:flex-initial py-3 px-4 rounded-2xl bg-[#0b1528] hover:bg-[#12213d] text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-[#1b2f52] transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  <span>Passo a Passo</span>
                </button>

                <button
                  onClick={() => setIsCreatePlaqueOpen(true)}
                  className="flex-1 sm:flex-initial py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Placa</span>
                </button>
              </div>
            </div>

            {/* Context Header with Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="font-heading text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>Placas NFC & QR Codes</span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                    {plaques.length} cadastradas
                  </span>
                </h1>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por placa ou link..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0b1528] border border-[#1b2f52] text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Plaques Grid */}
            {filteredPlaques.length === 0 ? (
              <div className="rounded-3xl bg-[#0b1528] border border-[#1b2f52] p-10 text-center flex flex-col items-center justify-center gap-4 shadow-xl">
                <Radio className="w-12 h-12 text-slate-600" />
                <div>
                  <h3 className="font-heading font-bold text-white text-base">
                    Nenhuma placa encontrada
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-sm mt-1">
                    {searchQuery
                      ? 'Nenhum resultado corresponde à sua pesquisa.'
                      : 'Nenhuma placa vinculada a este perfil.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsCreatePlaqueOpen(true)}
                  className="py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-950 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Primeira Placa</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlaques.map((plaque) => (
                  <PlaqueCard
                    key={plaque.id}
                    plaque={plaque}
                    userRole={currentUser.role}
                    onEditDestination={(p) => setEditingPlaque(p)}
                    onEditQrDestination={(p) => setQrDestinationPlaque(p)}
                    onOpenQrStudio={(p) => setQrStudioPlaque(p)}
                    onToggleLock={handleToggleLock}
                    onSimulateTap={(p) => {
                      setRoute({ type: 'redirect', slug: p.slug, source: 'nfc' });
                    }}
                    onTestQr={handleTestQrRoute}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PASSO A PASSO / MANUAL */}
        {activeTab === 'guide' && (
          <GuideStepByStepView
            plaques={plaques}
            userRole={currentUser.role}
            onOpenNewPlaqueModal={() => setIsCreatePlaqueOpen(true)}
            onOpenQrStudio={(p) => {
              if (p) setQrStudioPlaque(p);
              else setActiveTab('qr_studio');
            }}
            onOpenNfcSimulator={() => setIsNfcSimulatorOpen(true)}
            onGoToPlaques={() => setActiveTab('plaques')}
          />
        )}

        {/* TAB 3: QR CODE STUDIO */}
        {activeTab === 'qr_studio' && (
          <div className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6 pb-28 flex flex-col gap-6">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Gerador de QR Code Direto & Dinâmico
              </span>
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-white">
                Central de QR Codes
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Altere os destinos dos QR Codes das placas sem reimprimir ou gere QR Codes rápidos para qualquer link
              </p>
            </div>

            {/* Quick Generator Box (Paste any link on the fly) */}
            <div className="rounded-3xl bg-[#0b1528] border border-[#1b2f52] p-5 sm:p-6 flex flex-col gap-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white text-base">
                      Gerador Rápido: Cole Qualquer Link
                    </h3>
                    <p className="text-xs text-slate-400">
                      Gere e baixe em PNG 1024px e SVG para WhatsApp, Instagram, Google, cardápios ou sites
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 self-start sm:self-auto">
                  Abre Diretamente no Celular
                </span>
              </div>

              {/* URL Input */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center rounded-2xl bg-[#070d1a] border border-[#1b2f52] px-3.5 focus-within:border-blue-500 transition-colors">
                  <Link2 className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={quickQrUrl}
                    onChange={(e) => setQuickQrUrl(e.target.value)}
                    placeholder="https://wa.me/5511... ou https://instagram.com/... ou https://g.page/..."
                    className="w-full py-3 bg-transparent text-xs sm:text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none"
                  />
                  {quickQrUrl.trim() && (
                    <a
                      href={quickQrUrl.startsWith('http') ? quickQrUrl : `https://${quickQrUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 font-bold px-2.5 py-1.5 rounded-xl bg-[#0b1528] border border-[#1b2f52] shrink-0"
                      title="Testar link em nova aba"
                    >
                      <span>Testar</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Preset suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-bold">Destinos Rápidos:</span>
                  <button
                    type="button"
                    onClick={() => setQuickQrUrl('https://wa.me/')}
                    className="px-2.5 py-1 rounded-xl bg-[#070d1a] hover:bg-[#12213d] text-emerald-400 border border-[#1b2f52] text-xs font-bold"
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickQrUrl('https://instagram.com/')}
                    className="px-2.5 py-1 rounded-xl bg-[#070d1a] hover:bg-[#12213d] text-pink-400 border border-[#1b2f52] text-xs font-bold"
                  >
                    Instagram
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickQrUrl('https://g.page/r/')}
                    className="px-2.5 py-1 rounded-xl bg-[#070d1a] hover:bg-[#12213d] text-amber-400 border border-[#1b2f52] text-xs font-bold"
                  >
                    Google Avaliações
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickQrUrl('https://')}
                    className="px-2.5 py-1 rounded-xl bg-[#070d1a] hover:bg-[#12213d] text-sky-400 border border-[#1b2f52] text-xs font-bold"
                  >
                    Site / Outro
                  </button>
                </div>
              </div>

              {/* Action Buttons: Download and Plaque Linking */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#16243f]">
                {/* Plaque link selector */}
                {plaques.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      value={quickQrPlaqueId}
                      onChange={(e) => setQuickQrPlaqueId(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                    >
                      <option value="">Vincular a uma Placa Existente...</option>
                      {plaques.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} (/r/{p.slug})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleSaveQuickToPlaque}
                      disabled={!quickQrPlaqueId}
                      className="px-3.5 py-2.5 rounded-xl bg-[#12213d] hover:bg-[#1a3058] text-white text-xs font-bold border border-[#1b2f52] disabled:opacity-40 transition-colors flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5 text-blue-400" />
                      <span>Salvar na Placa</span>
                    </button>
                  </div>
                )}

                {/* Download buttons */}
                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleDownloadQuickPng}
                    disabled={quickDownloadingPng}
                    className="py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-900" />
                    <span>{quickDownloadingPng ? 'Baixando...' : 'Baixar PNG (1024px)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadQuickSvg}
                    disabled={quickDownloadingSvg}
                    className="py-3 px-4 rounded-xl bg-[#12213d] hover:bg-[#1a3058] text-white font-bold text-xs flex items-center gap-2 border border-[#1b2f52] transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <FileCode className="w-4 h-4 text-blue-400" />
                    <span>{quickDownloadingSvg ? 'Exportando...' : 'Baixar SVG Vetor'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* List of Plaques with Independent QR Links */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-white text-base">
                  QR Codes Vinculados às Suas Placas
                </h3>
                <span className="text-xs text-slate-400 font-bold">
                  {plaques.length} placa(s) cadastradas
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plaques.map((plaque) => (
                  <div
                    key={plaque.id}
                    className="rounded-3xl bg-[#0b1528] border border-[#1b2f52] p-5 flex flex-col justify-between gap-3.5 shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-heading font-extrabold text-white text-base truncate">
                          {plaque.title}
                        </h4>
                        <div className="font-mono text-xs text-slate-400 mt-1 truncate flex items-center gap-1.5">
                          <span className="text-slate-400">QR Impresso:</span>
                          <span className="text-white bg-[#070d1a] px-2 py-0.5 rounded-lg border border-[#1b2f52]">/q/{plaque.slug}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 shrink-0">
                        QR Permanente
                      </span>
                    </div>

                    <div className="p-3.5 bg-[#070d1a] border border-[#1b2f52] rounded-2xl flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span className="font-bold text-slate-300">Destino Atual do Redirecionamento:</span>
                        <a
                          href={plaque.qrTargetUrl || plaque.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          <span>Testar</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="font-mono text-xs text-slate-200 truncate" title={plaque.qrTargetUrl || plaque.targetUrl}>
                        {plaque.qrTargetUrl || plaque.targetUrl}
                      </div>

                      <div className="pt-2 border-t border-[#14233e] text-[11px] text-slate-400 flex items-center justify-between">
                        <span className="truncate">NFC desta placa: <strong className="text-slate-300 font-mono">{plaque.targetUrl}</strong></span>
                        <span className="text-emerald-400 shrink-0 ml-1 font-bold">Imagem nunca muda</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        onClick={() => setQrDestinationPlaque(plaque)}
                        className="min-h-[46px] py-2.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        title="Trocar para onde o QR Code impresso redireciona"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Trocar Destino</span>
                      </button>

                      <button
                        onClick={() => setQrStudioPlaque(plaque)}
                        className="min-h-[46px] py-2.5 px-2 rounded-xl bg-[#12213d] hover:bg-[#1a3058] text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-[#1b2f52] transition-colors"
                        title="Baixar imagem em PNG ou SVG para impressão"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-400" />
                        <span>Baixar QR</span>
                      </button>

                      <button
                        onClick={() => handleTestQrRoute(plaque)}
                        className="min-h-[46px] py-2.5 px-2 rounded-xl bg-[#070d1a] hover:bg-[#12213d] text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-[#1b2f52] transition-colors"
                        title="Testar rota exclusiva /q/ desta placa com redirecionamento direto sem abrir o site"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                        <span>Testar (/q/)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ANALYTICS */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            plaques={plaques}
            scans={scans}
            userRole={currentUser.role}
            clientName={currentUser.companyName}
          />
        )}

        {/* TAB 5: CLIENTS (ADMIN ONLY) */}
        {activeTab === 'clients' && currentUser.role === 'admin' && (
          <AdminClientsView
            users={users}
            plaques={plaques}
            onCreateClient={handleCreateClient}
            onDeleteClient={handleDeleteClient}
            onCreatePlaque={handleCreatePlaque}
            onSelectPlaqueForEdit={(p) => setEditingPlaque(p)}
            onOpenQrStudio={(p) => setQrStudioPlaque(p)}
            onTestQr={handleTestQrRoute}
          />
        )}

        {/* TAB 6: PRODUTOS & PREÇOS (ADMIN ONLY) */}
        {activeTab === 'products' && currentUser.role === 'admin' && (
          <ProductsManagerView
            products={products}
            settings={settings}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onSaveSettings={handleSaveSettings}
          />
        )}
      </main>

      {/* Bottom Mobile Tab Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onSelectTab={(t) => setActiveTab(t)}
        userRole={currentUser.role}
        plaquesCount={plaques.length}
      />

      {/* Modals */}
      {isCreatePlaqueOpen && (
        <CreatePlaqueModal
          isOpen={isCreatePlaqueOpen}
          onClose={() => setIsCreatePlaqueOpen(false)}
          currentUser={currentUser}
          clients={users}
          onCreatePlaque={handleCreatePlaque}
        />
      )}

      {editingPlaque && (
        <PlaqueEditorModal
          plaque={editingPlaque}
          isOpen={!!editingPlaque}
          onClose={() => setEditingPlaque(null)}
          onSave={handleSaveDestination}
          onDelete={handleDeletePlaque}
        />
      )}

      {qrDestinationPlaque && (
        <QrDestinationModal
          plaque={qrDestinationPlaque}
          isOpen={!!qrDestinationPlaque}
          onClose={() => setQrDestinationPlaque(null)}
          onSaveQrDestination={handleSaveQrLink}
          onSimulateScan={(slug, source) => setRoute({ type: 'redirect', slug, source })}
        />
      )}

      {qrStudioPlaque && (
        <QRCodeStudioModal
          plaque={qrStudioPlaque}
          currentUser={currentUser}
          isOpen={!!qrStudioPlaque}
          onClose={() => setQrStudioPlaque(null)}
          onSaveQrLink={handleSaveQrLink}
          onSimulateScan={(slug, source) => setRoute({ type: 'redirect', slug, source })}
        />
      )}

      {isNfcSimulatorOpen && (
        <NfcSimulatorModal
          plaques={plaques}
          selectedPlaque={plaques[0] || null}
          isOpen={isNfcSimulatorOpen}
          onClose={() => setIsNfcSimulatorOpen(false)}
          onExecuteScan={handleExecuteScanFromSimulator}
        />
      )}

      {isSupabaseModalOpen && (
        <SupabaseConfigModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          onConnectionStatusChange={(connected) => setIsSupabaseConnected(connected)}
        />
      )}
    </div>
  );
}
