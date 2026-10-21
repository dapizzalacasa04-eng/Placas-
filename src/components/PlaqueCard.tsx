import React from 'react';
import { 
  Radio, 
  QrCode, 
  ExternalLink, 
  Edit3, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle,
  Smartphone,
  Copy,
  Check
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

  const permanentUrl = `${window.location.origin}/r/${plaque.slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(permanentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTargetTypeBadge = (type: Plaque['targetType']) => {
    switch (type) {
      case 'google_review':
        return { label: 'Google Avaliações', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'whatsapp':
        return { label: 'WhatsApp', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'instagram':
        return { label: 'Instagram', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' };
      case 'menu':
        return { label: 'Cardápio Digital', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' };
      case 'website':
        return { label: 'Site Oficial', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      default:
        return { label: 'Link Personalizado', color: 'text-zinc-300 bg-zinc-800 border-zinc-700' };
    }
  };

  const badge = getTargetTypeBadge(plaque.targetType);

  return (
    <div
      className={`relative rounded-2xl bg-[#121214] border transition-all duration-200 overflow-hidden ${
        plaque.isLocked
          ? 'border-red-900/60 shadow-lg shadow-red-950/20'
          : 'border-[#27272a] hover:border-zinc-700'
      }`}
    >
      {/* Visual Accent Bar */}
      <div
        className={`h-1.5 w-full ${
          plaque.isLocked
            ? 'bg-red-600'
            : plaque.isActive
            ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-700'
            : 'bg-zinc-700'
        }`}
      />

      <div className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Header: Title and Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {plaque.clientName && userRole === 'admin' && (
              <p className="text-[11px] font-medium text-zinc-400 mb-0.5 truncate">
                Cliente: {plaque.clientName}
              </p>
            )}
            <h3 className="font-heading font-semibold text-base sm:text-lg text-white truncate">
              {plaque.title}
            </h3>
            
            {/* Permanent Slug Link */}
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs text-zinc-400 bg-[#18181b] px-2 py-0.5 rounded border border-[#27272a] truncate max-w-[220px] sm:max-w-xs">
                /r/{plaque.slug}
              </span>
              <button
                onClick={copyUrl}
                className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
                title="Copiar URL permanente"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="shrink-0 flex items-center gap-1.5">
            {plaque.isLocked ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-800/80">
                <Lock className="w-3 h-3 text-red-400" />
                Bloqueado
              </span>
            ) : plaque.isActive ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Ativa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                Pausada
              </span>
            )}
          </div>
        </div>

        {/* Independent Destination Targets Box */}
        <div className="rounded-xl bg-[#0a0a0c] border border-[#27272a] p-3 flex flex-col gap-3">
          {/* Channel 1: NFC Target */}
          <div className="flex flex-col gap-1.5 pb-2.5 border-b border-[#1c1c20]">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-red-400 font-semibold text-[11px]">
                <Radio className="w-3.5 h-3.5" />
                <span>Destino NFC (Aproximação):</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${badge.color}`}>
                {badge.label}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <a
                href={plaque.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-zinc-300 hover:text-white truncate flex-1 flex items-center gap-1.5"
                title={plaque.targetUrl}
              >
                <span className="truncate">{plaque.targetUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0 text-zinc-500" />
              </a>

              <button
                onClick={() => onEditDestination(plaque)}
                disabled={plaque.isLocked && userRole !== 'admin'}
                className="px-2.5 py-1 rounded bg-[#1f1f23] hover:bg-[#27272a] text-zinc-200 text-xs font-medium flex items-center gap-1 shrink-0 border border-[#27272a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Alterar destino do chip NFC"
              >
                <Edit3 className="w-3 h-3 text-red-400" />
                <span>Trocar NFC</span>
              </button>
            </div>
          </div>

          {/* Channel 2: QR Code Dynamic Target */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-[11px]">
                <QrCode className="w-3.5 h-3.5 text-zinc-400" />
                <span>QR Code Dinâmico:</span>
                <span className="font-mono text-[10px] text-zinc-400 bg-[#16161a] px-1.5 py-0.2 rounded border border-[#27272a]">
                  /q/{plaque.slug}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60">
                Nunca Precisa Reimprimir
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-[10px] text-zinc-500 uppercase font-medium shrink-0">Destino:</span>
                <a
                  href={plaque.qrTargetUrl || plaque.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-zinc-300 hover:text-white truncate flex items-center gap-1"
                  title={plaque.qrTargetUrl || plaque.targetUrl}
                >
                  <span className="truncate">{plaque.qrTargetUrl || plaque.targetUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 text-zinc-500" />
                </a>
              </div>

              <button
                onClick={() => onOpenQrStudio(plaque)}
                className="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/50 text-red-200 text-xs font-medium flex items-center gap-1 shrink-0 border border-red-900/50 transition-colors"
                title="Alterar destino do QR Code e baixar PNG/SVG com o link permanente"
              >
                <Edit3 className="w-3 h-3 text-red-400" />
                <span>Trocar Link QR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Bar: NFC vs QR Code */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span className="font-mono tabular-nums font-semibold">{plaque.totalNfcScans}</span>
              <span className="text-zinc-400 text-[11px]">NFC ({nfcPercent}%)</span>
            </div>
            
            <div className="text-zinc-400 text-[11px] font-mono tabular-nums">
              Total: <span className="text-white font-bold">{totalScans}</span> acessos
            </div>

            <div className="flex items-center gap-1.5 text-zinc-300">
              <QrCode className="w-3.5 h-3.5 text-zinc-300" />
              <span className="font-mono tabular-nums font-semibold">{plaque.totalQrScans}</span>
              <span className="text-zinc-400 text-[11px]">QR ({qrPercent}%)</span>
            </div>
          </div>

          {/* Dual Segment Progress Bar */}
          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden flex">
            <div
              style={{ width: `${nfcPercent}%` }}
              className="bg-red-500 transition-all duration-300"
              title={`NFC: ${plaque.totalNfcScans} leituras`}
            />
            <div
              style={{ width: `${qrPercent}%` }}
              className="bg-zinc-400 transition-all duration-300"
              title={`QR Code: ${plaque.totalQrScans} leituras`}
            />
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-2 border-t border-[#27272a] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {/* QR Code Studio / Download */}
            <button
              onClick={() => onOpenQrStudio(plaque)}
              className="px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#222226] text-white text-xs font-medium flex items-center gap-1.5 border border-[#27272a] transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-red-400" />
              <span>Ver QR Code / PNG / SVG</span>
            </button>

            {/* Tap simulator */}
            <button
              onClick={() => onSimulateTap(plaque)}
              className="px-2.5 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#222226] text-zinc-300 text-xs font-medium flex items-center gap-1.5 border border-[#27272a] transition-colors"
              title="Testar aproximação NFC"
            >
              <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Toque NFC</span>
            </button>
          </div>

          {/* Admin Remote Lock Toggle */}
          {userRole === 'admin' ? (
            <button
              onClick={() => onToggleLock(plaque)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                plaque.isLocked
                  ? 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800'
                  : 'bg-red-950/40 hover:bg-red-900/50 text-red-300 border-red-900'
              }`}
              title={plaque.isLocked ? 'Desbloquear placa para o cliente' : 'Bloquear placa remotamente'}
            >
              {plaque.isLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Desbloquear</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>Bloquear Remoto</span>
                </>
              )}
            </button>
          ) : plaque.isLocked ? (
            <div className="text-[11px] text-red-400 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Bloqueado pela GoldFlow</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
