import React, { useEffect, useState } from 'react';
import { ExternalLink, Lock, AlertTriangle, ArrowLeft, Database, Check } from 'lucide-react';
import { Plaque, ScanSource } from '../types';
import { getPlaqueBySlug, fetchPlaqueBySlug, recordPlaqueScan } from '../lib/storage';
import { getStoredSupabaseConfig, saveStoredSupabaseConfig, resetSupabaseClient } from '../lib/supabase';

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
  const [lastRedirectedUrl, setLastRedirectedUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Quick configuration inputs if device has no credentials yet
  const [showQuickConnect, setShowQuickConnect] = useState(false);
  const [quickUrl, setQuickUrl] = useState('');
  const [quickAnonKey, setQuickAnonKey] = useState('');
  const [quickSaveSuccess, setQuickSaveSuccess] = useState(false);

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
    setLoading(true);

    fetchPlaqueBySlug(slug).then((freshPlaque) => {
      if (!isMounted) return;

      if (freshPlaque) {
        setPlaque(freshPlaque);

        // Immediate direct redirect as soon as Supabase query returns
        if (!freshPlaque.isLocked && freshPlaque.isActive) {
          let directTarget = source === 'qr' 
            ? (freshPlaque.qrTargetUrl || freshPlaque.targetUrl) 
            : freshPlaque.targetUrl;
          if (directTarget) {
            directTarget = directTarget.trim();
            if (!directTarget.startsWith('http://') && !directTarget.startsWith('https://')) {
              directTarget = `https://${directTarget}`;
            }
            try {
              window.location.replace(directTarget);
            } catch {
              window.location.href = directTarget;
            }
          }
        }
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [slug, source, retryCount]);

  // Record scan telemetry in background
  useEffect(() => {
    if (plaque && !plaque.isLocked && plaque.isActive) {
      recordPlaqueScan(slug, source).catch((err) => {
        console.warn('Telemetry scan record failed:', err);
      });
    }
  }, [plaque, slug, source]);

  // Redirection effect for cached or updated plaque
  useEffect(() => {
    if (!plaque || plaque.isLocked || !plaque.isActive || !destinationUrl) return;

    if (lastRedirectedUrl !== destinationUrl) {
      setLastRedirectedUrl(destinationUrl);

      try {
        window.location.replace(destinationUrl);
      } catch (e1) {
        try {
          window.location.href = destinationUrl;
        } catch (e2) {
          console.warn('Automatic redirect blocked by browser/sandbox:', e2);
        }
      }
    }
  }, [plaque, destinationUrl, lastRedirectedUrl]);

  // 1. Loading state (only shown if not in local cache while waiting for Supabase)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-300">Consultando placa inteligente no Supabase...</p>
        <p className="text-xs text-slate-500 font-mono mt-1">/{source === 'qr' ? 'q' : 'r'}/{slug}</p>
      </div>
    );
  }

  // 2. Plaque not found
  if (!plaque) {
    const isConnected = getStoredSupabaseConfig().isConnected;

    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-sm w-full bg-[#0d172b] border border-[#1b2f52] rounded-3xl p-6 flex flex-col items-center gap-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Link Não Encontrado</h2>
            <p className="text-slate-400 text-xs mt-1">
              A rota <span className="font-mono text-slate-300 font-semibold">/{source === 'qr' ? 'q' : 'r'}/{slug}</span> não foi localizada no banco de dados.
            </p>
            {!isConnected && !showQuickConnect && (
              <div className="mt-3 p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-left text-[11px] text-blue-200 leading-relaxed">
                <span className="font-bold text-white block mb-0.5">Dispositivo Novo ou Sem Cache</span>
                Se esta aplicação está hospedada no Netlify, verifique se as variáveis de ambiente <code className="font-mono text-blue-300">VITE_SUPABASE_URL</code> e <code className="font-mono text-blue-300">VITE_SUPABASE_ANON_KEY</code> foram configuradas no Netlify.
                <button
                  type="button"
                  onClick={() => setShowQuickConnect(true)}
                  className="mt-2 text-xs font-bold text-blue-400 hover:text-blue-300 underline block"
                >
                  Ou conectar Supabase diretamente neste celular
                </button>
              </div>
            )}

            {showQuickConnect && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!quickUrl.trim() || !quickAnonKey.trim()) return;
                  saveStoredSupabaseConfig({
                    url: quickUrl.trim(),
                    anonKey: quickAnonKey.trim(),
                    isConnected: true,
                    lastChecked: new Date().toISOString(),
                  });
                  resetSupabaseClient();
                  setQuickSaveSuccess(true);
                  setTimeout(() => {
                    setRetryCount((c) => c + 1);
                  }, 500);
                }}
                className="mt-3 p-3.5 bg-[#070d1a] border border-[#1b2f52] rounded-2xl text-left flex flex-col gap-2"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>Conectar Supabase Neste Dispositivo:</span>
                </div>
                <div>
                  <input
                    type="url"
                    placeholder="https://seu-projeto.supabase.co"
                    value={quickUrl}
                    onChange={(e) => setQuickUrl(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#0b1528] border border-[#1e355b] text-[11px] text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Chave pública anon (eyJ...)"
                    value={quickAnonKey}
                    onChange={(e) => setQuickAnonKey(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#0b1528] border border-[#1e355b] text-[11px] text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQuickConnect(false)}
                    className="py-1.5 px-3 text-[11px] text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold shadow-md shadow-blue-950 flex-1 flex items-center justify-center gap-1.5"
                  >
                    {quickSaveSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                    <span>{quickSaveSuccess ? 'Conectado! Redirecionando...' : 'Salvar e Redirecionar'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
          <div className="w-full flex flex-col gap-2">
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-950"
            >
              <span>Tentar Novamente</span>
            </button>
            <button
              onClick={onReturnToDashboard}
              className="w-full py-2.5 rounded-xl bg-[#12213d] hover:bg-[#1a3058] text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 border border-[#1b2f52] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Painel</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Plaque Locked remotely by Admin
  if (plaque.isLocked || !plaque.isActive) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center select-none">
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
