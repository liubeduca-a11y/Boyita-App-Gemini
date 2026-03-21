import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Share2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { subDays, startOfMonth, isAfter, isBefore, startOfDay, endOfDay, format, startOfHour } from 'date-fns';
import { toBlob } from 'html-to-image';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { cn } from '../components/Layout';
import { PediatricianChat } from '../components/PediatricianChat';

type FilterType = '24h' | '7d' | 'month' | 'custom';

export function Analytics() {
  const [filter, setFilter] = useState<FilterType>('24h');
  const [customStart, setCustomStart] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const events = useStore(state => state.events);

  const analyticsRef = React.useRef<HTMLDivElement>(null);

  // --- Today vs Yesterday Stats ---
  const todayStats = useMemo(() => {
    const start = startOfDay(new Date());
    const end = endOfDay(new Date());
    const todayEvents = events.filter(e => {
      const d = new Date(e.timestamp);
      return isAfter(d, start) && isBefore(d, end);
    });

    let oz = 0;
    let diapers = 0;
    let pee = 0;
    let sleepMs = 0;

    todayEvents.forEach(e => {
      if (e.type === 'feeding' && e.details?.amount) oz += e.details.amount;
      if (e.type === 'hygiene') {
        diapers += 1;
        if (e.details?.hygieneType === 'pee') pee += 1;
      }
      if (e.type === 'sleep' && e.endTimestamp) sleepMs += (e.endTimestamp - e.timestamp);
    });

    return { oz, diapers, pee, sleepHours: sleepMs / (1000 * 60 * 60) };
  }, [events]);

  const yesterdayStats = useMemo(() => {
    const start = startOfDay(subDays(new Date(), 1));
    const end = endOfDay(subDays(new Date(), 1));
    const yesterdayEvents = events.filter(e => {
      const d = new Date(e.timestamp);
      return isAfter(d, start) && isBefore(d, end);
    });

    let oz = 0;
    let diapers = 0;
    let pee = 0;
    let sleepMs = 0;

    yesterdayEvents.forEach(e => {
      if (e.type === 'feeding' && e.details?.amount) oz += e.details.amount;
      if (e.type === 'hygiene') {
        diapers += 1;
        if (e.details?.hygieneType === 'pee') pee += 1;
      }
      if (e.type === 'sleep' && e.endTimestamp) sleepMs += (e.endTimestamp - e.timestamp);
    });

    return { oz, diapers, pee, sleepHours: sleepMs / (1000 * 60 * 60) };
  }, [events]);

  // --- Filtered Events for Charts ---
  const filteredEvents = useMemo(() => {
    const now = new Date();
    
    if (filter === '24h') {
      const start = startOfDay(subDays(now, 1));
      const end = endOfDay(subDays(now, 1));
      return events.filter(e => {
        const eventDate = new Date(e.timestamp);
        return isAfter(eventDate, start) && isBefore(eventDate, end);
      });
    }

    if (filter === 'custom') {
      const start = startOfDay(new Date(customStart));
      const end = endOfDay(new Date(customEnd));
      return events.filter(e => {
        const eventDate = new Date(e.timestamp);
        return isAfter(eventDate, start) && isBefore(eventDate, end);
      });
    }

    let cutoffDate = now;
    if (filter === '7d') cutoffDate = subDays(now, 7);
    if (filter === 'month') cutoffDate = startOfMonth(now);

    return events.filter(e => isAfter(new Date(e.timestamp), cutoffDate));
  }, [events, filter, customStart, customEnd]);

  // --- Chart Data Aggregation ---
  const chartData = useMemo(() => {
    const isSingleDay = filter === '24h' || (filter === 'custom' && customStart === customEnd);
    const dataMap = new Map<string, any>();

    filteredEvents.forEach(e => {
      const date = new Date(e.timestamp);
      const key = isSingleDay ? format(date, 'HH:00') : format(date, 'MMM dd');
      
      if (!dataMap.has(key)) {
        dataMap.set(key, { 
          label: key, 
          timestamp: isSingleDay ? startOfHour(date).getTime() : startOfDay(date).getTime(), 
          oz: 0, 
          burps: 0, 
          pee: 0, 
          poo: 0 
        });
      }
      const entry = dataMap.get(key);
      
      if (e.type === 'feeding' && e.details?.amount) entry.oz += e.details.amount;
      if (e.type === 'burp') entry.burps += 1;
      if (e.type === 'hygiene') {
        if (e.details?.hygieneType === 'pee') entry.pee += 1;
        if (e.details?.hygieneType === 'poo') entry.poo += 1;
      }
    });

    return Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredEvents, filter, customStart, customEnd]);

  // --- Sleep Pie Chart Data ---
  const sleepStats = useMemo(() => {
    const totalSleepMs = filteredEvents
      .filter(e => e.type === 'sleep' && e.endTimestamp)
      .reduce((acc, curr) => acc + (curr.endTimestamp! - curr.timestamp), 0);
    
    let periodMs = 24 * 60 * 60 * 1000;
    if (filter === '7d') periodMs *= 7;
    if (filter === 'month') periodMs *= 30;
    if (filter === 'custom') {
      const start = startOfDay(new Date(customStart));
      const end = endOfDay(new Date(customEnd));
      periodMs = Math.max(24 * 60 * 60 * 1000, end.getTime() - start.getTime());
    }

    const awakeMs = periodMs - totalSleepMs;

    return [
      { name: 'Dormido', value: totalSleepMs, fill: '#818cf8' },
      { name: 'Despierto', value: Math.max(0, awakeMs), fill: '#e0e7ff' }
    ];
  }, [filteredEvents, filter, customStart, customEnd]);

  const formatSleepHours = (ms: number) => (ms / (1000 * 60 * 60)).toFixed(1);

  const handleShare = async () => {
    if (!analyticsRef.current) return;
    try {
      const blob = await toBlob(analyticsRef.current, { cacheBust: true, backgroundColor: '#f9fafb' });
      if (!blob) throw new Error('No se pudo generar la imagen');
      
      const file = new File([blob], 'analisis-boyita.png', { type: 'image/png' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Análisis Boyita',
          files: [file]
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'analisis-boyita.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Hubo un error al generar la imagen.');
    }
  };

  const renderTrend = (today: number, yesterday: number, unit: string = '') => {
    const diff = today - yesterday;
    if (diff > 0) {
      return <span className="text-emerald-500 flex items-center text-xs font-medium mt-1"><TrendingUp className="w-3 h-3 mr-1"/> +{diff.toFixed(unit === 'oz' || unit === 'h' ? 1 : 0)}{unit} vs ayer</span>;
    } else if (diff < 0) {
      return <span className="text-rose-500 flex items-center text-xs font-medium mt-1"><TrendingDown className="w-3 h-3 mr-1"/> {diff.toFixed(unit === 'oz' || unit === 'h' ? 1 : 0)}{unit} vs ayer</span>;
    }
    return <span className="text-gray-400 flex items-center text-xs font-medium mt-1"><Minus className="w-3 h-3 mr-1"/> Igual que ayer</span>;
  };

  return (
    <div ref={analyticsRef} className="p-4 space-y-6 max-w-md md:max-w-4xl mx-auto pb-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Análisis</h2>
        <button onClick={handleShare} className="p-2 bg-theme-light dark:bg-theme-dark/20 text-theme-dark dark:text-theme-base rounded-full hover:bg-theme-base hover:text-white transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sección 1: Resumen de Hoy */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Resumen de Hoy</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Onzas</p>
              <p className="text-2xl font-bold text-theme-dark dark:text-theme-base">{todayStats.oz.toFixed(1)}</p>
              {renderTrend(todayStats.oz, yesterdayStats.oz, 'oz')}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Pañales</p>
              <p className="text-2xl font-bold text-theme-dark dark:text-theme-base">{todayStats.diapers}</p>
              {renderTrend(todayStats.diapers, yesterdayStats.diapers)}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Pipí</p>
              <p className="text-2xl font-bold text-theme-dark dark:text-theme-base">{todayStats.pee}</p>
              {renderTrend(todayStats.pee, yesterdayStats.pee)}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Horas de Sueño</p>
              <p className="text-2xl font-bold text-theme-dark dark:text-theme-base">{todayStats.sleepHours.toFixed(1)}</p>
              {renderTrend(todayStats.sleepHours, yesterdayStats.sleepHours, 'h')}
            </div>
          </div>
        </div>

        {/* Sección 2: Historial y Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Historial</h3>
          </div>

          <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl overflow-x-auto whitespace-nowrap scrollbar-hide">
            {[
              { id: '24h', label: 'Ayer' },
              { id: '7d', label: '7 Días' },
              { id: 'month', label: '1 Mes' },
              { id: 'custom', label: 'Rango' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as FilterType)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                  filter === f.id ? "bg-white dark:bg-gray-600 text-theme-dark dark:text-theme-base shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filter === 'custom' && (
            <div className="flex space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Desde</label>
                <input 
                  type="date" 
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full text-sm p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-theme-base outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Hasta</label>
                <input 
                  type="date" 
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full text-sm p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-theme-base outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Gráficas */}
          <div className="space-y-8 mt-6">
            
            {/* Onzas - Barras */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Onzas Consumidas</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="oz" name="Onzas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Eructos - Líneas */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Eructos</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="burps" name="Eructos" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pipí y Popó - Líneas */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Pañales (Pipí y Popó)</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="pee" name="Pipí" stroke="#facc15" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="poo" name="Popó" stroke="#fb923c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sueño - Pastel */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Horas de Sueño</h4>
              <div className="flex items-center justify-center">
                <div className="w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sleepStats}
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {sleepStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${formatSleepHours(value)}h`, '']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="ml-6 space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{formatSleepHours(sleepStats[0].value)}h Dormido</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-100 dark:bg-indigo-900/50" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{formatSleepHours(sleepStats[1].value)}h Despierto</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <PediatricianChat />
    </div>
  );
}
