import React, { useEffect } from 'react';
import { Home, BarChart2, List, Settings } from 'lucide-react';
import { useStore } from '../store';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'analytics' | 'history' | 'settings';
  onTabChange: (tab: 'dashboard' | 'analytics' | 'history' | 'settings') => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Registro' },
    { id: 'analytics', icon: BarChart2, label: 'Análisis' },
    { id: 'history', icon: List, label: 'Historial' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
  ] as const;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <header className="bg-theme-base text-theme-text px-4 py-4 shadow-sm z-10 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Boyita App</h1>
        <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
          <span className="text-sm font-bold">👶</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-lg pb-safe z-20">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                  isActive ? "text-theme-dark" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Icon className={cn("w-6 h-6", isActive && "fill-theme-light")} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
