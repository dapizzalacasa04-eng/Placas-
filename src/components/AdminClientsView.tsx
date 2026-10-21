import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Smartphone, 
  Check, 
  AlertCircle, 
  Building2, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Copy, 
  Radio, 
  QrCode, 
  Star, 
  MessageSquare, 
  Instagram, 
  Globe, 
  Search,
  Layers,
  Sparkles,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { Plaque, UserProfile, TargetType } from '../types';

interface AdminClientsViewProps {
  users: UserProfile[];
  plaques: Plaque[];
  onCreateClient: (data: {
    email: string;
    fullName: string;
    companyName: string;
    phone: string;
  }) => Promise<void>;
  onDeleteClient?: (clientId: string) => Promise<void>;
  onCreatePlaque: (data: {
    clientId: string;
    slug: string;
    title: string;
    targetType: Plaque['targetType'];
    targetUrl: string;
  }) => Promise<void>;
  onSelectPlaqueForEdit: (plaque: Plaque) => void;
  onOpenQrStudio?: (plaque: Plaque) => void;
  onTestQr?: (plaque: Plaque) => void;
}

export const AdminClientsView: React.FC<AdminClientsViewProps> = ({
  users,
  plaques,
  onCreateClient,
  onDeleteClient,
  onCreatePlaque,
  onSelectPlaqueForEdit,
  onOpenQrStudio,
  onTestQr,
}) => {
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showNewPlaqueModal, setShowNewPlaqueModal] = useState(false);

  // Filter or search state
  const [searchPlaqueQuery, setSearchPlaqueQuery] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // New Client Form — Real People
  const [clientForm, setClientForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
  });

  // New Plaque Form
  const [plaqueForm, setPlaqueForm] = useState({
    clientId: users.find((u) => u.role === 'client')?.id || '',
    slug: '',
    title: '',
    targetType: 'google_review' as TargetType,
    targetUrl: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clientUsers = users.filter((u) => u.role === 'client');

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSlug(identifier);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const getDestinationBadge = (type: TargetType) => {
    switch (type) {
      case 'google_review':
        return {
          label: 'Google Avaliações',
          icon: Star,
          color: 'bg-amber-950/80 text-amber-300 border-amber-800',
        };
      case 'instagram':
        return {
          label: 'Instagram',
          icon: Instagram,
          color: 'bg-pink-950/80 text-pink-300 border-pink-800',
        };
      case 'whatsapp':
        return {
          label: 'WhatsApp',
          icon: MessageSquare,
          color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
        };
      case 'menu':
        return {
          label: 'Cardápio',
          icon: Globe,
          color: 'bg-sky-950/80 text-sky-300 border-sky-800',
        };
      default:
        return {
          label: 'Link Web',
          icon: Globe,
          color: 'bg-blue-950/80 text-blue-300 border-blue-800',
        };
    }
  };

  const handleCreateClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const company = clientForm.companyName.trim();
    const name = clientForm.fullName.trim();
    const effectiveCompany = company || name;
    const effectiveName = name || company;

    if (!effectiveCompany && !effectiveName) {
      setError('Por favor, informe o nome da empresa ou responsável.');
      return;
    }

    setSaving(true);
    try {
      await onCreateClient({
        companyName: effectiveCompany,
        fullName: effectiveName,
        email: clientForm.email.trim(),
        phone: clientForm.phone.trim(),
      });
      setSuccess(`Empresa "${effectiveCompany}" cadastrada com sucesso e salva no Supabase!`);
      setClientForm({ fullName: '', companyName: '', email: '', phone: '' });
      setShowNewClientModal(false);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePlaqueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetClientId = plaqueForm.clientId || clientUsers[0]?.id || users[0]?.id;
    if (!targetClientId) {
      setError('Cadastre primeiro um cliente para vincular esta placa.');
      return;
    }

    if (!plaqueForm.slug.trim()) {
      setError('Informe o identificador exclusivo (slug) da placa.');
      return;
    }

    setSaving(true);
    try {
      await onCreatePlaque({
        ...plaqueForm,
        clientId: targetClientId,
        targetUrl: plaqueForm.targetUrl || 'https://google.com',
      });
      setSuccess(`Placa /r/${plaqueForm.slug} emitida e vinculada com sucesso!`);
      setPlaqueForm({
        clientId: clientUsers[0]?.id || '',
        slug: '',
        title: '',
        targetType: 'google_review',
        targetUrl: '',
      });
      setShowNewPlaqueModal(false);
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Filter plaques for the global search
  const filteredAllPlaques = plaques.filter((p) => {
    const q = searchPlaqueQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.targetUrl.toLowerCase().includes(q) ||
      (p.clientName && p.clientName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-6 pb-28 max-w-5xl mx-auto px-4 pt-4 sm:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Painel Administrativo Central · GoldFlow NFC
          </span>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-white">
            Gerenciamento de Placas & Destinos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Altere destinos (Google Avaliações, Instagram, WhatsApp, URL) sem precisar regravar o chip NFC ou reimprimir o QR Code.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowNewPlaqueModal(true)}
            className="py-3 px-4 rounded-2xl bg-[#0b1528] hover:bg-[#12213d] text-slate-100 text-xs sm:text-sm font-bold flex items-center gap-2 border border-[#1b2f52] transition-all"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Emitir Nova Placa</span>
          </button>

          <button
            onClick={() => setShowNewClientModal(true)}
            className="py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-950/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Building2 className="w-4 h-4" />
            <span>Cadastrar Empresa</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-xs sm:text-sm text-emerald-300 flex items-center gap-2.5">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/70 border border-red-800 text-xs sm:text-sm text-red-300 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SEÇÃO 1: CENTRAL DE TROCA DE DESTINO DE TODAS AS PLACAS */}
      <div className="rounded-3xl bg-[#0b1528] border border-[#1b2f52] p-5 sm:p-6 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#16243f]">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h2 className="font-heading text-base sm:text-lg font-bold text-white">
                Troca Rápida de Destino das Placas
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Escolha qualquer placa para alterar o redirecionamento dinâmico no Supabase.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchPlaqueQuery}
              onChange={(e) => setSearchPlaqueQuery(e.target.value)}
              placeholder="Buscar por placa, cliente ou slug..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>
        </div>

        {plaques.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
            <Smartphone className="w-10 h-10 text-slate-500" />
            <p className="text-xs text-slate-400">Nenhuma placa cadastrada no momento.</p>
            <button
              onClick={() => setShowNewPlaqueModal(true)}
              className="mt-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              Emitir Primeira Placa
            </button>
          </div>
        ) : filteredAllPlaques.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Nenhuma placa encontrada com o termo &quot;{searchPlaqueQuery}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAllPlaques.map((plaque) => {
              const badge = getDestinationBadge(plaque.targetType);
              const BadgeIcon = badge.icon;
              const nfcUrl = `${window.location.origin}/r/${plaque.slug}`;
              const qrUrl = `${window.location.origin}/q/${plaque.slug}`;
              const activeDestination = plaque.targetUrl;

              return (
                <div
                  key={plaque.id}
                  className="rounded-2xl bg-[#070d1a] border border-[#1b2f52] p-4 flex flex-col justify-between gap-3 hover:border-blue-500/40 transition-colors"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-heading font-bold text-white text-sm truncate">
                            {plaque.title}
                          </span>
                          {plaque.clientName && (
                            <span className="text-[10px] text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-900 truncate max-w-[140px]">
                              {plaque.clientName}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Identificador Slug: <span className="font-mono text-slate-200">/{plaque.slug}</span>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${badge.color}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    {/* Current Destination Box */}
                    <div className="p-2.5 rounded-xl bg-[#0b1528] border border-[#16243f] flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Destino Atual (Supabase):
                        </span>
                        <a
                          href={activeDestination}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-slate-200 hover:text-blue-300 truncate block text-xs"
                          title={activeDestination}
                        >
                          {activeDestination}
                        </a>
                      </div>
                      <a
                        href={activeDestination}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white p-1"
                        title="Abrir destino em nova aba"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Permanent Links Preview */}
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#0b1528] border border-[#16243f]">
                        <span className="truncate text-slate-400">NFC: /r/{plaque.slug}</span>
                        <button
                          onClick={() => copyToClipboard(nfcUrl, `nfc-${plaque.id}`)}
                          className="text-slate-400 hover:text-white ml-1"
                          title="Copiar link permanente do NFC"
                        >
                          {copiedSlug === `nfc-${plaque.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#0b1528] border border-[#16243f]">
                        <span className="truncate text-blue-300 font-semibold">QR: /q/{plaque.slug}</span>
                        <button
                          onClick={() => copyToClipboard(qrUrl, `qr-${plaque.id}`)}
                          className="text-slate-400 hover:text-white ml-1"
                          title="Copiar link permanente do QR Code"
                        >
                          {copiedSlug === `qr-${plaque.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this plaque */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#16243f]">
                    <div className="text-[11px] text-slate-400">
                      {plaque.totalNfcScans} NFC · {plaque.totalQrScans} QR
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`/r/${plaque.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-[#0b1528] hover:bg-[#12213d] text-slate-300 hover:text-white text-xs font-bold border border-[#1b2f52] transition-colors flex items-center gap-1"
                        title="Testar redirecionamento direto"
                      >
                        <ExternalLink className="w-3 h-3 text-blue-400" />
                        <span>Testar</span>
                      </a>

                      <button
                        onClick={() => onSelectPlaqueForEdit(plaque)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Trocar Destino</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: EMPRESAS & CLIENTES CADASTRADOS */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold text-white">
            Empresas & Clientes Cadastrados
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastros persistidos no Supabase e vinculados a suas respectivas placas.
          </p>
        </div>

        {clientUsers.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#0b1528] border border-[#1b2f52] text-center flex flex-col items-center justify-center gap-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Nenhuma empresa cadastrada ainda</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Cadastre as empresas e clientes para emitir placas inteligentes vinculadas com isolamento seguro no Supabase.
            </p>
            <button
              onClick={() => { setError(null); setShowNewClientModal(true); }}
              className="mt-2 py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-950/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Building2 className="w-4 h-4" />
              <span>Cadastrar Empresa Agora</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientUsers.map((client) => {
              const clientPlaques = plaques.filter((p) => p.clientId === client.id);
              const totalClientScans = clientPlaques.reduce(
                (sum, p) => sum + p.totalNfcScans + p.totalQrScans,
                0
              );

              return (
                <div
                  key={client.id}
                  className="rounded-3xl bg-[#0b1528] border border-[#1b2f52] p-5 sm:p-6 flex flex-col gap-4 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-heading font-extrabold text-base sm:text-lg text-white truncate">
                        {client.companyName || client.fullName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        Responsável: <span className="text-slate-200 font-semibold">{client.fullName || client.companyName}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800">
                        {clientPlaques.length} Placa(s)
                      </span>
                      {onDeleteClient && (
                        <button
                          onClick={() => {
                            if (confirm(`Deseja remover o cadastro de "${client.companyName || client.fullName}"?`)) {
                              onDeleteClient(client.id);
                            }
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/50 transition-colors"
                          title="Excluir este cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-[#070d1a] p-3.5 rounded-2xl border border-[#1b2f52]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">E-mail:</span>
                      <div className="text-slate-200 font-semibold truncate mt-0.5">{client.email || 'Não informado'}</div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">WhatsApp / Telefone:</span>
                      <div className="text-slate-200 font-semibold truncate mt-0.5">{client.phone || 'Não informado'}</div>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-[#16243f] flex items-center justify-between">
                      <span className="text-slate-400">Total de Acessos Acumulados:</span>
                      <span className="font-mono text-white font-extrabold text-sm">{totalClientScans}</span>
                    </div>
                  </div>

                  {/* Assigned Plaques List */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-300">
                      Placas Deste Cliente:
                    </span>
                    {clientPlaques.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Nenhuma placa vinculada ainda.
                      </p>
                    ) : (
                      <div className="divide-y divide-[#16243f] rounded-2xl bg-[#070d1a] border border-[#1b2f52] overflow-hidden">
                        {clientPlaques.map((plaque) => {
                          const badge = getDestinationBadge(plaque.targetType);
                          const BadgeIcon = badge.icon;

                          return (
                            <div
                              key={plaque.id}
                              className="p-3 flex items-center justify-between gap-2 text-xs hover:bg-[#0e192f] transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-white truncate flex items-center gap-1.5">
                                  <span>{plaque.title}</span>
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${badge.color}`}>
                                    <BadgeIcon className="w-2.5 h-2.5" />
                                    <span>{badge.label}</span>
                                  </span>
                                </div>
                                <div className="font-mono text-[11px] text-slate-400 truncate mt-0.5">
                                  /r/{plaque.slug} · {plaque.totalNfcScans} NFC / {plaque.totalQrScans} QR
                                </div>
                              </div>

                              <button
                                onClick={() => onSelectPlaqueForEdit(plaque)}
                                className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-bold border border-blue-500/30 shrink-0 transition-colors flex items-center gap-1.5"
                                title="Trocar destino desta placa"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Trocar Destino</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Cadastrar Nova Empresa / Cliente */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0b1528] border border-[#1b2f52] rounded-3xl p-6 flex flex-col gap-4 shadow-2xl shadow-blue-950/60">
            <div>
              <h2 className="font-heading text-lg font-bold text-white">
                Cadastrar Empresa / Cliente
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Os dados são salvos no Supabase com persistência permanente e não se perdem após atualizar a página.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-700 text-xs text-red-200 flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateClientSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-300 font-bold">
                  Nome da Empresa ou Estabelecimento:
                </label>
                <input
                  type="text"
                  required
                  value={clientForm.companyName}
                  onChange={(e) => setClientForm({ ...clientForm, companyName: e.target.value })}
                  placeholder="Ex: Restaurante Bom Sabor, Barbearia VIP..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 mt-1 font-medium"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold">
                  Nome do Responsável / Contato (Opcional):
                </label>
                <input
                  type="text"
                  value={clientForm.fullName}
                  onChange={(e) => setClientForm({ ...clientForm, fullName: e.target.value })}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold">
                  E-mail de Contato (Opcional):
                </label>
                <input
                  type="text"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  placeholder="contato@empresa.com.br"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold">
                  Telefone / WhatsApp (Opcional):
                </label>
                <input
                  type="text"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  placeholder="(DDD) 99999-9999"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-950 transition-all disabled:opacity-50"
                >
                  {saving ? 'Gravando no Supabase...' : 'Confirmar Cadastro da Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Emitir Nova Placa */}
      {showNewPlaqueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0b1528] border border-[#1b2f52] rounded-3xl p-6 flex flex-col gap-4 shadow-2xl shadow-blue-950/60">
            <h2 className="font-heading text-lg font-bold text-white">
              Emitir Nova Placa Inteligente
            </h2>
            <form onSubmit={handleCreatePlaqueSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-300 font-bold">Cliente Proprietário:</label>
                <select
                  value={plaqueForm.clientId}
                  onChange={(e) => setPlaqueForm({ ...plaqueForm, clientId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
                >
                  {clientUsers.length === 0 ? (
                    <option value={users[0]?.id}>Administrador Central</option>
                  ) : (
                    clientUsers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} {c.companyName ? `(${c.companyName})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold">Identificação da Placa:</label>
                <input
                  type="text"
                  required
                  value={plaqueForm.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoSlug = val
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '');
                    setPlaqueForm({ ...plaqueForm, title: val, slug: autoSlug });
                  }}
                  placeholder="Ex: Placa Balcão Principal"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold">Slug do Link Permanente (/r/... e /q/...):</label>
                <div className="flex items-center rounded-xl bg-[#070d1a] border border-[#1b2f52] px-3.5 mt-1 focus-within:border-blue-500">
                  <span className="text-xs text-slate-400 font-mono">/r/</span>
                  <input
                    type="text"
                    required
                    value={plaqueForm.slug}
                    onChange={(e) => setPlaqueForm({ ...plaqueForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
                    placeholder="identificador-da-placa"
                    className="w-full px-1.5 py-2.5 bg-transparent text-sm text-white font-mono focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  Link permanente exclusivo; nunca precisará ser alterado fisicamente na placa.
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold">Tipo de Destino:</label>
                <select
                  value={plaqueForm.targetType}
                  onChange={(e) => setPlaqueForm({ ...plaqueForm, targetType: e.target.value as TargetType })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
                >
                  <option value="google_review">Google Avaliações</option>
                  <option value="instagram">Instagram</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="custom">Qualquer URL / Site</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold">URL de Destino:</label>
                <input
                  type="url"
                  required
                  value={plaqueForm.targetUrl}
                  onChange={(e) => setPlaqueForm({ ...plaqueForm, targetUrl: e.target.value })}
                  placeholder="https://g.page/r/... ou https://instagram.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 mt-1 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewPlaqueModal(false)}
                  className="px-4 py-2.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-950 transition-all"
                >
                  {saving ? 'Gravando...' : 'Emitir Placa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
