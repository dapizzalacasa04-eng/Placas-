import React from 'react';
import { Layers, QrCode, BarChart3, Users, Smartphone } from 'lucide-react';
import { UserRole } from '../types';

export type TabType = 'plaques' | 'qr_studio' | 'analytics' | 'clients' | 'simulator';

interface BottomTabBarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  userRole: UserRole;
  plaquesCount: number;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  plaquesCount,
}) => {
  const tabs = [
    {
      id: 'plaques' as TabType,
      label: 'Placas',
      icon: Layers,
      badge: plaquesCount,
    },
    {
      id: 'qr_studio' as TabType,
      label: 'Gerador QR',
      icon: QrCode,
    },
    {
      id: 'analytics' as TabType,
      label: 'Métricas',
      icon: BarChart3,
    },
    ...(userRole === 'admin'
      ? [
          {
            id: 'clients' as TabType,
            label: 'Clientes',
            icon: Users,
          },
        ]
      : []),
    {
      id: 'simulator' as TabType,
      label: 'Simular NFC',
      icon: Smartphone,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0c]/95 backdrop-blur-lg border-t border-[#27272a] px-2 py-1 md:py-2 max-w-lg md:max-w-xl mx-auto md:bottom-4 md:rounded-2xl md:border md:shadow-2xl md:shadow-black/80">
      <div className={`grid ${tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4'} items-center`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 transition-all rounded-xl relative ${
                isActive
                  ? 'text-red-500 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 text-[10px] font-mono font-bold bg-red-600 text-white rounded-full px-1 min-w-[16px] text-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 truncate max-w-full">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
