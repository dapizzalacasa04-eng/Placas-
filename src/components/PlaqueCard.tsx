import React from 'react';
import { 
  Radio, 
  QrCode, 
  ExternalLink, 
  Edit3, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Smartphone, 
  Copy, 
  Check, 
  Download,
  Sparkles
} from 'lucide-react';
import { Plaque, UserRole } from '../types';

interface PlaqueCardProps {
  plaque: Plaque;
  userRole: UserRole;
  onEditDestination: (plaque: Plaque) => void;
  onOpenQrStudio: (plaque: Plaque) => void;
  onToggleLock: (plaque: Plaque) => void;
  onSimulateTap: (plaque: Plaque) => void;
}

export const PlaqueCard: React.FC<PlaqueCardProps> = ({
  plaque,
  userRole,
  onEditDestination,
  onOpenQrStudio,
  onToggleLock,
  onSimulateTap,
}) => {
  const [copied, setCopied] = React.useState(false);

  const totalScans = plaque.totalNfcScans + plaque.totalQrScans;
  const nfcPercent = totalScans > 0 ? Math.round((plaque.totalNfcScans / totalScans) * 100) : 50;
  const qrPercent = totalScans > 0 ? 100 - nfcPercent : 50;

  const permanentNfcUrl = `${window.location.origin}/r/${plaque.slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(permanentNfcUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTargetTypeBadge = (type: Plaque['targetType']) => {
    switch (type) {
      case 'google_review':
        return { label: 'Google Avaliações', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'whatsapp':
        return { label: 'WhatsApp Oficial', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'instagram':
        return { label: 'Instagram', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' };
      case 'menu':
        return { label: 'Cardápio Digital', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' };
      case 'website':
        return { label: 'Site Oficial', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
      default:
        return { label: 'Link Personalizado', color: 'text-slate-300 bg-slate-800 border-slate-700' };
    }
  };

  const badge = getTargetTypeBadge(plaque.targetType);

  return (
    <div
      className={`relative rounded-3xl bg-[#0b1528] border transition-all duration-200 overflow-hidden shadow-xl ${
        plaque.isLocked
          ? 'border-red-900/60 shadow-red-950/20'
          : 'border-[#1b2f52] hover:border-blue-500/60 shadow-blue-950/20'
      }`}
    >
      {/* Top Accent Strip in Navy Blue */}
      <div
        className={`h-1.5 w-full ${
          plaque.isLocked
            ? 'bg-red-600'
            : plaque.isActive
            ? 'bg-gradient-to-r from-blue-700 via-blue-500 to-indigo-500'
            : 'bg-slate-700'
        }`}
      />

      <div className="p-5 sm:p-6 flex flex-col gap-4">
        {/* Header: Title, Owner & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {plaque.clientName && userRole === 'admin' && (
              <p className="text-xs font-bold text-blue-400 mb-0.5 truncate uppercase tracking-wider">
                Cliente: {plaque.clientName}
              </p>
            )}
            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white truncate">
              {plaque.title}
            </h3>
            
            {/* Short permanent identifier */}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="font-mono text-xs text-slate-300 bg-[#070d1a] px-3 py-1 rounded-xl border border-[#1b2f52] truncate">
                /r/{plaque.slug}
              </span>
              <button
                onClick={copyUrl}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#12213d] transition-colors"
                title="Copiar link permanente para gravação no NFC"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            {plaque.isLocked ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-red-950/80 text-red-300 border border-red-800">
                <Lock className="w-3.5 h-3.5 text-red-400" />
                Bloqueada
              </span>
            ) : plaque.isActive ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Ativa & Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-800 text-slate-400">
                Pausada
              </span>
            )}
          </div>
        </div>

        {/* 2 Destinos Independentes: NFC e QR Code */}
        <div className="flex flex-col gap-3 rounded-2xl bg-[#070d1a] border border-[#1b2f52] p-4">
          {/* Canal 1: NFC */}
          <div className="flex flex-col gap-2 pb-3.5 border-b border-[#14233e]">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-400">
                <Radio className="w-4 h-4 text-blue-400" />
                <span>Destino do Chip NFC (Aproximação):</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${badge.color}`}>
                {badge.label}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <a
                href={plaque.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-slate-200 hover:text-white truncate flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-[#0b1528] border border-[#1b2f52]"
                title={plaque.targetUrl}
              >
                <span className="truncate">{plaque.targetUrl}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              </a>

              <button
                onClick={() => onEditDestination(plaque)}
                disabled={plaque.isLocked && userRole !== 'admin'}
                className="min-h-[46px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-950 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Edit3 className="w-4 h-4" />
                <span>Trocar Link NFC</span>
              </button>
            </div>
          </div>

          {/* Canal 2: QR Code Dinâmico */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <QrCode className="w-4 h-4 text-blue-400" />
                <span>Destino do QR Code (Câmera):</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800">
                Nunca precisa reimprimir
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <a
                href={plaque.qrTargetUrl || plaque.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-slate-200 hover:text-white truncate flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-[#0b1528] border border-[#1b2f52]"
                title={plaque.qrTargetUrl || plaque.targetUrl}
              >
                <span className="truncate">{plaque.qrTargetUrl || plaque.targetUrl}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              </a>

              <button
                onClick={() => onOpenQrStudio(plaque)}
                className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#12213d] hover:bg-[#1a3058] text-white text-xs font-bold flex items-center justify-center gap-2 border border-[#1b2f52] shadow-sm transition-all"
              >
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>Trocar Link QR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Métricas: NFC vs QR Code */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold">
              <Radio className="w-3.5 h-3.5" />
              <span className="font-mono tabular-nums">{plaque.totalNfcScans}</span>
              <span className="text-slate-400 font-medium">NFC ({nfcPercent}%)</span>
            </div>
            
            <div className="text-xs text-slate-300 font-medium">
              Total: <span className="text-white font-extrabold font-mono">{totalScans}</span> acessos
            </div>

            <div className="flex items-center gap-1.5 text-slate-200 font-bold">
              <QrCode className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono tabular-nums">{plaque.totalQrScans}</span>
              <span className="text-slate-400 font-medium">QR ({qrPercent}%)</span>
            </div>
          </div>

          <div className="h-2.5 w-full rounded-full bg-[#070d1a] border border-[#14233e] overflow-hidden flex">
            <div
              style={{ width: `${nfcPercent}%` }}
              className="bg-blue-600 transition-all duration-300"
              title={`NFC: ${plaque.totalNfcScans} acessos`}
            />
            <div
              style={{ width: `${qrPercent}%` }}
              className="bg-slate-400 transition-all duration-300"
              title={`QR Code: ${plaque.totalQrScans} acessos`}
            />
          </div>
        </div>

        {/* Big Action Buttons Row */}
        <div className="pt-3 border-t border-[#1b2f52] grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Download QR Code */}
          <button
            onClick={() => onOpenQrStudio(plaque)}
            className="min-h-[48px] py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-slate-900" />
            <span>Baixar QR Code</span>
          </button>

          {/* Test NFC Tap */}
          <button
            onClick={() => onSimulateTap(plaque)}
            className="min-h-[48px] py-3 px-4 rounded-2xl bg-[#070d1a] hover:bg-[#101b33] text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-[#1b2f52] transition-colors"
            title="Simular aproximação no celular"
          >
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span>Testar no Celular</span>
          </button>

          {/* Remote lock for Admin */}
          {userRole === 'admin' ? (
            <button
              onClick={() => onToggleLock(plaque)}
              className={`min-h-[48px] py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors border ${
                plaque.isLocked
                  ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-700'
                  : 'bg-red-950/60 hover:bg-red-900/80 text-red-300 border-red-900'
              }`}
            >
              {plaque.isLocked ? (
                <>
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <span>Desbloquear Placa</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-red-400" />
                  <span>Bloquear Remoto</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center justify-center text-xs text-slate-400 font-medium bg-[#070d1a] rounded-2xl border border-[#1b2f52] px-2 py-3">
              Chip NFC: Gravado /r/{plaque.slug}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
