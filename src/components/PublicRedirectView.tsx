import React, { useEffect, useState } from 'react';
import { ExternalLink, Lock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Plaque, ScanSource } from '../types';
import { getPlaqueBySlug, fetchPlaqueBySlug, recordPlaqueScan } from '../lib/storage';

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
  // Synchronous initial state from cache for 0ms instant redirect
  const [plaque, setPlaque] = useState<Plaque | undefined>(() => getPlaqueBySlug(slug));
  const [loading, setLoading] = useState(!plaque);
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  // Compute destination URL (QR has its own independent target, falling back to NFC target)
  const destinationUrl = React.useMemo(() => {
    if (!plaque) return '';
    let target = source === 'qr' ? (plaque.qrTargetUrl || plaque.targetUrl) : plaque.targetUrl;
    if (!target) return '';
    target = target.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    return target;
  }, [plaque, source]);

  // Fetch fresh data from Supabase if connected
  useEffect(() => {
    let isMounted = true;
    fetchPlaqueBySlug(slug).then((freshPlaque) => {
      if (isMounted) {
        if (freshPlaque) {
          setPlaque(freshPlaque);
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Record scan telemetry in background
  useEffect(() => {
    if (plaque && !plaque.isLocked && plaque.isActive) {
      recordPlaqueScan(slug, source).catch((err) => {
        console.warn('Telemetry scan record failed:', err);
      });
    }
  }, [plaque, slug, source]);

  // Execute direct instant redirection without displaying GoldFlow website
  useEffect(() => {
    if (!plaque || plaque.isLocked || !plaque.isActive || !destinationUrl) return;

    if (!redirectAttempted) {
      setRedirectAttempted(true);

      // Instant direct redirection
      try {
        // Try location replace for cleanest browser history
        window.location.replace(destinationUrl);
      } catch (e1) {
        try {
          window.location.href = destinationUrl;
        } catch (e2) {
          console.warn('Automatic redirect blocked by browser/sandbox:', e2);
        }
      }
    }
  }, [plaque, destinationUrl, redirectAttempted]);

  // 1. Loading state (only shown if not in local cache while waiting for Supabase)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-300">Carregando destino...</p>
      </div>
    );
  }

  // 2. Plaque not found
  if (!plaque) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full bg-[#0d172b] border border-[#1b2f52] rounded-3xl p-6 flex flex-col items-center gap-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Link Não Encontrado</h2>
            <p className="text-slate-400 text-xs mt-1">
              A rota <span className="font-mono text-slate-300">/{source === 'qr' ? 'q' : 'r'}/{slug}</span> não foi localizada.
            </p>
          </div>
          <button
            onClick={onReturnToDashboard}
            className="w-full py-2.5 rounded-xl bg-[#12213d] hover:bg-[#1a3058] text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 border border-[#1b2f52] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Painel</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Plaque Locked remotely by Admin
  if (plaque.isLocked || !plaque.isActive) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full bg-[#0d172b] border border-red-900/60 rounded-3xl p-6 flex flex-col items-center gap-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-700 flex items-center justify-center text-red-400">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Placa Bloqueada Remotamente</h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              {plaque.lockReason || 'O redirecionamento deste link foi suspenso temporariamente pela administração.'}
            </p>
          </div>
          <button
            onClick={onReturnToDashboard}
            className="w-full py-2.5 rounded-xl bg-[#12213d] hover:bg-[#1a3058] text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 border border-[#1b2f52] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Painel</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Active Plaque: Direct clean redirect view without GoldFlow site elements
  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Animated spinner for instant feedback */}
      <div className="w-12 h-12 rounded-full border-3 border-blue-500 border-t-transparent animate-spin mb-4" />

      <h1 className="text-xl font-bold text-white">Redirecionando...</h1>
      <p className="text-xs text-slate-400 mt-1 max-w-sm font-mono truncate" title={destinationUrl}>
        {destinationUrl}
      </p>

      {/* Fallback button if browser sandbox / popup blocker prevents automatic replace */}
      <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-xs">
        <a
          href={destinationUrl}
          target="_self"
          className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-950 flex items-center justify-center gap-2 transition-all"
        >
          <span>Abrir link agora</span>
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* Small discrete back button for dashboard testing */}
        <button
          onClick={onReturnToDashboard}
          className="text-xs text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-1.5 pt-2"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Voltar ao Painel Administrativo</span>
        </button>
      </div>
    </div>
  );
};
