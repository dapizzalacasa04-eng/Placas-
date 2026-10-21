import React from 'react';
import { Radio, Database, Shield, UserCheck, Smartphone } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentUser: UserProfile;
  users: UserProfile[];
  onSwitchUser: (userId: string) => void;
  onOpenSupabaseModal: () => void;
  onOpenNfcSimulator: () => void;
  isSupabaseConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users,
  onSwitchUser,
  onOpenSupabaseModal,
  onOpenNfcSimulator,
  isSupabaseConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0c]/95 backdrop-blur-md border-b border-[#27272a] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 md:gap-8 transition-colors">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-950/40 text-white font-bold">
          <Radio className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-lg font-bold tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
            GoldFlow <span className="text-red-500 font-extrabold text-sm tracking-wider uppercase">NFC</span>
          </span>
        </div>
      </div>

      {/* Zone 2: Role Switcher & Context */}
      <div className="hidden sm:flex items-center gap-2 max-w-md truncate">
        <div className="flex items-center gap-2 bg-[#121214] border border-[#27272a] rounded-lg px-2.5 py-1 text-xs">
          <span className="text-zinc-400">Perfil:</span>
          <select
            value={currentUser.id}
            onChange={(e) => onSwitchUser(e.target.value)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id} className="bg-[#121214] text-white">
                {u.role === 'admin' ? '🛡️ ' : '🏪 '}
                {u.fullName} — {u.companyName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-zinc-400">
          <span>{currentUser.role === 'admin' ? 'Acesso Total' : 'Acesso Lojista (RLS)'}</span>
        </div>
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* NFC Plate Touch Simulator Trigger */}
        <button
          onClick={onOpenNfcSimulator}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1e] hover:bg-[#27272a] text-zinc-200 border border-[#27272a] text-xs font-medium transition-colors whitespace-nowrap"
          title="Simular toque de celular na placa NFC física"
        >
          <Smartphone className="w-3.5 h-3.5 text-red-500" />
          <span className="hidden xs:inline">Testar NFC</span>
        </button>

        {/* Supabase Status / Settings */}
        <button
          onClick={onOpenSupabaseModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border ${
            isSupabaseConnected
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50'
              : 'bg-[#18181b] text-zinc-300 border-[#27272a] hover:bg-[#27272a]'
          }`}
          title="Configurar credenciais Supabase e visualizar SQL com RLS"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isSupabaseConnected ? 'Supabase Conectado' : 'Supabase SQL'}</span>
        </button>
      </div>
    </header>
  );
};
