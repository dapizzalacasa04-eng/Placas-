import React, { useEffect, useState } from 'react';
import { Radio, ExternalLink, Lock, AlertTriangle, ArrowLeft, CheckCircle2, Shield } from 'lucide-react';
import { Plaque, ScanSource } from '../types';
import { getPlaqueBySlug, recordPlaqueScan } from '../lib/storage';

interface PublicRedirectViewProps {
  slug: string;
  source: ScanSource;
  onReturnToDashboard: () => void;
}

export const PublicRedirectView: React.FC<PublicRedirectViewProps> = ({
  slug,
  source,
  onReturnToDashboard,
}) => {
  const [plaque, setPlaque] = useState<Plaque | undefined>(undefined);
  const [recorded, setRecorded] = useState(false);
  const [countdown, setCountdown] = useState(2);
  const [autoRedirected, setAutoRedirected] = useState(false);

  useEffect(() => {
    const found = getPlaqueBySlug(slug);
    setPlaque(found);

    if (found && !found.isLocked && found.isActive && !recorded) {
      recordPlaqueScan(slug, source).then(() => {
        setRecorded(true);
      });
    }
  }, [slug, source, recorded]);

  useEffect(() => {
    if (!plaque || plaque.isLocked || !plaque.isActive) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !autoRedirected) {
      setAutoRedirected(true);
      // Attempt safe window redirect (or let user click if iframe blocks)
      try {
        window.open(plaque.targetUrl, '_blank');
      } catch (e) {
        console.warn('Auto redirect blocked or sandboxed', e);
      }
    }
  }, [countdown, plaque, autoRedirected]);

  if (!plaque) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121214] border border-[#27272a] rounded-2xl p-6 text-center flex flex-col items-center gap-4 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-800 flex items-center justify-center text-red-500">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold">Placa Não Encontrada</h2>
            <p className="text-zinc-400 text-xs mt-1">
              O link permanente <span className="font-mono text-zinc-300">/r/{slug}</span> não está cadastrado no sistema GoldFlow NFC.
            </p>
          </div>
          <button
            onClick={onReturnToDashboard}
            className="w-full py-2.5 rounded-xl bg-[#1c1c20] hover:bg-[#27272a] text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 border border-[#27272a] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel</span>
          </button>
        </div>
      </div>
    );
  }

  // Locked or Deactivated Screen
  if (plaque.isLocked || !plaque.isActive) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121214] border border-red-900/60 rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-5 shadow-2xl shadow-red-950/30">
          <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-700 flex items-center justify-center text-red-400 animate-pulse">
            <Lock className="w-8 h-8" />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-red-400 uppercase tracking-widest">
              Segurança GoldFlow NFC
            </span>
            <h2 className="font-heading text-2xl font-bold text-white">
              Placa Bloqueada
            </h2>
            <p className="text-zinc-400 text-xs max-w-xs mx-auto">
              {plaque.lockReason || 'O redirecionamento desta placa física foi suspenso temporariamente pela administração.'}
            </p>
          </div>

          <div className="w-full p-4 rounded-2xl bg-[#0a0a0c] border border-[#27272a] text-left flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Identificação:</span>
              <span className="font-semibold text-white">{plaque.title}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Canal Detectado:</span>
              <span className="font-mono text-red-400 uppercase">{source}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Status Remoto:</span>
              <span className="text-red-400 font-semibold">Desativada no Servidor</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400">
            Se você é o proprietário desta placa, acesse o painel GoldFlow para regularizar ou reativar.
          </p>

          <button
            onClick={onReturnToDashboard}
            className="w-full py-3 rounded-xl bg-[#1c1c20] hover:bg-[#27272a] text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 border border-[#27272a] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel GoldFlow</span>
          </button>
        </div>
      </div>
    );
  }

  // Active Plaque: High-Tech Fast Redirection
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#121214] border border-[#27272a] rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-5 shadow-2xl">
        {/* Brand & Wave Animation */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 to-red-800 flex items-center justify-center text-white shadow-xl shadow-red-950/60 ring-4 ring-red-500/20">
            <Radio className="w-10 h-10 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1 rounded-full border-2 border-[#121214]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-center gap-1.5 text-xs text-red-500 font-semibold tracking-wider uppercase">
            <span>GoldFlow NFC</span>
            <span>·</span>
            <span>{source === 'nfc' ? 'Aproximação NFC' : 'QR Code Scan'}</span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-white">
            {plaque.title}
          </h2>
          <p className="text-zinc-400 text-xs">
            Redirecionando para o destino oficial...
          </p>
        </div>

        {/* Telemetry info card */}
        <div className="w-full p-4 rounded-2xl bg-[#0a0a0c] border border-[#27272a] text-left flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Origem:</span>
            <span className="font-semibold text-white uppercase flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {source === 'nfc' ? 'Chip NFC Físico' : 'Câmera QR Code'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Telemetria:</span>
            <span className="text-emerald-400 font-medium">Contabilizada (+1)</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Destino:</span>
            <span className="font-mono text-zinc-300 truncate max-w-[200px]" title={plaque.targetUrl}>
              {plaque.targetUrl}
            </span>
          </div>
        </div>

        {/* Manual Click Button (instant) */}
        <div className="w-full flex flex-col gap-2.5">
          <a
            href={plaque.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold text-sm transition-all shadow-lg shadow-red-950/50 flex items-center justify-center gap-2"
          >
            <span>Acessar Destino Imediatamente</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={onReturnToDashboard}
            className="w-full py-2.5 rounded-xl bg-transparent hover:bg-[#1a1a1e] text-zinc-400 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retornar ao Painel Administrativo</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <Shield className="w-3.5 h-3.5 text-zinc-400" />
          <span>Link dinâmico protegido com telemetria segura GoldFlow</span>
        </div>
      </div>
    </div>
  );
};
