import React, { useState } from 'react';
import { 
  X, 
  Check, 
  QrCode, 
  MessageSquare, 
  Instagram, 
  Star, 
  Utensils, 
  Globe, 
  ExternalLink, 
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Save
} from 'lucide-react';
import { Plaque, TargetType } from '../types';

interface QrDestinationModalProps {
  plaque: Plaque;
  isOpen: boolean;
  onClose: () => void;
  onSaveQrDestination: (
    plaqueId: string,
    qrTargetUrl: string,
    qrTargetType: TargetType
  ) => Promise<void>;
  onSimulateScan?: (slug: string, source: 'qr') => void;
}

export const QrDestinationModal: React.FC<QrDestinationModalProps> = ({
  plaque,
  isOpen,
  onClose,
  onSaveQrDestination,
  onSimulateScan,
}) => {
  if (!isOpen) return null;

  const initialType: TargetType = plaque.qrTargetType || 'google_review';
  const initialUrl = plaque.qrTargetUrl || plaque.targetUrl || 'https://g.page/r/Cbistro-royal/review';

  const [selectedType, setSelectedType] = useState<TargetType>(initialType);
  const [customUrl, setCustomUrl] = useState<string>(initialUrl);

  // Preset states
  const [waPhone, setWaPhone] = useState('5511999998888');
  const [waMessage, setWaMessage] = useState('Olá! Escaneei o QR Code da loja e gostaria de atendimento.');
  const [instaHandle, setInstaHandle] = useState('sualojaoficial');
  const [googleReviewLink, setGoogleReviewLink] = useState('https://g.page/r/Cbistro-royal/review');

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

    let finalUrl = computedUrl;
    if (!finalUrl) {
      setError('Por favor, informe uma URL válida de destino.');
      return;
    }

    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }

    try {
      new URL(finalUrl);
    } catch {
      setError('A URL informada é inválida. Certifique-se de incluir um endereço web correto.');
      return;
    }

    setSaving(true);
    try {
      await onSaveQrDestination(plaque.id, finalUrl, selectedType);
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
      desc: 'Link de 5 estrelas do Google Meu Negócio',
      icon: Star,
      iconColor: 'text-amber-400',
    },
    {
      type: 'whatsapp' as TargetType,
      label: 'WhatsApp Oficial',
      desc: 'Inicia conversa com mensagem automática',
      icon: MessageSquare,
      iconColor: 'text-emerald-400',
    },
    {
      type: 'instagram' as TargetType,
      label: 'Instagram',
      desc: 'Abre o perfil da loja no aplicativo',
      icon: Instagram,
      iconColor: 'text-pink-400',
    },
    {
      type: 'menu' as TargetType,
      label: 'Cardápio Digital',
      desc: 'Catálogo de produtos, PDF ou iFood',
      icon: Utensils,
      iconColor: 'text-sky-400',
    },
    {
      type: 'website' as TargetType,
      label: 'Site Oficial / Qualquer Link',
      desc: 'Cole qualquer endereço web externo',
      icon: Globe,
      iconColor: 'text-blue-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-xl bg-[#0b1528] border border-[#1e355b] rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl shadow-blue-950/60">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#1b2f52] flex items-center justify-between sticky top-0 bg-[#0b1528] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-[11px] text-blue-400 font-extrabold uppercase tracking-wider block">
                QR Code Impresso Fixo: /q/{plaque.slug}
              </span>
              <h2 className="font-heading text-xl font-bold text-white">
                Trocar Destino do QR Code
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

        <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 flex flex-col gap-5">
          {/* Important Guarantee Banner */}
          <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 flex items-start gap-3 text-xs leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold mb-0.5">
                Não precisa reimprimir sua placa!
              </strong>
              O QR Code impresso no acrílico continuará exatamente igual. Apenas o redirecionamento será atualizado no Supabase, e quem escanear com a câmera abrirá o novo link na hora.
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-950/70 border border-red-800 text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Passo 1: Escolha do Modelo */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">1</span>
              <span>Escolha o novo destino para a câmera do QR Code:</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                        ? 'bg-blue-600/20 border-blue-400 shadow-md shadow-blue-950/40 ring-1 ring-blue-400'
                        : 'bg-[#070d1a] border-[#1b2f52] hover:border-slate-500'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${preset.iconColor}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        {preset.label}
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
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
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">2</span>
              <span>Informe os dados do link de destino:</span>
            </div>

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
                    Insira apenas números (55 para Brasil + DDD + Telefone).
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-300 font-bold">
                    Mensagem que aparecerá digitada na conversa:
                  </label>
                  <textarea
                    rows={2}
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    placeholder="Ex: Olá! Escaneei o QR Code da loja e gostaria de atendimento."
                    className="w-full px-4 py-3 rounded-2xl bg-[#0b1528] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </>
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
                    placeholder="sualojaoficial"
                    className="w-full px-2 py-3 bg-transparent text-sm text-white focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>
            )}

            {selectedType === 'google_review' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-300 font-bold">
                  Link Direto de Avaliações Google:
                </label>
                <input
                  type="url"
                  value={googleReviewLink}
                  onChange={(e) => setGoogleReviewLink(e.target.value)}
                  placeholder="https://g.page/r/.../review"
                  className="w-full px-4 py-3 rounded-2xl bg-[#0b1528] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
                <span className="text-[11px] text-slate-400">
                  Cole o link direto gerado no Google Meu Negócio &gt; Solicitar Avaliações.
                </span>
              </div>
            )}

            {(selectedType === 'menu' || selectedType === 'website' || selectedType === 'custom') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-300 font-bold">
                  Cole o Link Completo (WhatsApp, Instagram, Google, Cardápio ou Site):
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://seusite.com.br/promocao"
                  className="w-full px-4 py-3 rounded-2xl bg-[#0b1528] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>
            )}

            {/* Live Preview */}
            <div className="pt-2 border-t border-[#16243f]">
              <span className="text-[11px] text-slate-400 font-bold">
                URL de Redirecionamento que a câmera abrirá:
              </span>
              <div className="mt-1 flex items-center justify-between gap-2 p-3 rounded-xl bg-[#0b1528] border border-[#1b2f52]">
                <span className="text-xs font-mono text-slate-200 truncate font-semibold">
                  {computedUrl || 'Nenhum endereço informado'}
                </span>
                {computedUrl && (
                  <a
                    href={computedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 p-1 flex items-center gap-1 text-xs font-bold shrink-0"
                    title="Testar link em nova aba"
                  >
                    <span>Testar</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {onSimulateScan && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSimulateScan(plaque.slug, 'qr');
                }}
                className="py-3 px-4 rounded-2xl bg-[#070d1a] hover:bg-[#12213d] text-slate-200 text-xs font-bold border border-[#1b2f52] flex items-center gap-2 transition-colors"
                title="Testar como visitante"
              >
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>Testar Leitura QR</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
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
                <Save className="w-4 h-4" />
                <span>{saving ? 'Gravando no Supabase...' : 'Salvar Destino no Supabase'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
