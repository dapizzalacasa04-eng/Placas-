import React from 'react';
import { Radio, Database, Smartphone, Layers, QrCode, BarChart3, Users, HelpCircle, Plus } from 'lucide-react';
import { UserProfile } from '../types';
import { TabType } from './BottomTabBar';

interface NavbarProps {
  currentUser: UserProfile;
  users: UserProfile[];
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onSwitchUser: (userId: string) => void;
  onOpenSupabaseModal: () => void;
  onOpenNfcSimulator: () => void;
  onOpenNewPlaqueModal: () => void;
  isSupabaseConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users,
  activeTab,
  onSelectTab,
  onSwitchUser,
  onOpenSupabaseModal,
  onOpenNfcSimulator,
  onOpenNewPlaqueModal,
  isSupabaseConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#060b17]/95 backdrop-blur-md border-b border-[#1b2f52] px-4 md:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div 
            onClick={() => onSelectTab('plaques')}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-950/60 text-white font-bold border border-blue-400/30 cursor-pointer"
          >
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div 
            onClick={() => onSelectTab('plaques')}
            className="flex flex-col cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg sm:text-xl font-extrabold tracking-tight text-white">
                GoldFlow
              </span>
              <span className="text-blue-400 font-extrabold text-[11px] tracking-wider uppercase bg-blue-950 px-2 py-0.5 rounded-lg border border-blue-800/80">
                NFC
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden xs:block">
              Placas Inteligentes & QR Codes
            </span>
          </div>
        </div>

        {/* Zone 2: Desktop Menu Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#0b1528] p-1.5 rounded-2xl border border-[#1b2f52]">
          <button
            onClick={() => onSelectTab('plaques')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'plaques'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                : 'text-slate-300 hover:text-white hover:bg-[#12213d]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Placas & Links</span>
          </button>

          <button
            onClick={() => onSelectTab('guide')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'guide'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                : 'text-slate-300 hover:text-white hover:bg-[#12213d]'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <span>Passo a Passo</span>
          </button>

          <button
            onClick={() => onSelectTab('qr_studio')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'qr_studio'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                : 'text-slate-300 hover:text-white hover:bg-[#12213d]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Central QR Code</span>
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                : 'text-slate-300 hover:text-white hover:bg-[#12213d]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Métricas</span>
          </button>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => onSelectTab('clients')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'clients'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                  : 'text-slate-300 hover:text-white hover:bg-[#12213d]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Clientes & Lojas</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Profile Switcher & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Profile Switcher */}
          <div className="flex items-center gap-1.5 bg-[#0b1528] border border-[#1b2f52] rounded-2xl px-3 py-1.5 text-xs shadow-inner">
            <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Perfil:</span>
            <select
              value={currentUser.id}
              onChange={(e) => onSwitchUser(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer max-w-[120px] sm:max-w-[160px] truncate"
              title="Trocar perfil de acesso (Administrador ou Loja/Cliente)"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#0b1528] text-white">
                  {u.role === 'admin' ? '🛡️ Admin GoldFlow' : `🏪 ${u.companyName}`}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={onOpenNewPlaqueModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-950 hover:scale-[1.02] active:scale-[0.98]"
            title="Criar nova placa inteligente NFC"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Placa</span>
          </button>

          {/* Simulate NFC Touch */}
          <button
            onClick={onOpenNfcSimulator}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#0b1528] hover:bg-[#12213d] text-slate-200 border border-[#1b2f52] text-xs font-bold transition-all shadow-sm"
            title="Simular aproximação física do celular no balcão"
          >
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline">Testar Toque</span>
          </button>

          {/* Supabase Status */}
          <button
            onClick={onOpenSupabaseModal}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all border ${
              isSupabaseConnected
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/80'
                : 'bg-[#0b1528] text-blue-300 border-[#1b2f52] hover:bg-[#12213d]'
            }`}
            title="Configurar credenciais Supabase e visualizar SQL com RLS"
          >
            <Database className="w-4 h-4 text-blue-400" />
            <span className="hidden xl:inline">{isSupabaseConnected ? 'Supabase Conectado' : 'Supabase SQL'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
