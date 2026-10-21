import React, { useState } from 'react';
import { X, Check, Globe, MessageSquare, Instagram, Star, Utensils, Link2, ExternalLink } from 'lucide-react';
import { Plaque, TargetType } from '../types';

interface PlaqueEditorModalProps {
  plaque: Plaque;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    plaqueId: string,
    targetType: TargetType,
    targetUrl: string,
    targetParams?: Plaque['targetParams']
  ) => Promise<void>;
}

export const PlaqueEditorModal: React.FC<PlaqueEditorModalProps> = ({
  plaque,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [selectedType, setSelectedType] = useState<TargetType>(plaque.targetType);
  const [customUrl, setCustomUrl] = useState(plaque.targetUrl);
  
  // Specific preset state helpers
  const [waPhone, setWaPhone] = useState(plaque.targetParams?.whatsappNumber || '5511999998888');
  const [waMessage, setWaMessage] = useState(
    plaque.targetParams?.whatsappMessage || 'Olá! Vi a placa no balcão e gostaria de atendimento.'
  );
  const [instaHandle, setInstaHandle] = useState(
    plaque.targetParams?.instagramHandle || 'bistroroyal'
  );
  const [googleReviewLink, setGoogleReviewLink] = useState(
    plaque.targetType === 'google_review' ? plaque.targetUrl : 'https://g.page/r/Cbistro-royal/review'
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute live target URL
  const computeComputedUrl = (): string => {
    switch (selectedType) {
      case 'whatsapp': {
        const cleanPhone = waPhone.replace(/\D/g, '');
        const encodedMsg = encodeURIComponent(waMessage.trim());
        return `https://wa.me/${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
      }
      case 'instagram': {
        const cleanHandle = instaHandle.replace('@', '').trim();
        return `https://instagram.com/${cleanHandle}`;
      }
      case 'google_review': {
        return googleReviewLink.trim();
      }
      case 'menu':
      case 'website':
      case 'custom':
      default:
        return customUrl.trim();
    }
  };

  const computedUrl = computeComputedUrl();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!computedUrl) {
      setError('Por favor, defina uma URL válida de destino.');
      return;
    }

    try {
      new URL(computedUrl);
    } catch {
      setError('A URL calculada é inválida. Certifique-se de incluir http:// ou https://');
      return;
    }

    setSaving(true);
    try {
      await onSave(plaque.id, selectedType, computedUrl, {
        whatsappNumber: selectedType === 'whatsapp' ? waPhone : undefined,
        whatsappMessage: selectedType === 'whatsapp' ? waMessage : undefined,
        instagramHandle: selectedType === 'instagram' ? instaHandle : undefined,
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
      type: 'google_review' as TargetType,
      label: 'Google Avaliações',
      desc: 'Direto para tela de 5 estrelas do Google Meu Negócio',
      icon: Star,
      iconColor: 'text-amber-400',
    },
    {
      type: 'whatsapp' as TargetType,
      label: 'WhatsApp',
      desc: 'Abre conversa com mensagem inicial personalizada',
      icon: MessageSquare,
      iconColor: 'text-emerald-400',
    },
    {
      type: 'instagram' as TargetType,
      label: 'Instagram',
      desc: 'Abre perfil oficial da sua loja no app do Instagram',
      icon: Instagram,
      iconColor: 'text-pink-400',
    },
    {
      type: 'menu' as TargetType,
      label: 'Cardápio Digital',
      desc: 'Cardápio em PDF, catálogo online ou app de pedidos',
      icon: Utensils,
      iconColor: 'text-sky-400',
    },
    {
      type: 'website' as TargetType,
      label: 'Site / Linktree',
      desc: 'Página institucional ou agregador de links',
      icon: Globe,
      iconColor: 'text-purple-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#27272a] flex items-center justify-between sticky top-0 bg-[#121214] z-10">
          <div>
            <span className="text-xs text-red-500 font-semibold tracking-wider uppercase">
              Link Permanente: /r/{plaque.slug}
            </span>
            <h2 className="font-heading text-lg font-bold text-white">
              Alterar Destino da Placa
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#1f1f23] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 flex flex-col gap-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Preset Buttons Grid */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">
              Escolha o Tipo de Destino:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedType === preset.type;
                return (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => setSelectedType(preset.type)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#1c1c22] border-red-500/80 shadow-md shadow-red-950/20'
                        : 'bg-[#0e0e10] border-[#27272a] hover:border-zinc-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${preset.iconColor}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        {preset.label}
                        {isSelected && <Check className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                        {preset.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Specific Inputs */}
          <div className="p-3.5 rounded-xl bg-[#0a0a0c] border border-[#27272a] flex flex-col gap-3">
            {selectedType === 'whatsapp' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-300 font-medium">
                    Número do WhatsApp (com DDI e DDD):
                  </label>
                  <input
                    type="text"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="Ex: 5511999998888"
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-white focus:outline-none focus:border-red-500"
                    required
                  />
                  <span className="text-[10px] text-zinc-400">
                    Insira somente números (55 para Brasil + DDD + Telefone).
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-300 font-medium">
                    Mensagem Inicial Pronta:
                  </label>
                  <textarea
                    rows={2}
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    placeholder="Ex: Olá! Encostei na placa NFC e gostaria de atendimento."
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-white focus:outline-none focus:border-red-500 resize-none"
                  />
                </div>
              </>
            )}

            {selectedType === 'instagram' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-300 font-medium">
                  Usuário do Instagram:
                </label>
                <div className="flex items-center rounded-lg bg-[#18181b] border border-[#27272a] px-3 focus-within:border-red-500">
                  <span className="text-zinc-500 text-sm">@</span>
                  <input
                    type="text"
                    value={instaHandle}
                    onChange={(e) => setInstaHandle(e.target.value)}
                    placeholder="bistroroyal"
                    className="w-full px-2 py-2 bg-transparent text-sm text-white focus:outline-none"
                    required
                  />
                </div>
              </div>
            )}

            {selectedType === 'google_review' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-300 font-medium">
                  Link Direto de Avaliação Google:
                </label>
                <input
                  type="url"
                  value={googleReviewLink}
                  onChange={(e) => setGoogleReviewLink(e.target.value)}
                  placeholder="https://g.page/r/.../review"
                  className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-white focus:outline-none focus:border-red-500"
                  required
                />
                <span className="text-[10px] text-zinc-400">
                  Dica: No Google Meu Negócio, clique em "Pedir Avaliações" e copie o link direto.
                </span>
              </div>
            )}

            {(selectedType === 'menu' || selectedType === 'website' || selectedType === 'custom') && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-300 font-medium">
                  URL de Destino Completa:
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://seusite.com.br/cardapio"
                  className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            )}

            {/* Live Destination Preview */}
            <div className="pt-2 border-t border-[#1f1f23]">
              <span className="text-[11px] text-zinc-400 font-medium">
                URL Final de Redirecionamento:
              </span>
              <div className="mt-1 flex items-center justify-between gap-2 p-2 rounded bg-[#121214] border border-[#27272a]">
                <span className="text-xs font-mono text-zinc-300 truncate">
                  {computedUrl || 'Nenhuma URL definida'}
                </span>
                {computedUrl && (
                  <a
                    href={computedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Testar link em nova aba"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-transparent hover:bg-[#1f1f23] text-zinc-400 hover:text-white text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold text-xs transition-all shadow-lg shadow-red-950/40 disabled:opacity-50"
            >
              {saving ? 'Gravando Alteração...' : 'Salvar Novo Destino'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
