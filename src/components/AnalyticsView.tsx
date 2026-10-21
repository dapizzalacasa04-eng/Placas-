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
    <div className="flex flex-col gap-6 pb-28 max-w-5xl mx-auto px-4 pt-4 sm:pt-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            {userRole === 'admin' ? 'Métricas Globais GoldFlow' : `Métricas de ${clientName || 'Sua Conta'}`}
          </span>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-white">
            Estatísticas & Acessos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas segmentadas em tempo real entre aproximação por chip NFC e leitura de câmera QR Code
          </p>
        </div>

        {/* Filter by Plaque */}
        <div className="flex items-center gap-2 bg-[#0b1528] border border-[#1b2f52] rounded-2xl px-3.5 py-2 self-start sm:self-auto shadow-sm">
          <span className="text-xs text-slate-400 font-bold">Filtrar:</span>
          <select
            value={filterPlaqueId}
            onChange={(e) => setFilterPlaqueId(e.target.value)}
            className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#0b1528]">Todas as Placas ({plaques.length})</option>
            {plaques.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#0b1528]">
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Overall */}
        <div className="rounded-3xl bg-[#0b1528] border border-[#1b2f52] p-5 flex flex-col gap-1 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Total de Acessos</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-heading font-extrabold text-2xl sm:text-3xl text-white tabular-nums tracking-tight mt-1">
            {totalOverall}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Leituras registradas</span>
        </div>

        {/* NFC Scans */}
        <div className="rounded-3xl bg-[#0b1528] border border-[#1b2f52] p-5 flex flex-col gap-1 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Aproximação NFC</span>
            <Radio className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-heading font-extrabold text-2xl sm:text-3xl text-blue-400 tabular-nums tracking-tight mt-1">
            {totalNfc}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {nfcRatio}% do total
          </span>
        </div>

        {/* QR Code Scans */}
        <div className="rounded-3xl bg-[#0b1528] border border-[#1b2f52] p-5 flex flex-col gap-1 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Câmera QR Code</span>
            <QrCode className="w-4 h-4 text-slate-300" />
          </div>
          <span className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-100 tabular-nums tracking-tight mt-1">
            {totalQr}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {qrRatio}% do total
          </span>
        </div>

        {/* Active Plaques */}
        <div className="rounded-3xl bg-[#0b1528] border border-[#1b2f52] p-5 flex flex-col gap-1 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Placas Monitoradas</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-heading font-extrabold text-2xl sm:text-3xl text-emerald-400 tabular-nums tracking-tight mt-1">
            {filteredPlaques.filter((p) => p.isActive && !p.isLocked).length}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            de {filteredPlaques.length} cadastradas
          </span>
        </div>
      </div>

      {/* Comparison Progress Block */}
      <div className="rounded-3xl bg-[#0b1528] border border-[#1b2f52] p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-white">
            Distribuição de Canais Físicos
          </h3>
          <span className="text-xs text-slate-400 font-semibold">NFC vs QR Code</span>
        </div>

        {/* Visual Channel Split Bar */}
        <div className="h-5 w-full rounded-full bg-[#070d1a] border border-[#14233e] overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${nfcRatio}%` }}
            className="bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white tracking-wider"
          >
            {nfcRatio > 15 ? `${nfcRatio}% NFC` : ''}
          </div>
          <div
            style={{ width: `${qrRatio}%` }}
            className="bg-gradient-to-r from-slate-600 to-slate-400 transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-black tracking-wider"
          >
            {qrRatio > 15 ? `${qrRatio}% QR` : ''}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-blue-500" />
            <span className="text-slate-300 font-bold">Toque NFC:</span>
            <span className="font-mono text-white font-extrabold">{totalNfc} acessos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-400" />
            <span className="text-slate-300 font-bold">Leitura QR Code:</span>
            <span className="font-mono text-white font-extrabold">{totalQr} acessos</span>
          </div>
        </div>
      </div>

      {/* Detailed Plaque Metrics Table */}
      <div className="rounded-3xl bg-[#0b1528] border border-[#1b2f52] overflow-hidden shadow-xl">
        <div className="p-5 border-b border-[#1b2f52]">
          <h3 className="font-heading font-bold text-base text-white">
            Desempenho Individual por Placa
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070d1a] text-slate-400 font-bold border-b border-[#1b2f52]">
              <tr>
                <th className="py-3.5 px-5">Placa / Identificador</th>
                <th className="py-3.5 px-5">Destino Atual</th>
                <th className="py-3.5 px-5 text-right">NFC</th>
                <th className="py-3.5 px-5 text-right">QR Code</th>
                <th className="py-3.5 px-5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14233e] text-slate-300">
              {filteredPlaques.map((plaque) => {
                const pTotal = plaque.totalNfcScans + plaque.totalQrScans;
                return (
                  <tr key={plaque.id} className="hover:bg-[#0e192f] transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-white text-sm">{plaque.title}</div>
                      <div className="font-mono text-[11px] text-slate-400">/r/{plaque.slug}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="truncate max-w-[220px] inline-block font-mono text-[11px] text-slate-300">
                        {plaque.targetUrl}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-blue-400 font-bold text-sm">
                      {plaque.totalNfcScans}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-200 font-bold text-sm">
                      {plaque.totalQrScans}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-white font-extrabold text-sm">
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
      <div className="rounded-3xl bg-[#0b1528] border border-[#1b2f52] p-5 sm:p-6 flex flex-col gap-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="font-heading font-bold text-base text-white">
              Histórico Recente de Acessos
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {displayedScans.length} registros
          </span>
        </div>

        {displayedScans.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Nenhum scan registrado ainda. Use o botão "Testar no Celular" para simular leituras.
          </div>
        ) : (
          <div className="divide-y divide-[#14233e] flex flex-col">
            {displayedScans.slice(0, 10).map((scan) => {
              const matchedPlaque = plaques.find((p) => p.id === scan.plaqueId);
              return (
                <div key={scan.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`p-2 rounded-xl shrink-0 ${
                        scan.source === 'nfc'
                          ? 'bg-blue-950/70 text-blue-400 border border-blue-800'
                          : 'bg-[#15274d] text-slate-300'
                      }`}
                    >
                      {scan.source === 'nfc' ? <Radio className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                    </span>
                    <div className="truncate">
                      <div className="font-bold text-white truncate text-sm">
                        {matchedPlaque ? matchedPlaque.title : 'Placa Física'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {scan.source === 'nfc' ? 'Aproximação por Chip NFC' : 'Câmera QR Code'} · {scan.deviceType}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 shrink-0 font-mono font-medium">
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
