import React, { useState } from 'react';
import { X, Smartphone, Radio, QrCode, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { Plaque } from '../types';

interface NfcSimulatorModalProps {
  plaques: Plaque[];
  selectedPlaque: Plaque | null;
  isOpen: boolean;
  onClose: () => void;
  onExecuteScan: (slug: string, source: 'nfc' | 'qr') => void;
}

export const NfcSimulatorModal: React.FC<NfcSimulatorModalProps> = ({
  plaques,
  selectedPlaque,
  isOpen,
  onClose,
  onExecuteScan,
}) => {
  if (!isOpen) return null;

  const [activePlaqueId, setActivePlaqueId] = useState<string>(
    selectedPlaque?.id || plaques[0]?.id || ''
  );
  const [sourceMode, setSourceMode] = useState<'nfc' | 'qr'>('nfc');
  const [tapping, setTapping] = useState(false);

  const currentPlaque = plaques.find((p) => p.id === activePlaqueId) || plaques[0];

  const handleSimulateTouch = () => {
    if (!currentPlaque) return;
    setTapping(true);

    setTimeout(() => {
      setTapping(false);
      onExecuteScan(currentPlaque.slug, sourceMode);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-[#0b1528] border border-[#1e355b] rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl shadow-blue-950/60">
        {/* Header */}
        <div className="p-5 border-b border-[#1b2f52] flex items-center justify-between sticky top-0 bg-[#0b1528] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-white">
                Simulador de Acesso no Celular
              </h2>
              <p className="text-xs text-slate-400">
                Teste o comportamento real do cliente final na loja
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

        <div className="p-5 sm:p-6 flex flex-col gap-5">
          {/* Plaque Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300">
              Selecione a Placa Física para Testar:
            </label>
            <select
              value={activePlaqueId}
              onChange={(e) => setActivePlaqueId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
            >
              {plaques.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0b1528]">
                  {p.title} (/r/{p.slug}) {p.isLocked ? '[BLOQUEADA]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Source Mode Toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300">
              Modo de Interação do Celular:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSourceMode('nfc')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  sourceMode === 'nfc'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-950'
                    : 'bg-[#070d1a] border-[#1b2f52] text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>Toque NFC</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('qr')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  sourceMode === 'qr'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-950'
                    : 'bg-[#070d1a] border-[#1b2f52] text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Câmera QR Code</span>
              </button>
            </div>
          </div>

          {/* Interactive Tap Zone */}
          <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-[#070d1a] border border-[#1b2f52] relative overflow-hidden text-center gap-3">
            {currentPlaque?.isLocked && (
              <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Bloqueada
              </div>
            )}

            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-2xl ${
                tapping
                  ? 'scale-110 bg-blue-500 text-white ring-8 ring-blue-500/30'
                  : 'bg-gradient-to-b from-blue-600/20 to-blue-950/40 text-blue-400 border border-blue-500/30'
              }`}
            >
              {sourceMode === 'nfc' ? (
                <Radio className={`w-9 h-9 ${tapping ? 'animate-ping' : ''}`} />
              ) : (
                <QrCode className="w-9 h-9" />
              )}
            </div>

            <div>
              <p className="font-heading font-extrabold text-white text-base">
                {currentPlaque?.title}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[260px]">
                Destino atual: <span className="text-slate-200 font-mono">
                  {sourceMode === 'qr' ? (currentPlaque?.qrTargetUrl || currentPlaque?.targetUrl) : currentPlaque?.targetUrl}
                </span>
              </p>
            </div>

            <button
              onClick={handleSimulateTouch}
              disabled={tapping}
              className="mt-2 w-full min-h-[50px] py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-blue-950/60 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <span>
                {tapping
                  ? 'Gravando Telemetria...'
                  : sourceMode === 'nfc'
                  ? 'Aproximar Celular do NFC Agora'
                  : 'Escanear QR Code com a Câmera'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#070d1a] border border-[#1b2f52] flex items-center gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Ao acionar, o sistema registrará 1 acesso (+1 na métrica correspondente) e executará o teste real de redirecionamento ou bloqueio.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
