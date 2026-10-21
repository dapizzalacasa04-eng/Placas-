import React, { useEffect, useState } from 'react';
import { 
  X, 
  Download, 
  FileCode, 
  Image as ImageIcon, 
  QrCode, 
  Check, 
  Copy, 
  ExternalLink, 
  Save, 
  Link2, 
  Radio, 
  Sparkles,
  MessageSquare,
  Instagram,
  Star,
  Globe,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { Plaque, UserProfile, TargetType } from '../types';
import { 
  generateQRCodeSVG, 
  generateQRCodeDataUrl, 
  downloadQRCodePNG, 
  downloadQRCodeSVG 
} from '../lib/qrCodeHelper';

interface QRCodeStudioModalProps {
  plaque: Plaque | null;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveQrLink: (plaqueId: string, newQrUrl: string, qrTargetType?: TargetType) => Promise<void>;
  onSimulateScan?: (slug: string, source: 'qr') => void;
}

export const QRCodeStudioModal: React.FC<QRCodeStudioModalProps> = ({
  plaque,
  currentUser,
  isOpen,
  onClose,
  onSaveQrLink,
  onSimulateScan,
}) => {
  if (!isOpen) return null;

  // Destination URL (Dynamic Target: WhatsApp, Instagram, Google, website, etc.)
  const [qrInputUrl, setQrInputUrl] = useState<string>(() => {
    return plaque?.qrTargetUrl || plaque?.targetUrl || 'https://google.com';
  });
  const [targetType, setTargetType] = useState<TargetType>(() => {
    return plaque?.qrTargetType || 'google_review';
  });

  const [svgContent, setSvgContent] = useState<string>('');
  const [dataUrl, setDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingSvg, setDownloadingSvg] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [colorStyle, setColorStyle] = useState<'classic' | 'navy'>('classic');

  // Permanent Link for the Printed QR Code
  const permanentQrUrl = plaque
    ? `${window.location.origin}/q/${plaque.slug}`
    : qrInputUrl;

  // Clean and format destination URL
  const formattedDestinationUrl = React.useMemo(() => {
    let raw = qrInputUrl.trim();
    if (!raw) return 'https://goldflow.com.br';
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      raw = `https://${raw}`;
    }
    return raw;
  }, [qrInputUrl]);

  // Sync if plaque changes
  useEffect(() => {
    if (plaque) {
      setQrInputUrl(plaque.qrTargetUrl || plaque.targetUrl || '');
      setTargetType(plaque.qrTargetType || 'google_review');
    }
  }, [plaque]);

  // Generate QR Code with permanent link
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const darkColor = colorStyle === 'navy' ? '#1e3a8a' : '#000000';
    const lightColor = '#ffffff';

    Promise.all([
      generateQRCodeSVG(permanentQrUrl, { darkColor, lightColor, errorCorrectionLevel: 'H' }),
      generateQRCodeDataUrl(permanentQrUrl, { width: 512, darkColor, lightColor, errorCorrectionLevel: 'H' }),
    ])
      .then(([svg, png]) => {
        if (isMounted) {
          setSvgContent(svg);
          setDataUrl(png);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('QR code generation error', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [permanentQrUrl, colorStyle]);

  const handleSaveToDatabase = async () => {
    if (!plaque) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveQrLink(plaque.id, formattedDestinationUrl, targetType);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save QR link', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPng = async () => {
    setDownloadingPng(true);
    try {
      const darkColor = colorStyle === 'navy' ? '#1e3a8a' : '#000000';
      const filename = plaque ? `goldflow-qr-dinamico-${plaque.slug}-1024px` : 'goldflow-qr-code-1024px';
      await downloadQRCodePNG(permanentQrUrl, filename, {
        width: 1024,
        darkColor,
        lightColor: '#ffffff',
      });
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleDownloadSvg = async () => {
    setDownloadingSvg(true);
    try {
      const darkColor = colorStyle === 'navy' ? '#1e3a8a' : '#000000';
      const filename = plaque ? `goldflow-qr-dinamico-${plaque.slug}-vector` : 'goldflow-qr-code-vector';
      await downloadQRCodeSVG(permanentQrUrl, filename, {
        darkColor,
        lightColor: '#ffffff',
      });
    } finally {
      setDownloadingSvg(false);
    }
  };

  const copyPermanentLink = () => {
    navigator.clipboard.writeText(permanentQrUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const applyPreset = (type: 'whatsapp' | 'instagram' | 'google' | 'cardapio') => {
    if (type === 'whatsapp') {
      setTargetType('whatsapp');
      setQrInputUrl('https://wa.me/');
    } else if (type === 'instagram') {
      setTargetType('instagram');
      setQrInputUrl('https://instagram.com/');
    } else if (type === 'google') {
      setTargetType('google_review');
      setQrInputUrl('https://g.page/r/');
    } else if (type === 'cardapio') {
      setTargetType('menu');
      setQrInputUrl('https://');
    }
  };

  const isLinkModified = plaque && formattedDestinationUrl !== (plaque.qrTargetUrl || plaque.targetUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-xl bg-[#0b1528] border border-[#1e355b] rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl shadow-blue-950/60">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#1b2f52] flex items-center justify-between sticky top-0 bg-[#0b1528] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-xl font-bold text-white">
                  QR Code Permanente GoldFlow
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Imagem Fixa
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Altere o destino quantas vezes quiser sem trocar a imagem impressa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#15274d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 flex flex-col gap-5 items-center">
          {/* Permanent Link Banner */}
          {plaque && (
            <div className="w-full bg-[#070d1a] border border-[#1b2f52] rounded-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white truncate text-sm">
                    Placa: {plaque.title}
                  </span>
                </div>
                <button
                  onClick={copyPermanentLink}
                  className="text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>

              {/* Permanent short URL */}
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#0b1528] border border-[#1b2f52]">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Link Permanente Gravado no QR Code (Impresso):
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-white font-bold truncate block">
                    {permanentQrUrl}
                  </span>
                </div>
                {onSimulateScan && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSimulateScan(plaque.slug, 'qr');
                    }}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-md shadow-blue-950 transition-all"
                    title="Simular leitura pela câmera do celular"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Testar</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#14233e]">
                <span>NFC desta placa: <strong className="text-slate-300 font-mono">{plaque.targetUrl}</strong></span>
                <span className="text-emerald-400 font-bold shrink-0 ml-2">NFC e QR Code independentes</span>
              </div>
            </div>
          )}

          {/* Dynamic Destination Input Box */}
          <div className="w-full flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-blue-400" />
                <span>Destino Atual (Cole Qualquer Link):</span>
              </label>

              {formattedDestinationUrl && (
                <a
                  href={formattedDestinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 font-bold transition-colors"
                  title="Abrir destino em nova aba"
                >
                  <span>Testar Destino</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="flex items-center rounded-2xl bg-[#070d1a] border border-[#1b2f52] px-3.5 focus-within:border-blue-500 transition-colors">
              <input
                type="text"
                value={qrInputUrl}
                onChange={(e) => setQrInputUrl(e.target.value)}
                placeholder="Ex: https://wa.me/5511... ou https://instagram.com/... ou https://g.page/..."
                className="w-full py-3 bg-transparent text-xs sm:text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-bold">Atalhos rápidos:</span>
              <button
                type="button"
                onClick={() => applyPreset('whatsapp')}
                className="px-2.5 py-1 rounded-xl bg-[#070d1a] hover:bg-[#12213d] text-emerald-400 border border-[#1b2f52] text-xs flex items-center gap-1 font-bold transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => applyPreset('instagram')}
                className="px-2.5 py-1 rounded-xl bg-[#070d1a] hover:bg-[#12213d] text-pink-400 border border-[#1b2f52] text-xs flex items-center gap-1 font-bold transition-colors"
              >
                <Instagram className="w-3.5 h-3.5" />
                Instagram
              </button>
              <button
                type="button"
                onClick={() => applyPreset('google')}
                className="px-2.5 py-1 rounded-xl bg-[#070d1a] hover:bg-[#12213d] text-amber-400 border border-[#1b2f52] text-xs flex items-center gap-1 font-bold transition-colors"
              >
                <Star className="w-3.5 h-3.5" />
                Google Avaliações
              </button>
              <button
                type="button"
                onClick={() => applyPreset('cardapio')}
                className="px-2.5 py-1 rounded-xl bg-[#070d1a] hover:bg-[#12213d] text-sky-400 border border-[#1b2f52] text-xs flex items-center gap-1 font-bold transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                Cardápio
              </button>
            </div>
          </div>

          {/* Save Destination to Supabase / Database */}
          {plaque && (
            <div className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#070d1a] border border-[#1b2f52]">
              <div className="text-xs">
                <div className="font-bold text-white text-sm">
                  {saveSuccess ? 'Salvo no Supabase com Sucesso!' : isLinkModified ? 'Destino Alterado (Pendente de Salvar)' : 'Destino Sincronizado'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {saveSuccess 
                    ? 'O QR Code impresso já está apontando para o novo endereço.' 
                    : isLinkModified 
                    ? 'Clique no botão ao lado para salvar no Supabase. Não precisa reimprimir o QR.'
                    : 'Ao trocar a URL acima, basta salvar para redirecionar sem reimprimir.'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveToDatabase}
                disabled={saving || !isLinkModified}
                className={`min-h-[46px] py-2.5 px-5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md shrink-0 ${
                  saveSuccess
                    ? 'bg-emerald-600 text-white'
                    : isLinkModified
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/60 animate-pulse hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-[#15274d] text-slate-400 cursor-not-allowed'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Salvo!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Salvando...' : 'Salvar no Supabase'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* QR Code Graphic Frame (Permanent Image) */}
          <div className="relative p-5 rounded-3xl bg-white shadow-2xl shadow-black/80 flex items-center justify-center max-w-[240px] aspect-square w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-600">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold">Renderizando QR...</span>
              </div>
            ) : svgContent ? (
              <div
                className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : dataUrl ? (
              <img
                src={dataUrl}
                alt="QR Code Permanente"
                className="w-full h-full object-contain"
              />
            ) : null}
          </div>

          {/* Explanation badge */}
          <div className="w-full p-3.5 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-3 py-1 rounded-full mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              QR Code Permanente Fixo
            </span>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Este QR Code aponta para <strong className="text-white font-mono">/q/{plaque?.slug}</strong>. 
              Qualquer cliente que escanear a placa impressa será direcionado para o link ativo:
              <br />
              <span className="text-blue-400 font-mono font-bold break-all">{formattedDestinationUrl}</span>
            </p>
          </div>

          {/* Style Selector */}
          <div className="w-full flex items-center justify-between text-xs p-3 rounded-2xl bg-[#070d1a] border border-[#1b2f52]">
            <span className="text-slate-300 font-bold">Cor de Impressão do QR:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setColorStyle('classic')}
                className={`py-1.5 px-3 rounded-xl font-bold transition-colors ${
                  colorStyle === 'classic'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Preto Padrão
              </button>
              <button
                type="button"
                onClick={() => setColorStyle('navy')}
                className={`py-1.5 px-3 rounded-xl font-bold transition-colors ${
                  colorStyle === 'navy'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Azul Marinho
              </button>
            </div>
          </div>

          {/* Download Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={handleDownloadPng}
              disabled={downloadingPng || loading}
              className="flex-1 min-h-[50px] py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4 text-slate-900" />
              <span>{downloadingPng ? 'Baixando Imagem...' : 'Baixar Imagem PNG (1024px)'}</span>
            </button>

            <button
              onClick={handleDownloadSvg}
              disabled={downloadingSvg || loading}
              className="flex-1 min-h-[50px] py-3.5 px-5 rounded-2xl bg-[#12213d] hover:bg-[#1a3058] text-white border border-[#1b2f52] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              title="Arquivo vetorial puro para corte a laser em acrílico ou gráfica"
            >
              <FileCode className="w-4 h-4 text-blue-400" />
              <span>{downloadingSvg ? 'Exportando Vetor...' : 'Baixar Vetor SVG (Gráfica)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
