import React, { useEffect } from 'react';
import { Baby, ClipboardList, BookHeart, Activity, Award, Settings } from 'lucide-react';
import { useStore } from '../store';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';
const logoUrl = "/src/assets/images/boyita_app_logo_1780186577604.png";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'analytics' | 'history' | 'settings' | 'trophyPath' | 'bitacora';
  onTabChange: (tab: 'dashboard' | 'analytics' | 'history' | 'settings' | 'trophyPath' | 'bitacora') => void;
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
    { id: 'dashboard', icon: Baby, label: 'Registro' },
    { id: 'history', icon: ClipboardList, label: 'Historial' },
    { id: 'bitacora', icon: BookHeart, label: 'Bitácora' },
    { id: 'analytics', icon: Activity, label: 'Análisis' },
    { id: 'trophyPath', icon: Award, label: 'Logros' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
  ] as const;

  return (
    <div className="flex h-[100dvh] bg-gray-50 dark:bg-gray-900 overflow-hidden flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-theme-base dark:bg-theme-dark/40 text-theme-text dark:text-theme-base px-4 py-4 shadow-sm z-50 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-semibold tracking-tight">Boyita App</h1>
        <div className="w-8 h-8 rounded-full bg-white/10 dark:bg-black/10 overflow-hidden flex items-center justify-center border border-white/20">
          <img src={logoUrl} alt="Boyita logotype" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </header>

      {/* Sidebar (Tablet/Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20 shrink-0">
        <div className="p-6 flex items-center space-x-3 bg-theme-base dark:bg-theme-dark/40 text-theme-text dark:text-theme-base">
          <div className="w-10 h-10 rounded-full bg-white/15 dark:bg-black/15 overflow-hidden flex items-center justify-center border border-white/25">
            <img src={logoUrl} alt="Boyita logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Boyita App</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center w-full px-4 py-3 rounded-xl transition-all space-x-3 relative overflow-hidden group select-none outline-none",
                  isActive 
                    ? "text-theme-dark dark:text-theme-base font-bold scale-[1.02]" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarTabBackground"
                    className="absolute inset-0 bg-theme-base/20 dark:bg-theme-base/15 rounded-xl border border-theme-base/10"
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
                <span className="relative z-10 flex items-center space-x-3 pointer-events-none">
                  <Icon className={cn(
                    "w-6 h-6 transition-transform duration-300 group-hover:scale-110", 
                    isActive && "text-theme-dark dark:text-theme-base"
                  )} />
                  <span className="text-base">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative w-full">
        <div className="max-w-4xl mx-auto w-full min-h-full">
          {children}
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe z-50">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative outline-none select-none",
                  isActive ? "text-theme-dark dark:text-theme-base" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                )}
              >
                <div className="p-1.5 rounded-full relative">
                  {isActive && (
                    <motion.div
                      layoutId="activeMobileTabBackground"
                      className="absolute inset-0 bg-theme-base/20 dark:bg-theme-base/15 rounded-full"
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                  <Icon className={cn("w-6 h-6 transition-transform duration-300 relative z-10", isActive && "scale-105")} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all relative z-10",
                  isActive ? "font-bold" : ""
                )}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
