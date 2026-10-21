import React, { useState } from 'react';
import { 
  BarChart3, 
  Radio, 
  QrCode, 
  Smartphone, 
  Clock, 
  Layers, 
  TrendingUp,
  Apple,
  Bot
} from 'lucide-react';
import { Plaque, ScanEvent, UserRole } from '../types';

interface AnalyticsViewProps {
  plaques: Plaque[];
  scans: ScanEvent[];
  userRole: UserRole;
  clientName?: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  plaques,
  scans,
  userRole,
  clientName,
}) => {
  const [filterPlaqueId, setFilterPlaqueId] = useState<string>('all');

  const filteredPlaques = filterPlaqueId === 'all'
    ? plaques
    : plaques.filter((p) => p.id === filterPlaqueId);

  const totalNfc = filteredPlaques.reduce((sum, p) => sum + p.totalNfcScans, 0);
  const totalQr = filteredPlaques.reduce((sum, p) => sum + p.totalQrScans, 0);
  const totalOverall = totalNfc + totalQr;

  const nfcRatio = totalOverall > 0 ? Math.round((totalNfc / totalOverall) * 100) : 50;
  const qrRatio = totalOverall > 0 ? 100 - nfcRatio : 50;

  const displayedScans = filterPlaqueId === 'all'
    ? scans
    : scans.filter((s) => s.plaqueId === filterPlaqueId);

  return (
    <div className="flex flex-col gap-6 pb-24 max-w-5xl mx-auto px-4 pt-4 sm:pt-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
            {userRole === 'admin' ? 'Métricas Globais GoldFlow' : `Métricas de ${clientName || 'Sua Conta'}`}
          </span>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-white">
            Estatísticas de Acessos
          </h1>
        </div>

        {/* Filter by Plaque */}
        <div className="flex items-center gap-2 bg-[#121214] border border-[#27272a] rounded-xl px-3 py-1.5 self-start sm:self-auto">
          <span className="text-xs text-zinc-400">Filtrar:</span>
          <select
            value={filterPlaqueId}
            onChange={(e) => setFilterPlaqueId(e.target.value)}
            className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#121214]">Todas as Placas ({plaques.length})</option>
            {plaques.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#121214]">
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Overall */}
        <div className="rounded-2xl bg-[#121214] border border-[#27272a] p-4 flex flex-col gap-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total de Acessos</span>
            <TrendingUp className="w-4 h-4 text-zinc-400" />
          </div>
          <span className="font-heading font-extrabold text-2xl sm:text-3xl text-white tabular-nums tracking-tight">
            {totalOverall}
          </span>
          <span className="text-[11px] text-zinc-400">Leituras registradas</span>
        </div>

        {/* NFC Scans */}
        <div className="rounded-2xl bg-[#121214] border border-[#27272a] p-4 flex flex-col gap-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Aproximação NFC</span>
            <Radio className="w-4 h-4 text-red-500" />
          </div>
          <span className="font-heading font-extrabold text-2xl sm:text-3xl text-red-400 tabular-nums tracking-tight">
            {totalNfc}
          </span>
          <span className="text-[11px] text-zinc-400">
            {nfcRatio}% do total
          </span>
        </div>

        {/* QR Code Scans */}
        <div className="rounded-2xl bg-[#121214] border border-[#27272a] p-4 flex flex-col gap-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Câmera QR Code</span>
            <QrCode className="w-4 h-4 text-zinc-300" />
          </div>
          <span className="font-heading font-extrabold text-2xl sm:text-3xl text-zinc-100 tabular-nums tracking-tight">
            {totalQr}
          </span>
          <span className="text-[11px] text-zinc-400">
            {qrRatio}% do total
          </span>
        </div>

        {/* Active Plaques */}
        <div className="rounded-2xl bg-[#121214] border border-[#27272a] p-4 flex flex-col gap-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Placas Monitoradas</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-heading font-extrabold text-2xl sm:text-3xl text-emerald-400 tabular-nums tracking-tight">
            {filteredPlaques.filter((p) => p.isActive && !p.isLocked).length}
          </span>
          <span className="text-[11px] text-zinc-400">
            de {filteredPlaques.length} cadastradas
          </span>
        </div>
      </div>

      {/* Comparison Progress Block */}
      <div className="rounded-2xl bg-[#121214] border border-[#27272a] p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-white">
            Distribuição de Canais Físicos
          </h3>
          <span className="text-xs text-zinc-400">NFC vs QR Code</span>
        </div>

        {/* Visual Channel Split Bar */}
        <div className="h-4 w-full rounded-full bg-zinc-800 overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${nfcRatio}%` }}
            className="bg-gradient-to-r from-red-600 to-rose-600 transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white tracking-wider"
          >
            {nfcRatio > 15 ? `${nfcRatio}% NFC` : ''}
          </div>
          <div
            style={{ width: `${qrRatio}%` }}
            className="bg-gradient-to-r from-zinc-500 to-zinc-400 transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-black tracking-wider"
          >
            {qrRatio > 15 ? `${qrRatio}% QR` : ''}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-red-500" />
            <span className="text-zinc-300 font-medium">Toque NFC:</span>
            <span className="font-mono text-white font-bold">{totalNfc}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-zinc-400" />
            <span className="text-zinc-300 font-medium">Leitura QR Code:</span>
            <span className="font-mono text-white font-bold">{totalQr}</span>
          </div>
        </div>
      </div>

      {/* Detailed Plaque Metrics Table */}
      <div className="rounded-2xl bg-[#121214] border border-[#27272a] overflow-hidden">
        <div className="p-4 border-b border-[#27272a]">
          <h3 className="font-heading font-bold text-sm text-white">
            Desempenho Individual por Placa
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0a0a0c] text-zinc-400 font-semibold border-b border-[#27272a]">
              <tr>
                <th className="py-3 px-4">Placa / Identificador</th>
                <th className="py-3 px-4">Destino Atual</th>
                <th className="py-3 px-4 text-right">NFC</th>
                <th className="py-3 px-4 text-right">QR Code</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f23] text-zinc-300">
              {filteredPlaques.map((plaque) => {
                const pTotal = plaque.totalNfcScans + plaque.totalQrScans;
                return (
                  <tr key={plaque.id} className="hover:bg-[#16161a] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{plaque.title}</div>
                      <div className="font-mono text-[11px] text-zinc-400">/r/{plaque.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="truncate max-w-[160px] inline-block font-mono text-[11px] text-zinc-400">
                        {plaque.targetUrl}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-red-400 font-semibold">
                      {plaque.totalNfcScans}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-300 font-semibold">
                      {plaque.totalQrScans}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-white font-bold text-sm">
                      {pTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Scan Log (Last events) */}
      <div className="rounded-2xl bg-[#121214] border border-[#27272a] p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            <h3 className="font-heading font-bold text-sm text-white">
              Registro Recente de Scans em Tempo Real
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            {displayedScans.length} eventos registrados
          </span>
        </div>

        {displayedScans.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            Nenhum scan registrado ainda. Use o botão "Testar NFC" no topo para simular leituras.
          </div>
        ) : (
          <div className="divide-y divide-[#1f1f23] flex flex-col">
            {displayedScans.slice(0, 10).map((scan) => {
              const matchedPlaque = plaques.find((p) => p.id === scan.plaqueId);
              return (
                <div key={scan.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`p-1.5 rounded-lg shrink-0 ${
                        scan.source === 'nfc'
                          ? 'bg-red-950/60 text-red-400 border border-red-900/60'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {scan.source === 'nfc' ? <Radio className="w-3.5 h-3.5" /> : <QrCode className="w-3.5 h-3.5" />}
                    </span>
                    <div className="truncate">
                      <div className="font-medium text-white truncate">
                        {matchedPlaque ? matchedPlaque.title : 'Placa Física'}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {scan.source === 'nfc' ? 'Aproximação por Chip NFC' : 'Câmera QR Code'} · {scan.deviceType}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] text-zinc-400 shrink-0 font-mono">
                    {new Date(scan.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
