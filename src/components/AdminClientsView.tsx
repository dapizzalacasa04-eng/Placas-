import React, { useState } from 'react';
import { Users, Plus, ShieldCheck, Smartphone, Layers, Check, AlertCircle } from 'lucide-react';
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
    targetUrl: 'https://g.page/r/.../review',
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
        targetUrl: 'https://g.page/r/.../review',
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
    <div className="flex flex-col gap-6 pb-24 max-w-5xl mx-auto px-4 pt-4 sm:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
            Gestão GoldFlow Master
          </span>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-white">
            Clientes e Placas Vinculadas
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gerenciamento completo de estabelecimentos, limites e emissão de novas placas
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewPlaqueModal(true)}
            className="py-2 px-3 rounded-xl bg-[#1c1c20] hover:bg-[#27272e] text-zinc-100 text-xs font-semibold flex items-center gap-1.5 border border-[#27272a] transition-all"
          >
            <Plus className="w-4 h-4 text-red-500" />
            <span>Emitir Nova Placa</span>
          </button>

          <button
            onClick={() => setShowNewClientModal(true)}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-red-950/40 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Cliente</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
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
              className="rounded-2xl bg-[#121214] border border-[#27272a] p-5 flex flex-col gap-4 shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-base text-white truncate">
                    {client.companyName}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Responsável: <span className="text-zinc-200">{client.fullName}</span>
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-950/60 text-red-300 border border-red-900/60 shrink-0">
                  {clientPlaques.length} Placa(s)
                </span>
              </div>

              {/* Contact details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 bg-[#0a0a0c] p-3 rounded-xl border border-[#27272a]">
                <div>
                  <span className="text-[10px] uppercase text-zinc-400">E-mail:</span>
                  <div className="text-zinc-200 truncate">{client.email}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-zinc-400">WhatsApp:</span>
                  <div className="text-zinc-200 truncate">{client.phone}</div>
                </div>
                <div className="col-span-2 pt-1 border-t border-[#1f1f23] flex items-center justify-between">
                  <span className="text-zinc-400">Total de Acessos Acumulados:</span>
                  <span className="font-mono text-white font-bold">{totalClientScans}</span>
                </div>
              </div>

              {/* Assigned Plaques List */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-zinc-300">
                  Placas Ativas Deste Cliente:
                </span>
                {clientPlaques.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">
                    Nenhuma placa vinculada ainda.
                  </p>
                ) : (
                  <div className="divide-y divide-[#1f1f23] rounded-xl bg-[#0a0a0c] border border-[#27272a] overflow-hidden">
                    {clientPlaques.map((plaque) => (
                      <div
                        key={plaque.id}
                        className="p-2.5 flex items-center justify-between gap-2 text-xs hover:bg-[#16161a] transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-white truncate">
                            {plaque.title}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-400 truncate">
                            /r/{plaque.slug} · {plaque.totalNfcScans} NFC / {plaque.totalQrScans} QR
                          </div>
                        </div>

                        <button
                          onClick={() => onSelectPlaqueForEdit(plaque)}
                          className="px-2 py-1 rounded bg-[#1e1e24] text-zinc-200 hover:text-white text-[11px] font-medium border border-[#27272a] shrink-0"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-2xl p-5 flex flex-col gap-4 shadow-2xl">
            <h2 className="font-heading text-lg font-bold text-white">
              Cadastrar Novo Cliente GoldFlow
            </h2>
            <form onSubmit={handleCreateClientSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-zinc-300 font-medium">Nome da Empresa / Ponto:</label>
                <input
                  type="text"
                  required
                  value={clientForm.companyName}
                  onChange={(e) => setClientForm({ ...clientForm, companyName: e.target.value })}
                  placeholder="Ex: Bar do Urso Augusta"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-sm text-white focus:outline-none focus:border-red-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-medium">Nome do Responsável:</label>
                <input
                  type="text"
                  required
                  value={clientForm.fullName}
                  onChange={(e) => setClientForm({ ...clientForm, fullName: e.target.value })}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-sm text-white focus:outline-none focus:border-red-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-medium">E-mail para Login:</label>
                <input
                  type="email"
                  required
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  placeholder="carlos@bardourso.com.br"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-sm text-white focus:outline-none focus:border-red-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-medium">Telefone / WhatsApp:</label>
                <input
                  type="text"
                  required
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  placeholder="(11) 99876-5432"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-sm text-white focus:outline-none focus:border-red-500 mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-2xl p-5 flex flex-col gap-4 shadow-2xl">
            <h2 className="font-heading text-lg font-bold text-white">
              Emitir Nova Placa NFC
            </h2>
            <form onSubmit={handleCreatePlaqueSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-zinc-300 font-medium">Cliente Proprietário:</label>
                <select
                  value={plaqueForm.clientId}
                  onChange={(e) => setPlaqueForm({ ...plaqueForm, clientId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-sm text-white focus:outline-none focus:border-red-500 mt-1"
                >
                  {clientUsers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.fullName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-medium">Título da Placa (Localização Física):</label>
                <input
                  type="text"
                  required
                  value={plaqueForm.title}
                  onChange={(e) => setPlaqueForm({ ...plaqueForm, title: e.target.value })}
                  placeholder="Ex: Totem Entrada Principal"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-sm text-white focus:outline-none focus:border-red-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-medium">Slug do Link Permanente (/r/...):</label>
                <div className="flex items-center rounded-lg bg-[#0a0a0c] border border-[#27272a] px-3 mt-1 focus-within:border-red-500">
                  <span className="text-xs text-zinc-500 font-mono">/r/</span>
                  <input
                    type="text"
                    required
                    value={plaqueForm.slug}
                    onChange={(e) => setPlaqueForm({ ...plaqueForm, slug: e.target.value })}
                    placeholder="bar-do-urso-entrada"
                    className="w-full px-1 py-2 bg-transparent text-sm text-white font-mono focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-zinc-400">
                  Este link será gravado no chip NFC e nunca precisará ser alterado fisicamente.
                </span>
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-medium">URL Inicial de Destino:</label>
                <input
                  type="url"
                  required
                  value={plaqueForm.targetUrl}
                  onChange={(e) => setPlaqueForm({ ...plaqueForm, targetUrl: e.target.value })}
                  placeholder="https://g.page/r/.../review"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-sm text-white focus:outline-none focus:border-red-500 mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewPlaqueModal(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs"
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
