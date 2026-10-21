import React, { useEffect, useState } from 'react';
import { Radio, ExternalLink, Lock, AlertTriangle, ArrowLeft, CheckCircle2, Shield, QrCode } from 'lucide-react';
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
  const [countdown, setCountdown] = useState(1);
  const [autoRedirected, setAutoRedirected] = useState(false);

  const destinationUrl = React.useMemo(() => {
    if (!plaque) return '';
    let target = source === 'qr' ? (plaque.qrTargetUrl || plaque.targetUrl) : plaque.targetUrl;
    if (!target) return '';
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    return target;
  }, [plaque, source]);

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
    if (!plaque || plaque.isLocked || !plaque.isActive || !destinationUrl) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 700);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !autoRedirected) {
      setAutoRedirected(true);
      try {
        window.open(destinationUrl, '_blank');
      } catch (e) {
        console.warn('Auto redirect blocked or sandboxed', e);
      }
    }
  }, [countdown, plaque, destinationUrl, autoRedirected]);

  if (!plaque) {
    return (
      <div className="min-h-screen bg-[#060b17] text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0b1528] border border-[#1b2f52] rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-4 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-red-950/60 border border-red-800 flex items-center justify-center text-red-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold">Placa Não Encontrada</h2>
            <p className="text-slate-400 text-xs mt-1">
              O link <span className="font-mono text-slate-300">/r/{slug}</span> não foi encontrado no sistema GoldFlow NFC.
            </p>
          </div>
          <button
            onClick={onReturnToDashboard}
            className="w-full min-h-[48px] py-3 rounded-2xl bg-[#12213d] hover:bg-[#1a3058] text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-[#1b2f52] transition-colors"
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
      <div className="min-h-screen bg-[#060b17] text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0b1528] border border-red-900/60 rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-5 shadow-2xl shadow-red-950/30">
          <div className="w-16 h-16 rounded-3xl bg-red-950/80 border border-red-700 flex items-center justify-center text-red-400 animate-pulse">
            <Lock className="w-8 h-8" />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest">
              Segurança GoldFlow NFC
            </span>
            <h2 className="font-heading text-2xl font-bold text-white">
              Placa Bloqueada Remotamente
            </h2>
            <p className="text-slate-400 text-xs max-w-xs mx-auto">
              {plaque.lockReason || 'O redirecionamento deste totem físico foi suspenso temporariamente pela administração.'}
            </p>
          </div>

          <div className="w-full p-4 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-left flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Identificação:</span>
              <span className="font-bold text-white">{plaque.title}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Canal Detectado:</span>
              <span className="font-mono text-blue-400 uppercase font-bold">{source}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Status Remoto:</span>
              <span className="text-red-400 font-bold">Bloqueada no Servidor</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Se você é o proprietário desta placa, regularize seu cadastro no painel da loja.
          </p>

          <button
            onClick={onReturnToDashboard}
            className="w-full min-h-[48px] py-3 rounded-2xl bg-[#12213d] hover:bg-[#1a3058] text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-[#1b2f52] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel GoldFlow</span>
          </button>
        </div>
      </div>
    );
  }

  // Active Plaque: Fast High-Tech Redirection
  return (
    <div className="min-h-screen bg-[#060b17] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0b1528] border border-[#1b2f52] rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-5 shadow-2xl shadow-blue-950/60">
        {/* Brand & Wave Animation */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-950/80 ring-4 ring-blue-500/20">
            {source === 'nfc' ? <Radio className="w-10 h-10 animate-pulse" /> : <QrCode className="w-10 h-10" />}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1 rounded-full border-2 border-[#0b1528]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-center gap-1.5 text-xs text-blue-400 font-bold tracking-wider uppercase">
            <span>GoldFlow NFC</span>
            <span>·</span>
            <span>{source === 'nfc' ? 'Aproximação NFC' : 'Leitura de QR Code'}</span>
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-white">
            {plaque.title}
          </h2>
          <p className="text-slate-400 text-xs">
            Redirecionando para o destino oficial...
          </p>
        </div>

        {/* Telemetry info card */}
        <div className="w-full p-4 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-left flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Origem do Acesso:</span>
            <span className="font-bold text-white uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {source === 'nfc' ? 'Chip NFC Físico' : 'Câmera QR Code'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Telemetria:</span>
            <span className="text-emerald-400 font-bold">Contabilizada com Sucesso (+1)</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Destino:</span>
            <span className="font-mono text-slate-300 truncate max-w-[200px]" title={destinationUrl}>
              {destinationUrl}
            </span>
          </div>
        </div>

        {/* Manual Click Button */}
        <div className="w-full flex flex-col gap-2.5">
          <a
            href={destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[50px] py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-blue-950 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Acessar Destino Imediatamente</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={onReturnToDashboard}
            className="w-full py-2.5 rounded-xl bg-transparent hover:bg-[#12213d] text-slate-400 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retornar ao Painel Administrativo</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>Link dinâmico protegido com telemetria segura GoldFlow</span>
        </div>
      </div>
    </div>
  );
};
