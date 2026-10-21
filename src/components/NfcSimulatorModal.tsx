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
      <div className="w-full sm:max-w-md bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#27272a] flex items-center justify-between sticky top-0 bg-[#121214] z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-600/10 text-red-500">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-white">
                Simulador de Acesso Físico
              </h2>
              <p className="text-xs text-zinc-400">
                Teste o comportamento do cliente final na loja
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

        <div className="p-4 sm:p-6 flex flex-col gap-5">
          {/* Plaque Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Selecione a Placa Física para Testar:
            </label>
            <select
              value={activePlaqueId}
              onChange={(e) => setActivePlaqueId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-sm text-white focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {plaques.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} (/r/{p.slug}) {p.isLocked ? '[BLOQUEADA]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Source Mode Toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Modo de Interação do Celular:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSourceMode('nfc')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                  sourceMode === 'nfc'
                    ? 'bg-red-950/60 border-red-600 text-white font-semibold shadow-md shadow-red-950/30'
                    : 'bg-[#0a0a0c] border-[#27272a] text-zinc-400 hover:text-white'
                }`}
              >
                <Radio className="w-4 h-4 text-red-500" />
                <span>Toque NFC</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('qr')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                  sourceMode === 'qr'
                    ? 'bg-zinc-800 border-zinc-500 text-white font-semibold'
                    : 'bg-[#0a0a0c] border-[#27272a] text-zinc-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4 text-zinc-300" />
                <span>Câmera QR Code</span>
              </button>
            </div>
          </div>

          {/* Interactive Tap Zone */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#0a0a0c] border border-[#27272a] relative overflow-hidden text-center gap-3">
            {currentPlaque?.isLocked && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Bloqueada
              </div>
            )}

            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                tapping
                  ? 'scale-110 bg-red-600 text-white ring-8 ring-red-600/30'
                  : 'bg-gradient-to-b from-red-600/20 to-red-950/40 text-red-500 border border-red-500/30'
              }`}
            >
              {sourceMode === 'nfc' ? (
                <Radio className={`w-9 h-9 ${tapping ? 'animate-ping' : ''}`} />
              ) : (
                <QrCode className="w-9 h-9" />
              )}
            </div>

            <div>
              <p className="font-heading font-semibold text-white text-sm">
                {currentPlaque?.title}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Destino atual: <span className="text-zinc-200">{currentPlaque?.targetUrl}</span>
              </p>
            </div>

            <button
              onClick={handleSimulateTouch}
              disabled={tapping}
              className="mt-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold text-xs transition-all shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
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

          <div className="p-3 rounded-xl bg-[#16161a] border border-[#27272a] flex items-center gap-2 text-xs text-zinc-400">
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
