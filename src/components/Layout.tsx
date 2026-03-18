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
  const colorMode = useStore((state) => state.colorMode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const applyColorMode = () => {
      if (colorMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (colorMode === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // system
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    applyColorMode();

    if (colorMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyColorMode();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [colorMode]);

  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Registro' },
    { id: 'analytics', icon: BarChart2, label: 'Análisis' },
    { id: 'history', icon: List, label: 'Historial' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
  ] as const;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <header className="bg-theme-base dark:bg-theme-dark/40 text-theme-text dark:text-theme-base px-4 py-4 shadow-sm z-10 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Boyita App</h1>
        <div className="w-8 h-8 rounded-full bg-white/30 dark:bg-black/20 flex items-center justify-center">
          <span className="text-sm font-bold">👶</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg pb-safe z-20">
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
                  isActive ? "text-theme-dark dark:text-theme-base" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                )}
              >
                <Icon className={cn("w-6 h-6", isActive && "fill-theme-light dark:fill-theme-dark/30")} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
