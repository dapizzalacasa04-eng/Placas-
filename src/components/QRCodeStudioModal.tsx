import React, { useEffect, useState } from 'react';
import { X, Download, FileCode, Image as ImageIcon, QrCode, Check, Copy } from 'lucide-react';
import { Plaque } from '../types';
import { 
  generateQRCodeSVG, 
  generateQRCodeDataUrl, 
  downloadQRCodePNG, 
  downloadQRCodeSVG 
} from '../lib/qrCodeHelper';

interface QRCodeStudioModalProps {
  plaque: Plaque | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeStudioModal: React.FC<QRCodeStudioModalProps> = ({
  plaque,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !plaque) return null;

  const [svgContent, setSvgContent] = useState<string>('');
  const [dataUrl, setDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingSvg, setDownloadingSvg] = useState(false);
  const [copied, setCopied] = useState(false);

  // Source parameter option
  const [sourceParam, setSourceParam] = useState<'qr' | 'nfc'>('qr');
  const [colorStyle, setColorStyle] = useState<'classic' | 'crimson'>('classic');

  const permanentUrl = `${window.location.origin}/r/${plaque.slug}?src=${sourceParam}`;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const darkColor = colorStyle === 'crimson' ? '#b91c1c' : '#000000';
    const lightColor = '#ffffff';

    Promise.all([
      generateQRCodeSVG(permanentUrl, { darkColor, lightColor, errorCorrectionLevel: 'H' }),
      generateQRCodeDataUrl(permanentUrl, { width: 512, darkColor, lightColor, errorCorrectionLevel: 'H' }),
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
  }, [permanentUrl, colorStyle]);

  const handleDownloadPng = async () => {
    setDownloadingPng(true);
    try {
      const darkColor = colorStyle === 'crimson' ? '#b91c1c' : '#000000';
      await downloadQRCodePNG(permanentUrl, `goldflow-qr-${plaque.slug}-1024px`, {
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
      await downloadQRCodeSVG(permanentUrl, `goldflow-qr-${plaque.slug}-vector`, {
        darkColor,
        lightColor: '#ffffff',
      });
    } finally {
      setDownloadingSvg(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(permanentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#27272a] flex items-center justify-between sticky top-0 bg-[#121214] z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-600/10 text-red-500">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-white">
                Gerador de QR Code
              </h2>
              <p className="text-xs text-zinc-400">
                Pronto para impressão em alta definição e corte a laser
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
          {/* Target URL Reference */}
          <div className="w-full bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Link do QR Code:</span>
              <button
                onClick={copyUrl}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 font-medium text-[11px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
            <div className="font-mono text-xs text-zinc-300 truncate bg-[#16161a] p-2 rounded border border-[#27272a]">
              {permanentUrl}
            </div>
          </div>

          {/* QR Code Preview Frame */}
          <div className="relative p-5 rounded-2xl bg-white shadow-xl shadow-black/60 flex items-center justify-center max-w-[260px] aspect-square w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 text-zinc-600">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Gerando vetor...</span>
              </div>
            ) : svgContent ? (
              <div
                className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : dataUrl ? (
              <img
                src={dataUrl}
                alt={`QR Code ${plaque.title}`}
                className="w-full h-full object-contain"
              />
            ) : null}
          </div>

          <div className="text-center">
            <h4 className="font-semibold text-white text-sm">{plaque.title}</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Destino atual: <span className="text-zinc-200">{plaque.targetUrl}</span>
            </p>
          </div>

          {/* Options / Customization */}
          <div className="w-full grid grid-cols-2 gap-2 text-xs">
            {/* Color style */}
            <div className="flex flex-col gap-1">
              <span className="text-zinc-400 font-medium text-[11px]">Estilo Visual:</span>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0a0a0c] border border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setColorStyle('classic')}
                  className={`flex-1 py-1 px-2 rounded font-medium text-center transition-colors ${
                    colorStyle === 'classic'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Preto Clássico
                </button>
                <button
                  type="button"
                  onClick={() => setColorStyle('crimson')}
                  className={`flex-1 py-1 px-2 rounded font-medium text-center transition-colors ${
                    colorStyle === 'crimson'
                      ? 'bg-red-950/80 text-red-300 border border-red-900/60'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Vermelho
                </button>
              </div>
            </div>

            {/* Source Tag */}
            <div className="flex flex-col gap-1">
              <span className="text-zinc-400 font-medium text-[11px]">Origem (Métrica):</span>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0a0a0c] border border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setSourceParam('qr')}
                  className={`flex-1 py-1 px-2 rounded font-medium text-center transition-colors ${
                    sourceParam === 'qr'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  ?src=qr
                </button>
                <button
                  type="button"
                  onClick={() => setSourceParam('nfc')}
                  className={`flex-1 py-1 px-2 rounded font-medium text-center transition-colors ${
                    sourceParam === 'nfc'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  ?src=nfc
                </button>
              </div>
            </div>
          </div>

          {/* Download Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-2.5 pt-2">
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
              title="Arquivo vetorial puro para plotter de recorte ou laser"
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
