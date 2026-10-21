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
  Globe
} from 'lucide-react';
import { Plaque, UserProfile } from '../types';
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
  onSaveQrLink: (plaqueId: string, newQrUrl: string) => Promise<void>;
}

export const QRCodeStudioModal: React.FC<QRCodeStudioModalProps> = ({
  plaque,
  currentUser,
  isOpen,
  onClose,
  onSaveQrLink,
}) => {
  if (!isOpen) return null;

  // Independent QR Code URL: initializes from plaque.qrTargetUrl or plaque.targetUrl or empty
  const [qrInputUrl, setQrInputUrl] = useState<string>(() => {
    return plaque?.qrTargetUrl || plaque?.targetUrl || 'https://instagram.com/sualoja';
  });

  const [svgContent, setSvgContent] = useState<string>('');
  const [dataUrl, setDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingSvg, setDownloadingSvg] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [colorStyle, setColorStyle] = useState<'classic' | 'crimson'>('classic');

  // Sync if plaque changes
  useEffect(() => {
    if (plaque) {
      setQrInputUrl(plaque.qrTargetUrl || plaque.targetUrl || '');
    }
  }, [plaque]);

  // Clean and validate URL for QR code encoding
  const formattedUrl = React.useMemo(() => {
    let raw = qrInputUrl.trim();
    if (!raw) return 'https://goldflow.com.br';
    // If missing protocol and looks like a domain/url, prepend https://
    if (!raw.startsWith('http://') && !raw.startsWith('https://') && !raw.startsWith('wa.me/')) {
      raw = `https://${raw}`;
    }
    return raw;
  }, [qrInputUrl]);

  // Regenerate QR Code whenever formattedUrl or colorStyle changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const darkColor = colorStyle === 'crimson' ? '#b91c1c' : '#000000';
    const lightColor = '#ffffff';

    Promise.all([
      generateQRCodeSVG(formattedUrl, { darkColor, lightColor, errorCorrectionLevel: 'H' }),
      generateQRCodeDataUrl(formattedUrl, { width: 512, darkColor, lightColor, errorCorrectionLevel: 'H' }),
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
  }, [formattedUrl, colorStyle]);

  const handleSaveToDatabase = async () => {
    if (!plaque) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveQrLink(plaque.id, formattedUrl);
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
      const darkColor = colorStyle === 'crimson' ? '#b91c1c' : '#000000';
      const filename = plaque ? `goldflow-qr-${plaque.slug}-1024px` : 'goldflow-qr-code-1024px';
      await downloadQRCodePNG(formattedUrl, filename, {
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
      const darkColor = colorStyle === 'crimson' ? '#b91c1c' : '#000000';
      const filename = plaque ? `goldflow-qr-${plaque.slug}-vector` : 'goldflow-qr-code-vector';
      await downloadQRCodeSVG(formattedUrl, filename, {
        darkColor,
        lightColor: '#ffffff',
      });
    } finally {
      setDownloadingSvg(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(formattedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (type: 'whatsapp' | 'instagram' | 'google' | 'cardapio') => {
    if (type === 'whatsapp') {
      setQrInputUrl('https://wa.me/5511999998888?text=Olá!%20Vim%20pelo%20QR%20Code.');
    } else if (type === 'instagram') {
      setQrInputUrl('https://instagram.com/sualojaoficial');
    } else if (type === 'google') {
      setQrInputUrl('https://g.page/r/Cbistro-royal/review');
    } else if (type === 'cardapio') {
      setQrInputUrl('https://cardapio.sualoja.com.br');
    }
  };

  const isLinkModified = plaque && formattedUrl !== (plaque.qrTargetUrl || plaque.targetUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#27272a] flex items-center justify-between sticky top-0 bg-[#121214] z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-white">
                Gerador de QR Code Direto
              </h2>
              <p className="text-xs text-zinc-400">
                Abre o link escolhido imediatamente, sem passar pelo app GoldFlow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#1f1f23] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-5 items-center">
          {/* Independence Banner */}
          {plaque && (
            <div className="w-full bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white truncate">
                  Placa: {plaque.title}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  /r/{plaque.slug}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-[#1f1f23]">
                <div className="flex items-center gap-1.5 truncate">
                  <Radio className="w-3 h-3 text-red-400 shrink-0" />
                  <span className="truncate">NFC Atual: <strong className="text-zinc-300 font-mono">{plaque.targetUrl}</strong></span>
                </div>
                <span className="text-emerald-400 font-medium shrink-0 ml-2">QR Independente</span>
              </div>
            </div>
          )}

          {/* Direct Link Input Box */}
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-red-500" />
                <span>Link que o QR Code deve abrir (cole qualquer URL):</span>
              </label>

              {formattedUrl && (
                <a
                  href={formattedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1 font-medium transition-colors"
                  title="Abrir este link em nova aba para testar"
                >
                  <span>Testar Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex items-center rounded-xl bg-[#0a0a0c] border border-[#27272a] px-3 focus-within:border-red-500 transition-colors">
              <input
                type="text"
                value={qrInputUrl}
                onChange={(e) => setQrInputUrl(e.target.value)}
                placeholder="Ex: https://wa.me/5511999998888 ou https://instagram.com/sualoja"
                className="w-full py-2.5 bg-transparent text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={copyUrl}
                className="text-zinc-400 hover:text-white p-1 ml-1 shrink-0"
                title="Copiar link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Quick Preset Paste Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[11px] text-zinc-500 font-medium">Exemplos rápidos:</span>
              <button
                type="button"
                onClick={() => applyPreset('whatsapp')}
                className="px-2 py-0.5 rounded-lg bg-[#18181b] hover:bg-[#222226] text-emerald-400 border border-[#27272a] text-[11px] flex items-center gap-1 font-medium transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => applyPreset('instagram')}
                className="px-2 py-0.5 rounded-lg bg-[#18181b] hover:bg-[#222226] text-pink-400 border border-[#27272a] text-[11px] flex items-center gap-1 font-medium transition-colors"
              >
                <Instagram className="w-3 h-3" />
                Instagram
              </button>
              <button
                type="button"
                onClick={() => applyPreset('google')}
                className="px-2 py-0.5 rounded-lg bg-[#18181b] hover:bg-[#222226] text-amber-400 border border-[#27272a] text-[11px] flex items-center gap-1 font-medium transition-colors"
              >
                <Star className="w-3 h-3" />
                Google Avaliações
              </button>
              <button
                type="button"
                onClick={() => applyPreset('cardapio')}
                className="px-2 py-0.5 rounded-lg bg-[#18181b] hover:bg-[#222226] text-sky-400 border border-[#27272a] text-[11px] flex items-center gap-1 font-medium transition-colors"
              >
                <Globe className="w-3 h-3" />
                Cardápio / Site
              </button>
            </div>
          </div>

          {/* Save to Database action button */}
          {plaque && (
            <div className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-[#16161a] border border-[#27272a]">
              <div className="text-xs">
                <div className="font-semibold text-white">
                  {saveSuccess ? 'Salvo no Banco de Dados!' : isLinkModified ? 'Alteração Não Salva' : 'Link Salvo na Placa'}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {saveSuccess ? 'As novas leituras já abrirão este link.' : 'Grave esta URL no banco de dados da sua placa.'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveToDatabase}
                disabled={saving || !isLinkModified}
                className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shrink-0 ${
                  saveSuccess
                    ? 'bg-emerald-600 text-white'
                    : isLinkModified
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/40 animate-pulse'
                    : 'bg-[#27272a] text-zinc-400 cursor-not-allowed'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvo!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Gravando...' : 'Salvar na Placa'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* QR Code Preview Frame */}
          <div className="relative p-5 rounded-2xl bg-white shadow-xl shadow-black/60 flex items-center justify-center max-w-[250px] aspect-square w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 text-zinc-600">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Renderizando QR...</span>
              </div>
            ) : svgContent ? (
              <div
                className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : dataUrl ? (
              <img
                src={dataUrl}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            ) : null}
          </div>

          {/* Clarification banner */}
          <div className="text-center max-w-sm">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full mb-1">
              <Check className="w-3 h-3" />
              Destino Direto Garantido
            </span>
            <p className="text-xs text-zinc-400 mt-1">
              Ao apontar a câmera do celular para este QR Code, o smartphone abrirá <span className="text-white font-mono break-all">{formattedUrl}</span> diretamente.
            </p>
          </div>

          {/* Color Style Selection */}
          <div className="w-full flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
            <span className="text-zinc-400 font-medium">Estilo Visual do QR:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setColorStyle('classic')}
                className={`py-1 px-2.5 rounded-lg font-medium transition-colors ${
                  colorStyle === 'classic'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Preto Padrão
              </button>
              <button
                type="button"
                onClick={() => setColorStyle('crimson')}
                className={`py-1 px-2.5 rounded-lg font-medium transition-colors ${
                  colorStyle === 'crimson'
                    ? 'bg-red-950 text-red-300 border border-red-900/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Vermelho GoldFlow
              </button>
            </div>
          </div>

          {/* Download Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-2.5 pt-1">
            {/* Download PNG */}
            <button
              onClick={handleDownloadPng}
              disabled={downloadingPng || loading}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 disabled:opacity-50 transition-all"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{downloadingPng ? 'Baixando...' : 'Baixar PNG (1024px)'}</span>
            </button>

            {/* Download SVG */}
            <button
              onClick={handleDownloadSvg}
              disabled={downloadingSvg || loading}
              className="flex-1 py-3 px-4 rounded-xl bg-[#1c1c20] hover:bg-[#27272e] text-zinc-100 border border-[#27272a] text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              title="Arquivo vetorial puro para plotter de recorte ou gravação a laser"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>{downloadingSvg ? 'Exportando...' : 'Baixar SVG Vetorial'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
