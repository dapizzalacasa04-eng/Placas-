import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Globe, 
  MessageSquare, 
  Instagram, 
  Star, 
  Utensils, 
  Link2, 
  ExternalLink, 
  Radio, 
  QrCode,
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { Plaque, TargetType } from '../types';

interface PlaqueEditorModalProps {
  plaque: Plaque;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    plaqueId: string,
    targetType: TargetType,
    targetUrl: string,
    targetParams?: Plaque['targetParams'],
    applyScope?: 'both' | 'nfc' | 'qr'
  ) => Promise<void>;
}

export const PlaqueEditorModal: React.FC<PlaqueEditorModalProps> = ({
  plaque,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [selectedType, setSelectedType] = useState<TargetType>(plaque.targetType || 'google_review');
  const [customUrl, setCustomUrl] = useState(
    plaque.targetType === 'menu' || plaque.targetType === 'website' || plaque.targetType === 'custom'
      ? plaque.targetUrl
      : 'https://'
  );
  
  // Specific preset state helpers
  const [waPhone, setWaPhone] = useState(plaque.targetParams?.whatsappNumber || '5511999998888');
  const [waMessage, setWaMessage] = useState(
    plaque.targetParams?.whatsappMessage || 'Olá! Vi a placa GoldFlow e gostaria de atendimento.'
  );
  const [instaHandle, setInstaHandle] = useState(
    plaque.targetParams?.instagramHandle || ''
  );
  const [googleReviewLink, setGoogleReviewLink] = useState(
    plaque.targetType === 'google_review' ? plaque.targetUrl : ''
  );

  // Scope: both (NFC + QR Code), nfc only, or qr only
  const [applyScope, setApplyScope] = useState<'both' | 'nfc' | 'qr'>('both');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute live target URL based on selected model
  const computeComputedUrl = (): string => {
    switch (selectedType) {
      case 'google_review': {
        return googleReviewLink.trim();
      }
      case 'instagram': {
        const cleanHandle = instaHandle.replace('@', '').trim();
        return cleanHandle ? `https://instagram.com/${cleanHandle}` : '';
      }
      case 'whatsapp': {
        const cleanPhone = waPhone.replace(/\D/g, '');
        const encodedMsg = encodeURIComponent(waMessage.trim());
        return cleanPhone ? `https://wa.me/${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}` : '';
      }
      case 'menu':
      case 'website':
      case 'custom':
      default: {
        return customUrl.trim();
      }
    }
  };

  const computedUrl = computeComputedUrl();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let finalUrl = computedUrl.trim();
    if (!finalUrl) {
      setError('Por favor, defina o endereço de destino correspondente.');
      return;
    }

    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }

    try {
      new URL(finalUrl);
    } catch {
      setError('A URL informada é inválida. Certifique-se de incluir http:// ou https://');
      return;
    }

    setSaving(true);
    try {
      await onSave(
        plaque.id,
        selectedType,
        finalUrl,
        {
          whatsappNumber: selectedType === 'whatsapp' ? waPhone : undefined,
          whatsappMessage: selectedType === 'whatsapp' ? waMessage : undefined,
          instagramHandle: selectedType === 'instagram' ? instaHandle : undefined,
        },
        applyScope
      );
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
      badge: '5 Estrelas',
      desc: 'Direciona direto para deixar nota 5 no Google Meu Negócio',
      icon: Star,
      iconColor: 'text-amber-400',
      activeBorder: 'border-amber-400 ring-amber-400/30',
      activeBg: 'bg-amber-950/20',
    },
    {
      type: 'instagram' as TargetType,
      label: 'Instagram',
      badge: '@perfil',
      desc: 'Abre o perfil oficial da sua empresa no app do Instagram',
      icon: Instagram,
      iconColor: 'text-pink-400',
      activeBorder: 'border-pink-400 ring-pink-400/30',
      activeBg: 'bg-pink-950/20',
    },
    {
      type: 'whatsapp' as TargetType,
      label: 'WhatsApp',
      badge: 'Mensagem',
      desc: 'Inicia conversa direta com mensagem pronta para envio',
      icon: MessageSquare,
      iconColor: 'text-emerald-400',
      activeBorder: 'border-emerald-400 ring-emerald-400/30',
      activeBg: 'bg-emerald-950/20',
    },
    {
      type: 'custom' as TargetType,
      label: 'Qualquer URL / Link',
      badge: 'Personalizado',
      desc: 'Insira qualquer endereço: Cardápio, Site, Catálogo ou Linktree',
      icon: Globe,
      iconColor: 'text-blue-400',
      activeBorder: 'border-blue-400 ring-blue-400/30',
      activeBg: 'bg-blue-950/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-xl bg-[#0b1528] border border-[#1e355b] rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl shadow-blue-950/60">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#1b2f52] flex items-center justify-between sticky top-0 bg-[#0b1528] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-blue-400 font-extrabold uppercase tracking-wider block">
                  Placa: {plaque.title}
                </span>
                {plaque.clientName && (
                  <span className="text-[10px] text-slate-400 bg-[#070d1a] px-2 py-0.5 rounded-full border border-[#1b2f52]">
                    {plaque.clientName}
                  </span>
                )}
              </div>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-white">
                Trocar Destino da Placa
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

        {/* Permanent Links Notice Banner */}
        <div className="mx-5 sm:mx-6 mt-5 p-3.5 rounded-2xl bg-[#070d1a] border border-blue-900/40 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Links Permanentes Gravados na Placa (Nunca Mudam):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="bg-[#0b1528] px-2.5 py-1.5 rounded-xl border border-[#1b2f52] text-slate-300 flex items-center justify-between">
              <span className="truncate">NFC: /r/{plaque.slug}</span>
              <span className="text-[9px] text-blue-400 font-sans font-bold uppercase">Chip</span>
            </div>
            <div className="bg-[#0b1528] px-2.5 py-1.5 rounded-xl border border-[#1b2f52] text-slate-300 flex items-center justify-between">
              <span className="truncate">QR: /q/{plaque.slug}</span>
              <span className="text-[9px] text-blue-400 font-sans font-bold uppercase">Impresso</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            A troca de destino ocorre 100% na nuvem (Supabase). O QR Code impresso e o chip NFC continuam funcionando perfeitamente sem necessidade de reimprimir ou regravar a placa.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 flex flex-col gap-5">
          {error && (
            <div className="p-4 rounded-2xl bg-red-950/70 border border-red-800 text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Passo 1: Escolha do Modelo */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">1</span>
              <span>Escolha o tipo de destino:</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {presets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedType === preset.type;
                return (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => setSelectedType(preset.type)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? `${preset.activeBg} ${preset.activeBorder} shadow-lg shadow-blue-950/40 ring-1`
                        : 'bg-[#070d1a] border-[#1b2f52] hover:border-slate-500'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${preset.iconColor}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white flex items-center justify-between gap-1">
                        <span>{preset.label}</span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        ) : (
                          <span className="text-[10px] text-slate-400">{preset.badge}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        {preset.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Passo 2: Configuração dos Dados */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-[#1b2f52] flex flex-col gap-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">2</span>
              <span>Preencha as informações do novo destino:</span>
            </div>

            {selectedType === 'google_review' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-300 font-bold flex items-center justify-between">
                  <span>Link Direto de Avaliações Google (5 Estrelas):</span>
                </label>
                <input
                  type="url"
                  value={googleReviewLink}
                  onChange={(e) => setGoogleReviewLink(e.target.value)}
                  placeholder="https://g.page/r/.../review ou https://search.google.com/local/writereview?..."
                  className="w-full px-4 py-3 rounded-2xl bg-[#0b1528] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
                <span className="text-[11px] text-slate-400">
                  Dica: No perfil da empresa no Google, clique em &quot;Solicitar avaliações&quot; e cole o link curto gerado.
                </span>
              </div>
            )}

            {selectedType === 'instagram' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-300 font-bold">
                  Nome de usuário no Instagram:
                </label>
                <div className="flex items-center rounded-2xl bg-[#0b1528] border border-[#1b2f52] px-4 focus-within:border-blue-500">
                  <span className="text-slate-400 font-bold text-sm">@</span>
                  <input
                    type="text"
                    value={instaHandle}
                    onChange={(e) => setInstaHandle(e.target.value)}
                    placeholder="sualoja"
                    className="w-full px-2 py-3 bg-transparent text-sm text-white focus:outline-none font-mono"
                    required
                  />
                </div>
                <span className="text-[11px] text-slate-400">
                  Ao aproximar o celular ou escanear, o app do Instagram abrirá o perfil automaticamente.
                </span>
              </div>
            )}

            {selectedType === 'whatsapp' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-300 font-bold">
                    Telefone WhatsApp (com DDI e DDD):
                  </label>
                  <input
                    type="text"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="Ex: 5511999998888"
                    className="w-full px-4 py-3 rounded-2xl bg-[#0b1528] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                  <span className="text-[11px] text-slate-400">
                    Apenas números: código do país (55 para Brasil) + DDD + Telefone.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-300 font-bold">
                    Mensagem inicial pré-digitada para o cliente:
                  </label>
                  <textarea
                    rows={2}
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    placeholder="Ex: Olá! Vi a placa na mesa e gostaria de atendimento."
                    className="w-full px-4 py-3 rounded-2xl bg-[#0b1528] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </>
            )}

            {(selectedType === 'custom' || selectedType === 'menu' || selectedType === 'website') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-300 font-bold">
                  Endereço do Site, Cardápio ou Linktree:
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://seusite.com.br/cardapio"
                  className="w-full px-4 py-3 rounded-2xl bg-[#0b1528] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
                <span className="text-[11px] text-slate-400">
                  Aceita qualquer endereço externo com https:// ou http://
                </span>
              </div>
            )}

            {/* Live Preview */}
            <div className="pt-2 border-t border-[#16243f]">
              <span className="text-[11px] text-slate-400 font-medium">
                URL Calculada de Redirecionamento Direto:
              </span>
              <div className="mt-1 flex items-center justify-between gap-2 p-3 rounded-xl bg-[#0b1528] border border-[#1b2f52]">
                <span className="text-xs font-mono text-slate-200 truncate">
                  {computedUrl || 'Nenhum endereço informado ainda'}
                </span>
                {computedUrl && (
                  <a
                    href={computedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 p-1 shrink-0"
                    title="Testar endereço de destino em nova aba"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Passo 3: Escopo de Aplicação (NFC + QR Code) */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">3</span>
              <span>Aonde deseja aplicar este novo destino?</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setApplyScope('both')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                  applyScope === 'both'
                    ? 'bg-blue-600/20 border-blue-400 text-white ring-1 ring-blue-400 shadow-md'
                    : 'bg-[#070d1a] border-[#1b2f52] text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Ambos (NFC + QR)
                  </span>
                  {applyScope === 'both' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <p className="text-[10px] text-slate-400">
                  Unifica chip e QR impresso no mesmo destino
                </p>
              </button>

              <button
                type="button"
                onClick={() => setApplyScope('nfc')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                  applyScope === 'nfc'
                    ? 'bg-blue-600/20 border-blue-400 text-white ring-1 ring-blue-400 shadow-md'
                    : 'bg-[#070d1a] border-[#1b2f52] text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-400" />
                    Apenas Chip NFC
                  </span>
                  {applyScope === 'nfc' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <p className="text-[10px] text-slate-400">
                  Aplica na aproximação (/r/{plaque.slug})
                </p>
              </button>

              <button
                type="button"
                onClick={() => setApplyScope('qr')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                  applyScope === 'qr'
                    ? 'bg-blue-600/20 border-blue-400 text-white ring-1 ring-blue-400 shadow-md'
                    : 'bg-[#070d1a] border-[#1b2f52] text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-blue-400" />
                    Apenas QR Code
                  </span>
                  {applyScope === 'qr' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <p className="text-[10px] text-slate-400">
                  Aplica no escaneamento (/q/{plaque.slug})
                </p>
              </button>
            </div>
          </div>

          {/* Form Actions with Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="py-3 px-5 rounded-2xl bg-transparent hover:bg-[#15274d] text-slate-300 hover:text-white text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-blue-950/60 disabled:opacity-50 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{saving ? 'Gravando no Supabase...' : 'Salvar Novo Destino'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
