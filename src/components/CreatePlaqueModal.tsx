import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Radio, 
  Check, 
  MessageSquare, 
  Instagram, 
  Star, 
  Utensils, 
  Globe, 
  ArrowRight,
  Sparkles,
  Link2
} from 'lucide-react';
import { Plaque, TargetType, UserProfile } from '../types';

interface CreatePlaqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  clients: UserProfile[];
  onCreatePlaque: (data: {
    clientId: string;
    slug: string;
    title: string;
    targetType: TargetType;
    targetUrl: string;
  }) => Promise<void>;
}

export const CreatePlaqueModal: React.FC<CreatePlaqueModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  clients,
  onCreatePlaque,
}) => {
  if (!isOpen) return null;

  const clientList = clients.filter((u) => u.role === 'client');
  const defaultClientId = currentUser.role === 'admin' 
    ? (clientList[0]?.id || currentUser.id) 
    : currentUser.id;

  const [clientId, setClientId] = useState(defaultClientId);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('whatsapp');
  const [customUrl, setCustomUrl] = useState('');
  
  // Quick presets
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('Olá! Gostaria de mais informações.');
  const [instaHandle, setInstaHandle] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto slugify when title changes if slug was empty or matched previous auto slug
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generated = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(generated);
  };

  const computeFinalTargetUrl = (): string => {
    switch (targetType) {
      case 'whatsapp': {
        const cleanPhone = waPhone.replace(/\D/g, '');
        const encoded = encodeURIComponent(waMessage.trim());
        return `https://wa.me/${cleanPhone}${encoded ? `?text=${encoded}` : ''}`;
      }
      case 'instagram': {
        const clean = instaHandle.replace('@', '').trim();
        return `https://instagram.com/${clean}`;
      }
      case 'google_review': {
        return googleReviewUrl.trim();
      }
      case 'menu':
      case 'website':
      case 'custom':
      default:
        return customUrl.trim() || 'https://google.com';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalSlug = slug.trim().toLowerCase();
    if (!title.trim()) {
      setError('Por favor, informe o nome da placa.');
      return;
    }
    if (!finalSlug) {
      setError('Por favor, informe um identificador curto (slug) para o link.');
      return;
    }

    const finalTargetUrl = computeFinalTargetUrl();
    try {
      new URL(finalTargetUrl);
    } catch {
      setError('O endereço de destino informado é inválido. Inclua http:// ou https://');
      return;
    }

    setSaving(true);
    try {
      await onCreatePlaque({
        clientId,
        slug: finalSlug,
        title: title.trim(),
        targetType,
        targetUrl: finalTargetUrl,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const presets = [
    {
      type: 'whatsapp' as TargetType,
      label: 'WhatsApp',
      desc: 'Conversa direta com mensagem',
      icon: MessageSquare,
      color: 'text-emerald-400',
    },
    {
      type: 'google_review' as TargetType,
      label: 'Google Avaliações',
      desc: 'Link de 5 estrelas do Google',
      icon: Star,
      color: 'text-amber-400',
    },
    {
      type: 'instagram' as TargetType,
      label: 'Instagram',
      desc: 'Abre o perfil da loja no app',
      icon: Instagram,
      color: 'text-pink-400',
    },
    {
      type: 'menu' as TargetType,
      label: 'Cardápio / Site',
      desc: 'Catálogo online ou site oficial',
      icon: Utensils,
      color: 'text-sky-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-xl bg-[#0b1528] border border-[#1e355b] rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl shadow-blue-950/60">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#1b2f52] flex items-center justify-between sticky top-0 bg-[#0b1528] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Plus className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                Novo Display Inteligente
              </span>
              <h2 className="font-heading text-xl font-bold text-white">
                Cadastrar Nova Placa NFC
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#15274d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-5">
          {error && (
            <div className="p-4 rounded-2xl bg-red-950/70 border border-red-800 text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Admin Client Selector */}
          {currentUser.role === 'admin' && clientList.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-200">
                Cliente / Loja Proprietária:
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {clientList.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0b1528]">
                    {c.fullName} {c.companyName && c.companyName !== c.fullName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 1: Plaque Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">1</span>
              <span>Nome do Local ou Display Físico:</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ex: Totem Entrada, Mesa 01, Balcão Principal..."
              className="w-full px-4 py-3 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 font-medium placeholder:text-slate-500"
            />
          </div>

          {/* Auto Slug identifier */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">2</span>
              <span>Link Fixo Permanente Gerado:</span>
            </label>
            <div className="flex items-center rounded-2xl bg-[#070d1a] border border-[#1b2f52] px-3.5 focus-within:border-blue-500">
              <span className="text-slate-400 font-mono text-xs">/r/</span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                placeholder="nome-do-ponto"
                className="w-full px-1.5 py-3 bg-transparent text-sm text-white font-mono focus:outline-none"
              />
            </div>
            <span className="text-[11px] text-slate-400">
              Este é o endereço que será gravado no chip NFC e nunca precisará ser alterado.
            </span>
          </div>

          {/* Step 3: Destination Preset */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">3</span>
              <span>Escolha o Destino Inicial:</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = targetType === preset.type;
                return (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => setTargetType(preset.type)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-400 shadow-md shadow-blue-950/40 ring-1 ring-blue-400'
                        : 'bg-[#070d1a] border-[#1b2f52] hover:border-slate-500'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${preset.color}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{preset.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                      <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                        {preset.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Destination inputs */}
          <div className="p-4 rounded-2xl bg-[#070d1a] border border-[#1b2f52] flex flex-col gap-3">
            {targetType === 'whatsapp' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Número do WhatsApp (com DDD):
                  </label>
                  <input
                    type="text"
                    required
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="5511999998888"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1528] border border-[#1b2f52] text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Mensagem de abertura:
                  </label>
                  <input
                    type="text"
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    placeholder="Olá! Vi a placa na mesa e gostaria de atendimento."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1528] border border-[#1b2f52] text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            )}

            {targetType === 'google_review' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Link de Avaliações Google:
                </label>
                <input
                  type="url"
                  required
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://g.page/r/.../review"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1528] border border-[#1b2f52] text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {targetType === 'instagram' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Usuário do Instagram:
                </label>
                <div className="flex items-center rounded-xl bg-[#0b1528] border border-[#1b2f52] px-3 focus-within:border-blue-500">
                  <span className="text-slate-400 font-bold text-sm">@</span>
                  <input
                    type="text"
                    required
                    value={instaHandle}
                    onChange={(e) => setInstaHandle(e.target.value)}
                    placeholder="minhaloja"
                    className="w-full px-1.5 py-2.5 bg-transparent text-sm text-white font-mono focus:outline-none"
                  />
                </div>
              </div>
            )}

            {targetType === 'menu' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Endereço do Cardápio ou Site:
                </label>
                <input
                  type="url"
                  required
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://cardapio.minhaloja.com.br"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1528] border border-[#1b2f52] text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div className="pt-2 border-t border-[#16243f] text-[11px] text-slate-400">
              Destino calculado: <span className="font-mono text-blue-400">{computeFinalTargetUrl()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="py-3 px-5 rounded-2xl bg-transparent hover:bg-[#15274d] text-slate-300 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-950/60 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Criando Placa...' : 'Cadastrar Placa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
