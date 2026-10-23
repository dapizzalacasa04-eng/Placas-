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
  onEditQrDestination: (plaque: Plaque) => void;
  onOpenQrStudio: (plaque: Plaque) => void;
  onToggleLock: (plaque: Plaque) => void;
  onSimulateTap: (plaque: Plaque) => void;
  onTestQr?: (plaque: Plaque) => void;
}

export const PlaqueCard: React.FC<PlaqueCardProps> = ({
  plaque,
  userRole,
  onEditDestination,
  onEditQrDestination,
  onOpenQrStudio,
  onToggleLock,
  onSimulateTap,
  onTestQr,
}) => {
  const [copiedNfc, setCopiedNfc] = React.useState(false);
  const [copiedQr, setCopiedQr] = React.useState(false);

  const totalScans = plaque.totalNfcScans + plaque.totalQrScans;
  const nfcPercent = totalScans > 0 ? Math.round((plaque.totalNfcScans / totalScans) * 100) : 50;
  const qrPercent = totalScans > 0 ? 100 - nfcPercent : 50;

  const permanentNfcUrl = `${window.location.origin}/r/${plaque.slug}`;
  const permanentQrUrl = `${window.location.origin}/q/${plaque.slug}`;

  const copyNfcUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(permanentNfcUrl);
    setCopiedNfc(true);
    setTimeout(() => setCopiedNfc(false), 2000);
  };

  const copyQrUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(permanentQrUrl);
    setCopiedQr(true);
    setTimeout(() => setCopiedQr(false), 2000);
  };

  const getNfcBadge = () => {
    switch (plaque.targetType) {
      case 'google_review':
        return { label: 'Google Avaliações', color: 'bg-amber-950/80 text-amber-300 border-amber-800' };
      case 'whatsapp':
        return { label: 'WhatsApp', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800' };
      case 'instagram':
        return { label: 'Instagram', color: 'bg-pink-950/80 text-pink-300 border-pink-800' };
      case 'menu':
        return { label: 'Cardápio Digital', color: 'bg-sky-950/80 text-sky-300 border-sky-800' };
      case 'website':
        return { label: 'Website', color: 'bg-blue-950/80 text-blue-300 border-blue-800' };
      default:
        return { label: 'Personalizado', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const getQrBadge = () => {
    const type = plaque.qrTargetType || plaque.targetType;
    switch (type) {
      case 'google_review':
        return { label: 'Google Avaliações', color: 'bg-amber-950/80 text-amber-300 border-amber-800' };
      case 'whatsapp':
        return { label: 'WhatsApp', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800' };
      case 'instagram':
        return { label: 'Instagram', color: 'bg-pink-950/80 text-pink-300 border-pink-800' };
      case 'menu':
        return { label: 'Cardápio Digital', color: 'bg-sky-950/80 text-sky-300 border-sky-800' };
      case 'website':
        return { label: 'Website', color: 'bg-blue-950/80 text-blue-300 border-blue-800' };
      default:
        return { label: 'Personalizado', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const nfcBadge = getNfcBadge();
  const qrBadge = getQrBadge();
  const qrDestination = plaque.qrTargetUrl || plaque.targetUrl;

  const handleTestQrClick = () => {
    if (onTestQr) {
      onTestQr(plaque);
    } else {
      window.open(`/q/${plaque.slug}`, '_blank');
    }
  };

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
        plaque.isLocked
          ? 'bg-[#0b1528]/60 border-red-900/60 shadow-lg shadow-red-950/20'
          : 'bg-[#0b1528] border-[#1b2f52] hover:border-blue-500/50 shadow-xl shadow-blue-950/30'
      }`}
    >
      <div className="p-5 sm:p-6 flex flex-col gap-5">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-heading text-lg sm:text-xl font-bold text-white truncate">
                {plaque.title}
              </h3>
              {plaque.clientName && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/60 font-semibold truncate max-w-[150px]">
                  {plaque.clientName}
                </span>
              )}
            </div>
            
            {/* Short permanent identifiers with direct test links */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className="flex items-center gap-1 bg-[#070d1a] px-2.5 py-1 rounded-xl border border-[#1b2f52]">
                <span className="font-mono text-xs text-slate-300">
                  NFC: /r/{plaque.slug}
                </span>
                <button
                  onClick={copyNfcUrl}
                  className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                  title="Copiar link permanente do NFC"
                >
                  {copiedNfc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={`/r/${plaque.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 p-0.5 rounded transition-colors"
                  title="Testar rota NFC (/r/)"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex items-center gap-1 bg-[#070d1a] px-2.5 py-1 rounded-xl border border-blue-900/60">
                <span className="font-mono text-xs text-blue-300 font-bold">
                  QR: /q/{plaque.slug}
                </span>
                <button
                  onClick={copyQrUrl}
                  className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                  title="Copiar link permanente do QR Code"
                >
                  {copiedQr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={`/q/${plaque.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 p-0.5 rounded transition-colors"
                  title="Testar rota exclusiva QR (/q/) sem exibir o site"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
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
                <span>1. Destino do Chip NFC (Aproximação):</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${nfcBadge.color}`}>
                {nfcBadge.label}
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
                className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#12213d] hover:bg-[#1a3058] text-white text-xs font-bold flex items-center justify-center gap-2 border border-[#1b2f52] shadow-sm disabled:opacity-50 transition-all shrink-0"
              >
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>Trocar Link NFC</span>
              </button>
            </div>
          </div>

          {/* Canal 2: QR Code Dinâmico */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <QrCode className="w-4 h-4 text-blue-400" />
                <span>2. Destino do QR Code Permanente (Câmera):</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${qrBadge.color}`}>
                  {qrBadge.label}
                </span>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800">
                  QR fixo / Nunca reimprime
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <a
                href={qrDestination}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-slate-200 hover:text-white truncate flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-[#0b1528] border border-[#1b2f52]"
                title={qrDestination}
              >
                <span className="truncate">{qrDestination}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              </a>

              <button
                onClick={() => onEditQrDestination(plaque)}
                disabled={plaque.isLocked && userRole !== 'admin'}
                className="min-h-[46px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-950 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <Edit3 className="w-4 h-4" />
                <span>Trocar Destino QR</span>
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
        <div className="pt-3 border-t border-[#1b2f52] grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {/* Download QR Code */}
          <button
            onClick={() => onOpenQrStudio(plaque)}
            className="min-h-[48px] py-3 px-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-slate-900" />
            <span>Baixar QR Code</span>
          </button>

          {/* Test QR Route */}
          <button
            onClick={handleTestQrClick}
            className="min-h-[48px] py-3 px-3 rounded-2xl bg-[#070d1a] hover:bg-[#12213d] text-blue-400 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border border-blue-900/60 transition-colors"
            title="Testa a rota exclusiva /q/ da placa com redirecionamento direto sem abrir o site"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Testar Rota QR</span>
          </button>

          {/* Test NFC Tap */}
          <button
            onClick={() => onSimulateTap(plaque)}
            className="min-h-[48px] py-3 px-3 rounded-2xl bg-[#070d1a] hover:bg-[#101b33] text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border border-[#1b2f52] transition-colors"
            title="Simular aproximação do celular no chip NFC"
          >
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span>Testar NFC</span>
          </button>

          {/* Remote lock and reactivation for Admin & Client */}
          <button
            onClick={() => onToggleLock(plaque)}
            className={`min-h-[48px] py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors border ${
              plaque.isLocked
                ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-700'
                : 'bg-red-950/60 hover:bg-red-900/80 text-red-300 border-red-900'
            }`}
            title={
              plaque.isLocked
                ? (userRole === 'admin' ? 'Desbloquear e reativar link da placa' : 'Reativar link da placa')
                : 'Bloquear/suspender temporariamente o link da placa'
            }
          >
            {plaque.isLocked ? (
              <>
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span>{userRole === 'admin' ? 'Desbloquear' : 'Reativar'}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-red-400" />
                <span>Bloquear</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
