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
  QrCode
} from 'lucide-react';
import { Plaque, ScanEvent, UserProfile, TargetType, ScanSource } from './types';
import { 
  getCurrentUser, 
  getUsers, 
  setCurrentUser, 
  getPlaques, 
  updatePlaqueDestination, 
  togglePlaqueLock, 
  getRecentScans,
  createPlaque,
  createClientProfile,
  recordPlaqueScan
} from './lib/storage';
import { getStoredSupabaseConfig } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { BottomTabBar, TabType } from './components/BottomTabBar';
import { PlaqueCard } from './components/PlaqueCard';
import { PlaqueEditorModal } from './components/PlaqueEditorModal';
import { QRCodeStudioModal } from './components/QRCodeStudioModal';
import { NfcSimulatorModal } from './components/NfcSimulatorModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { AnalyticsView } from './components/AnalyticsView';
import { AdminClientsView } from './components/AdminClientsView';
import { PublicRedirectView } from './components/PublicRedirectView';

export default function App() {
  // Check URL for public redirect route e.g. /r/:slug?src=nfc or ?r=slug
  const [publicRoute, setPublicRoute] = useState<{ slug: string; source: ScanSource } | null>(() => {
    try {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const srcParam = (params.get('src') || 'nfc') as ScanSource;

      // Handle path /r/:slug
      const match = path.match(/^\/r\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        return { slug: match[1], source: srcParam };
      }

      // Handle query fallback ?r=slug
      const querySlug = params.get('r');
      if (querySlug) {
        return { slug: querySlug, source: srcParam };
      }
    } catch (e) {
      console.warn('Path check error', e);
    }
    return null;
  });

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
  const [editingPlaque, setEditingPlaque] = useState<Plaque | null>(null);
  const [qrStudioPlaque, setQrStudioPlaque] = useState<Plaque | null>(null);
  const [isNfcSimulatorOpen, setIsNfcSimulatorOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Refresh data
  const refreshData = useCallback(async (user: UserProfile) => {
    const loadedUsers = getUsers();
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

  // Switch active profile (Admin <-> Client)
  const handleSwitchUser = (userId: string) => {
    const nextUser = setCurrentUser(userId);
    setUser(nextUser);
    showToast(`Perfil alterado para: ${nextUser.fullName} (${nextUser.companyName})`, 'info');
  };

  // Edit destination
  const handleSaveDestination = async (
    plaqueId: string,
    targetType: TargetType,
    targetUrl: string,
    targetParams?: Plaque['targetParams']
  ) => {
    await updatePlaqueDestination(currentUser, plaqueId, targetType, targetUrl, targetParams);
    await refreshData(currentUser);
    showToast('Destino da placa atualizado com sucesso!', 'success');
  };

  // Toggle Remote Lock
  const handleToggleLock = async (plaque: Plaque) => {
    try {
      const nextLockState = !plaque.isLocked;
      await togglePlaqueLock(
        currentUser,
        plaque.id,
        nextLockState,
        nextLockState ? 'Bloqueio administrativo por pendência cadastral.' : undefined
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
    setPublicRoute({ slug, source });
  };

  // Create Client
  const handleCreateClient = async (data: {
    email: string;
    fullName: string;
    companyName: string;
    phone: string;
  }) => {
    await createClientProfile(currentUser, data);
    await refreshData(currentUser);
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
  };

  // If public route requested, render PublicRedirectView
  if (publicRoute) {
    return (
      <PublicRedirectView
        slug={publicRoute.slug}
        source={publicRoute.source}
        onReturnToDashboard={() => setPublicRoute(null)}
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
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Navbar Contract */}
      <Navbar
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenNfcSimulator={() => setIsNfcSimulatorOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-top-2 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-2xl ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950 border-emerald-700 text-emerald-200'
                : toastMessage.type === 'error'
                ? 'bg-red-950 border-red-700 text-red-200'
                : 'bg-zinc-900 border-zinc-700 text-zinc-200'
            }`}
          >
            {toastMessage.type === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
            {toastMessage.type === 'info' && <ShieldCheck className="w-4 h-4 text-zinc-400" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* TAB 1: PLAQUES LIST */}
        {activeTab === 'plaques' && (
          <div className="max-w-5xl mx-auto px-4 pt-4 sm:pt-6 pb-24 flex flex-col gap-5">
            {/* Context Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                  {currentUser.role === 'admin' ? 'Painel Geral GoldFlow' : 'Placas da Sua Loja'}
                </span>
                <h1 className="font-heading text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>Placas NFC & QR Codes</span>
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                    {plaques.length} ativas
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Troque o destino a qualquer momento sem regravar o chip físico
                </p>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por placa ou link..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121214] border border-[#27272a] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => setActiveTab('clients')}
                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-red-950/40 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nova Placa</span>
                  </button>
                )}
              </div>
            </div>

            {/* Plaques Grid */}
            {filteredPlaques.length === 0 ? (
              <div className="rounded-2xl bg-[#121214] border border-[#27272a] p-8 text-center flex flex-col items-center justify-center gap-3">
                <Radio className="w-8 h-8 text-zinc-600" />
                <h3 className="font-heading font-semibold text-white text-sm">
                  Nenhuma placa encontrada
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs">
                  {searchQuery
                    ? 'Nenhum resultado corresponde à sua pesquisa.'
                    : 'Nenhuma placa vinculada a este perfil.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlaques.map((plaque) => (
                  <PlaqueCard
                    key={plaque.id}
                    plaque={plaque}
                    userRole={currentUser.role}
                    onEditDestination={(p) => setEditingPlaque(p)}
                    onOpenQrStudio={(p) => setQrStudioPlaque(p)}
                    onToggleLock={handleToggleLock}
                    onSimulateTap={(p) => {
                      setPublicRoute({ slug: p.slug, source: 'nfc' });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QR CODE STUDIO */}
        {activeTab === 'qr_studio' && (
          <div className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6 pb-24 flex flex-col gap-5">
            <div>
              <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                Exportação Gráfica Profissional
              </span>
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-white">
                Central de QR Codes para Impressão
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Gere arquivos em alta definição (PNG 1024px) e vetores (SVG) prontos para corte a laser
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {plaques.map((plaque) => (
                <div
                  key={plaque.id}
                  className="rounded-2xl bg-[#121214] border border-[#27272a] p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <h3 className="font-heading font-bold text-white text-sm truncate">
                      {plaque.title}
                    </h3>
                    <div className="font-mono text-xs text-zinc-400 mt-0.5">
                      /r/{plaque.slug}
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl aspect-square flex items-center justify-center max-w-[140px] mx-auto w-full shadow-md">
                    <QrCode className="w-20 h-20 text-black" />
                  </div>

                  <button
                    onClick={() => setQrStudioPlaque(plaque)}
                    className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-red-950/30"
                  >
                    <span>Abrir & Baixar (PNG / SVG)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ANALYTICS */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            plaques={plaques}
            scans={scans}
            userRole={currentUser.role}
            clientName={currentUser.companyName}
          />
        )}

        {/* TAB 4: CLIENTS (ADMIN ONLY) */}
        {activeTab === 'clients' && currentUser.role === 'admin' && (
          <AdminClientsView
            users={users}
            plaques={plaques}
            onCreateClient={handleCreateClient}
            onCreatePlaque={handleCreatePlaque}
            onSelectPlaqueForEdit={(p) => setEditingPlaque(p)}
          />
        )}

        {/* TAB 5: SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="max-w-md mx-auto px-4 pt-6 pb-24 flex flex-col gap-4">
            <div className="text-center">
              <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                Ambiente de Teste Físico
              </span>
              <h1 className="font-heading text-xl font-bold text-white">
                Simulador de Aproximação
              </h1>
              <p className="text-xs text-zinc-400">
                Toque no botão para simular um cliente encostando o celular na placa real
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#121214] border border-[#27272a] flex flex-col gap-3">
              {plaques.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-xs truncate">
                      {p.title}
                    </div>
                    <div className="font-mono text-[11px] text-zinc-400 truncate">
                      /r/{p.slug}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setPublicRoute({ slug: p.slug, source: 'nfc' })}
                      className="py-1 px-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs flex items-center gap-1 transition-colors"
                      title="Simular aproximação do chip NFC"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>NFC</span>
                    </button>
                    <button
                      onClick={() => setPublicRoute({ slug: p.slug, source: 'qr' })}
                      className="py-1 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs flex items-center gap-1 transition-colors"
                      title="Simular leitura pela câmera do QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
      {editingPlaque && (
        <PlaqueEditorModal
          plaque={editingPlaque}
          isOpen={!!editingPlaque}
          onClose={() => setEditingPlaque(null)}
          onSave={handleSaveDestination}
        />
      )}

      {qrStudioPlaque && (
        <QRCodeStudioModal
          plaque={qrStudioPlaque}
          isOpen={!!qrStudioPlaque}
          onClose={() => setQrStudioPlaque(null)}
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
