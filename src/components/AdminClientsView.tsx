import React, { useState } from 'react';
import { Users, Plus, ShieldCheck, Smartphone, Layers, Check, AlertCircle, Building2 } from 'lucide-react';
import { Plaque, UserProfile } from '../types';

interface AdminClientsViewProps {
  users: UserProfile[];
  plaques: Plaque[];
  onCreateClient: (data: {
    email: string;
    fullName: string;
    companyName: string;
    phone: string;
  }) => Promise<void>;
  onCreatePlaque: (data: {
    clientId: string;
    slug: string;
    title: string;
    targetType: Plaque['targetType'];
    targetUrl: string;
  }) => Promise<void>;
  onSelectPlaqueForEdit: (plaque: Plaque) => void;
}

export const AdminClientsView: React.FC<AdminClientsViewProps> = ({
  users,
  plaques,
  onCreateClient,
  onCreatePlaque,
  onSelectPlaqueForEdit,
}) => {
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showNewPlaqueModal, setShowNewPlaqueModal] = useState(false);

  // New Client Form
  const [clientForm, setClientForm] = useState({
    email: '',
    fullName: '',
    companyName: '',
    phone: '',
  });

  // New Plaque Form
  const [plaqueForm, setPlaqueForm] = useState({
    clientId: users.find((u) => u.role === 'client')?.id || '',
    slug: '',
    title: '',
    targetType: 'google_review' as Plaque['targetType'],
    targetUrl: 'https://g.page/r/Cbistro-royal/review',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clientUsers = users.filter((u) => u.role === 'client');

  const handleCreateClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onCreateClient(clientForm);
      setSuccess(`Cliente ${clientForm.companyName} cadastrado com sucesso!`);
      setClientForm({ email: '', fullName: '', companyName: '', phone: '' });
      setShowNewClientModal(false);
      setTimeout(() => setSuccess(null), 3000);
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
    setSaving(true);
    try {
      await onCreatePlaque(plaqueForm);
      setSuccess(`Placa /r/${plaqueForm.slug} cadastrada e vinculada com sucesso!`);
      setPlaqueForm({
        clientId: clientUsers[0]?.id || '',
        slug: '',
        title: '',
        targetType: 'google_review',
        targetUrl: 'https://g.page/r/Cbistro-royal/review',
      });
      setShowNewPlaqueModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-28 max-w-5xl mx-auto px-4 pt-4 sm:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Painel do Administrador GoldFlow
          </span>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-white">
            Clientes & Lojas Cadastradas
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie estabelecimentos, permissões isoladas (RLS) e emita novas placas
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
            <span>Cadastrar Cliente</span>
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

      {/* Clients Card List */}
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
                    {client.companyName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Responsável: <span className="text-slate-200 font-semibold">{client.fullName}</span>
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800 shrink-0">
                  {clientPlaques.length} Placa(s)
                </span>
              </div>

              {/* Contact details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-[#070d1a] p-3.5 rounded-2xl border border-[#1b2f52]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">E-mail:</span>
                  <div className="text-slate-200 font-semibold truncate mt-0.5">{client.email}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">WhatsApp:</span>
                  <div className="text-slate-200 font-semibold truncate mt-0.5">{client.phone}</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-[#16243f] flex items-center justify-between">
                  <span className="text-slate-400">Total de Acessos Acumulados:</span>
                  <span className="font-mono text-white font-extrabold text-sm">{totalClientScans}</span>
                </div>
              </div>

              {/* Assigned Plaques List */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-300">
                  Placas Ativas Deste Cliente:
                </span>
                {clientPlaques.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Nenhuma placa vinculada ainda.
                  </p>
                ) : (
                  <div className="divide-y divide-[#16243f] rounded-2xl bg-[#070d1a] border border-[#1b2f52] overflow-hidden">
                    {clientPlaques.map((plaque) => (
                      <div
                        key={plaque.id}
                        className="p-3 flex items-center justify-between gap-2 text-xs hover:bg-[#0e192f] transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">
                            {plaque.title}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400 truncate">
                            /r/{plaque.slug} · {plaque.totalNfcScans} NFC / {plaque.totalQrScans} QR
                          </div>
                        </div>

                        <button
                          onClick={() => onSelectPlaqueForEdit(plaque)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-bold border border-blue-500/30 shrink-0 transition-colors"
                        >
                          Gerenciar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Cadastrar Novo Cliente */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0b1528] border border-[#1b2f52] rounded-3xl p-6 flex flex-col gap-4 shadow-2xl shadow-blue-950/60">
            <h2 className="font-heading text-lg font-bold text-white">
              Cadastrar Novo Cliente GoldFlow
            </h2>
            <form onSubmit={handleCreateClientSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-300 font-bold">Nome da Empresa / Ponto:</label>
                <input
                  type="text"
                  required
                  value={clientForm.companyName}
                  onChange={(e) => setClientForm({ ...clientForm, companyName: e.target.value })}
                  placeholder="Ex: Bar do Urso Augusta"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold">Nome do Responsável:</label>
                <input
                  type="text"
                  required
                  value={clientForm.fullName}
                  onChange={(e) => setClientForm({ ...clientForm, fullName: e.target.value })}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold">E-mail para Acesso:</label>
                <input
                  type="email"
                  required
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  placeholder="carlos@bardourso.com.br"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold">Telefone / WhatsApp:</label>
                <input
                  type="text"
                  required
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  placeholder="(11) 99876-5432"
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-950 transition-all"
                >
                  {saving ? 'Cadastrando...' : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Emitir Nova Placa */}
      {showNewPlaqueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0b1528] border border-[#1b2f52] rounded-3xl p-6 flex flex-col gap-4 shadow-2xl shadow-blue-950/60">
            <h2 className="font-heading text-lg font-bold text-white">
              Emitir Nova Placa NFC
            </h2>
            <form onSubmit={handleCreatePlaqueSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-300 font-bold">Cliente Proprietário:</label>
                <select
                  value={plaqueForm.clientId}
                  onChange={(e) => setPlaqueForm({ ...plaqueForm, clientId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
                >
                  {clientUsers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.fullName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold">Título da Placa (Localização Física):</label>
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
                  placeholder="Ex: Totem Entrada Principal"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold">Slug do Link Permanente (/r/...):</label>
                <div className="flex items-center rounded-xl bg-[#070d1a] border border-[#1b2f52] px-3 mt-1 focus-within:border-blue-500">
                  <span className="text-xs text-slate-400 font-mono">/r/</span>
                  <input
                    type="text"
                    required
                    value={plaqueForm.slug}
                    onChange={(e) => setPlaqueForm({ ...plaqueForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
                    placeholder="bar-do-urso-entrada"
                    className="w-full px-1.5 py-2.5 bg-transparent text-sm text-white font-mono focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  Gravado no chip NFC; nunca precisará ser alterado fisicamente.
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold">URL Inicial de Destino:</label>
                <input
                  type="url"
                  required
                  value={plaqueForm.targetUrl}
                  onChange={(e) => setPlaqueForm({ ...plaqueForm, targetUrl: e.target.value })}
                  placeholder="https://g.page/r/.../review"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
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
