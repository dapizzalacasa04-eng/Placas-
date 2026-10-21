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
import { QrDestinationModal } from './components/QrDestinationModal';
import { NfcSimulatorModal } from './components/NfcSimulatorModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { AnalyticsView } from './components/AnalyticsView';
import { AdminClientsView } from './components/AdminClientsView';
import { PublicRedirectView } from './components/PublicRedirectView';
import { GuideStepByStepView } from './components/GuideStepByStepView';
import { CreatePlaqueModal } from './components/CreatePlaqueModal';

export default function App() {
  // Check URL for public redirect route e.g. /r/:slug?src=nfc or ?r=slug or /q/:slug
  const [publicRoute, setPublicRoute] = useState<{ slug: string; source: ScanSource } | null>(() => {
    try {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const srcParam = (params.get('src') || 'nfc') as ScanSource;

      // Handle path /q/:slug or /qr/:slug (Permanent Dynamic QR Code Links)
      const qrMatch = path.match(/^\/(?:q|qr)\/([a-zA-Z0-9-_]+)/);
      if (qrMatch && qrMatch[1]) {
        return { slug: qrMatch[1], source: 'qr' };
      }

      // Handle path /r/:slug (Permanent NFC or General short link)
      const rMatch = path.match(/^\/r\/([a-zA-Z0-9-_]+)/);
      if (rMatch && rMatch[1]) {
        return { slug: rMatch[1], source: srcParam };
      }

      // Handle query fallback ?q=slug or ?r=slug
      const queryQr = params.get('q') || params.get('qr');
      if (queryQr) {
        return { slug: queryQr, source: 'qr' };
      }
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
  const [isCreatePlaqueOpen, setIsCreatePlaqueOpen] = useState(false);
  const [editingPlaque, setEditingPlaque] = useState<Plaque | null>(null);
  const [qrDestinationPlaque, setQrDestinationPlaque] = useState<Plaque | null>(null);
  const [qrStudioPlaque, setQrStudioPlaque] = useState<Plaque | null>(null);
  const [isNfcSimulatorOpen, setIsNfcSimulatorOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Quick Standalone QR Generator State in QR Tab
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
    showToast(`Placa /r/${data.slug} criada com sucesso!`, 'success');
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
                      setPublicRoute({ slug: p.slug, source: 'nfc' });
                    }}
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
                  <span className="text-[11px] text-slate-400 font-bold">Exemplos:</span>
                  <button
                    type="button"
                    onClick={() => setQuickQrUrl('https://wa.me/5511999998888?text=Olá!%20Vim%20pelo%20QR%20Code.')}
                    className="px-2.5 py-1 rounded-xl bg-[#070d1a] hover:bg-[#12213d] text-emerald-400 border border-[#1b2f52] text-xs font-bold"
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickQrUrl('https://instagram.com/sualojaoficial')}
                    className="px-2.5 py-1 rounded-xl bg-[#070d1a] hover:bg-[#12213d] text-pink-400 border border-[#1b2f52] text-xs font-bold"
                  >
                    Instagram
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickQrUrl('https://g.page/r/Cbistro-royal/review')}
                    className="px-2.5 py-1 rounded-xl bg-[#070d1a] hover:bg-[#12213d] text-amber-400 border border-[#1b2f52] text-xs font-bold"
                  >
                    Google Avaliações
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickQrUrl('https://cardapio.sualoja.com.br')}
                    className="px-2.5 py-1 rounded-xl bg-[#070d1a] hover:bg-[#12213d] text-sky-400 border border-[#1b2f52] text-xs font-bold"
                  >
                    Cardápio / Site
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
                        onClick={() => setPublicRoute({ slug: plaque.slug, source: 'qr' })}
                        className="min-h-[46px] py-2.5 px-2 rounded-xl bg-[#070d1a] hover:bg-[#12213d] text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-[#1b2f52] transition-colors"
                        title="Simular leitura da câmera do celular"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-blue-400" />
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
            onCreatePlaque={handleCreatePlaque}
            onSelectPlaqueForEdit={(p) => setEditingPlaque(p)}
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
        />
      )}

      {qrDestinationPlaque && (
        <QrDestinationModal
          plaque={qrDestinationPlaque}
          isOpen={!!qrDestinationPlaque}
          onClose={() => setQrDestinationPlaque(null)}
          onSaveQrDestination={handleSaveQrLink}
          onSimulateScan={(slug, source) => setPublicRoute({ slug, source })}
        />
      )}

      {qrStudioPlaque && (
        <QRCodeStudioModal
          plaque={qrStudioPlaque}
          currentUser={currentUser}
          isOpen={!!qrStudioPlaque}
          onClose={() => setQrStudioPlaque(null)}
          onSaveQrLink={handleSaveQrLink}
          onSimulateScan={(slug, source) => setPublicRoute({ slug, source })}
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
