import React from 'react';
import { Layers, QrCode, BarChart3, Users, HelpCircle } from 'lucide-react';
import { UserRole } from '../types';

export type TabType = 'plaques' | 'guide' | 'qr_studio' | 'analytics' | 'clients';

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
      id: 'guide' as TabType,
      label: 'Passo a Passo',
      icon: HelpCircle,
    },
    {
      id: 'qr_studio' as TabType,
      label: 'QR Code',
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
            label: 'Empresas',
            icon: Users,
          },
        ]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#060b17]/95 backdrop-blur-xl border-t border-[#1b2f52] px-2 py-1.5 md:py-2 max-w-xl mx-auto md:bottom-4 md:rounded-3xl md:border md:shadow-2xl md:shadow-black/90">
      <div className={`grid ${tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4'} items-center`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[52px] py-1.5 px-1 transition-all rounded-2xl relative ${
                isActive
                  ? 'text-blue-400 font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-blue-400' : ''}`} />
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 text-[10px] font-mono font-bold bg-blue-600 text-white rounded-full px-1 min-w-[16px] text-center shadow-md shadow-blue-950">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-tight mt-1 truncate max-w-full font-bold">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
