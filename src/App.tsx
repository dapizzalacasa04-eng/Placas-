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
  Link2
} from 'lucide-react';
import { downloadQRCodePNG, downloadQRCodeSVG } from './lib/qrCodeHelper';
import { Plaque, ScanEvent, UserProfile, TargetType, ScanSource } from './types';
import { 
  getCurrentUser, 
  getUsers, 
  setCurrentUser, 
  getPlaques, 
  updatePlaqueDestination, 
  updatePlaqueQrDestination,
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

  // Quick Standalone QR Generator State
  const [quickQrUrl, setQuickQrUrl] = useState('https://wa.me/5511999998888');
  const [quickQrPlaqueId, setQuickQrPlaqueId] = useState('');
  const [quickDownloadingPng, setQuickDownloadingPng] = useState(false);
  const [quickDownloadingSvg, setQuickDownloadingSvg] = useState(false);

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
    showToast('Destino do chip NFC atualizado com sucesso!', 'success');
  };

  // Edit independent QR Code destination
  const handleSaveQrLink = async (plaqueId: string, newQrUrl: string) => {
    await updatePlaqueQrDestination(currentUser, plaqueId, newQrUrl);
    await refreshData(currentUser);
    showToast('Link do QR Code salvo no banco de dados com sucesso!', 'success');
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
    await handleSaveQrLink(quickQrPlaqueId, quickQrUrl.trim());
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
          <div className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6 pb-24 flex flex-col gap-6">
            <div>
              <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                Gerador de QR Code Direto & Independente
              </span>
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-white">
                Central de QR Codes
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cole qualquer link para gerar QR Codes diretos que abrem imediatamente na câmera sem passar pelo app GoldFlow
              </p>
            </div>

            {/* Quick Generator Box (Paste any link on the fly) */}
            <div className="rounded-2xl bg-[#121214] border border-[#27272a] p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white text-sm">
                      Gerador Rápido: Cole Qualquer Link
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Gere e baixe em PNG 1024px e SVG para WhatsApp, Instagram, Google, cardápios ou sites
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 self-start sm:self-auto">
                  Abre Diretamente no Celular
                </span>
              </div>

              {/* URL Input */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center rounded-xl bg-[#0a0a0c] border border-[#27272a] px-3 focus-within:border-red-500 transition-colors">
                  <Link2 className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={quickQrUrl}
                    onChange={(e) => setQuickQrUrl(e.target.value)}
                    placeholder="https://wa.me/5511... ou https://instagram.com/... ou https://g.page/..."
                    className="w-full py-2.5 bg-transparent text-xs sm:text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none"
                  />
                  {quickQrUrl.trim() && (
                    <a
                      href={quickQrUrl.startsWith('http') ? quickQrUrl : `https://${quickQrUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 font-medium px-2 py-1 rounded bg-[#18181b] border border-[#27272a] shrink-0"
                      title="Testar link em nova aba"
                    >
                      <span>Testar</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Preset suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-500 font-medium">Exemplos:</span>
                  <button
                    type="button"
                    onClick={() => setQuickQrUrl('https://wa.me/5511999998888?text=Olá!%20Vim%20pelo%20QR%20Code.')}
                    className="px-2 py-0.5 rounded-lg bg-[#18181b] hover:bg-[#222226] text-emerald-400 border border-[#27272a] text-[10px] font-medium"
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickQrUrl('https://instagram.com/sualojaoficial')}
                    className="px-2 py-0.5 rounded-lg bg-[#18181b] hover:bg-[#222226] text-pink-400 border border-[#27272a] text-[10px] font-medium"
                  >
                    Instagram
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickQrUrl('https://g.page/r/Cbistro-royal/review')}
                    className="px-2 py-0.5 rounded-lg bg-[#18181b] hover:bg-[#222226] text-amber-400 border border-[#27272a] text-[10px] font-medium"
                  >
                    Google Avaliações
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickQrUrl('https://cardapio.sualoja.com.br')}
                    className="px-2 py-0.5 rounded-lg bg-[#18181b] hover:bg-[#222226] text-sky-400 border border-[#27272a] text-[10px] font-medium"
                  >
                    Cardápio / Site
                  </button>
                </div>
              </div>

              {/* Action Buttons: Download and Plaque Linking */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#1f1f23]">
                {/* Plaque link selector */}
                {plaques.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      value={quickQrPlaqueId}
                      onChange={(e) => setQuickQrPlaqueId(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-xs text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="">Selecione uma Placa para Salvar...</option>
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
                      className="px-3 py-1.5 rounded-lg bg-[#1c1c20] hover:bg-[#27272a] text-zinc-200 text-xs font-medium border border-[#27272a] disabled:opacity-40 transition-colors flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5 text-red-400" />
                      <span>Salvar no Banco</span>
                    </button>
                  </div>
                )}

                {/* Download buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleDownloadQuickPng}
                    disabled={quickDownloadingPng}
                    className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/40 transition-all disabled:opacity-50"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{quickDownloadingPng ? 'Baixando...' : 'Baixar PNG (1024px)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadQuickSvg}
                    disabled={quickDownloadingSvg}
                    className="py-2 px-3.5 rounded-xl bg-[#1c1c20] hover:bg-[#27272a] text-zinc-100 font-semibold text-xs flex items-center gap-1.5 border border-[#27272a] transition-all disabled:opacity-50"
                  >
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{quickDownloadingSvg ? 'Exportando...' : 'Baixar SVG'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* List of Plaques with Independent QR Links */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-white text-sm">
                  QR Codes Vinculados às Suas Placas
                </h3>
                <span className="text-xs text-zinc-400">
                  {plaques.length} placa(s) cadastradas
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plaques.map((plaque) => (
                  <div
                    key={plaque.id}
                    className="rounded-2xl bg-[#121214] border border-[#27272a] p-4 flex flex-col justify-between gap-3 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-heading font-bold text-white text-sm truncate">
                          {plaque.title}
                        </h4>
                        <div className="font-mono text-[11px] text-zinc-400 mt-0.5 truncate">
                          /r/{plaque.slug}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 shrink-0">
                        Abre Direto
                      </span>
                    </div>

                    <div className="p-3 bg-[#0a0a0c] border border-[#27272a] rounded-xl flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                        <span>Link do QR Code Salvo:</span>
                        <a
                          href={plaque.qrTargetUrl || plaque.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-400 hover:underline flex items-center gap-1"
                        >
                          <span>Testar</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="font-mono text-xs text-zinc-200 truncate" title={plaque.qrTargetUrl || plaque.targetUrl}>
                        {plaque.qrTargetUrl || plaque.targetUrl}
                      </div>

                      <div className="pt-1.5 border-t border-[#1c1c20] text-[10px] text-zinc-400 flex items-center justify-between">
                        <span className="truncate">NFC desta placa: <strong className="text-zinc-300 font-mono">{plaque.targetUrl}</strong></span>
                        <span className="text-zinc-400 shrink-0 ml-1">(Independente)</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setQrStudioPlaque(plaque)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-red-950/30"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Alterar Link / Baixar (PNG e SVG)</span>
                    </button>
                  </div>
                ))}
              </div>
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
          currentUser={currentUser}
          isOpen={!!qrStudioPlaque}
          onClose={() => setQrStudioPlaque(null)}
          onSaveQrLink={handleSaveQrLink}
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
