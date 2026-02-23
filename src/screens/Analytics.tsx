import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Share2, Calendar, Filter } from 'lucide-react';
import { subHours, subDays, startOfMonth, isAfter, isBefore, startOfDay, endOfDay, format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { cn } from '../components/Layout';

type FilterType = '24h' | '7d' | 'month' | 'custom';

export function Analytics() {
  const [filter, setFilter] = useState<FilterType>('24h');
  const [customStart, setCustomStart] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const events = useStore(state => state.events);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    let cutoffDate = now;
    
    if (filter === '24h') cutoffDate = subHours(now, 24);
    if (filter === '7d') cutoffDate = subDays(now, 7);
    if (filter === 'month') cutoffDate = startOfMonth(now);

    if (filter === 'custom') {
      const start = startOfDay(new Date(customStart));
      const end = endOfDay(new Date(customEnd));
      return events.filter(e => {
        const eventDate = new Date(e.timestamp);
        return isAfter(eventDate, start) && isBefore(eventDate, end);
      });
    }

    return events.filter(e => isAfter(new Date(e.timestamp), cutoffDate));
  }, [events, filter, customStart, customEnd]);

  const totalOz = useMemo(() => {
    return filteredEvents
      .filter(e => e.type === 'feeding' && e.details?.amount)
      .reduce((acc, curr) => acc + (curr.details?.amount || 0), 0);
  }, [filteredEvents]);

  const totalBurps = useMemo(() => {
    return filteredEvents.filter(e => e.type === 'burp').length;
  }, [filteredEvents]);

  const hygieneStats = useMemo(() => {
    const pee = filteredEvents.filter(e => e.type === 'hygiene' && e.details?.hygieneType === 'pee').length;
    const poo = filteredEvents.filter(e => e.type === 'hygiene' && e.details?.hygieneType === 'poo').length;
    return [
      { name: 'Pipí', count: pee, fill: 'var(--theme-base)' },
      { name: 'Popó', count: poo, fill: 'var(--theme-dark)' }
    ];
  }, [filteredEvents]);

  const sleepStats = useMemo(() => {
    const totalSleepMs = filteredEvents
      .filter(e => e.type === 'sleep' && e.endTimestamp)
      .reduce((acc, curr) => acc + (curr.endTimestamp! - curr.timestamp), 0);
    
    // Total ms in the period
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

  const handleShare = () => {
    // In a real app, we'd use html2canvas or native share API
    alert('Funcionalidad de compartir (Snapshot) en desarrollo.');
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Análisis</h2>
        <button onClick={handleShare} className="p-2 bg-theme-light text-theme-dark rounded-full hover:bg-theme-base hover:text-white transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
        {[
          { id: '24h', label: '24h' },
          { id: '7d', label: '7 Días' },
          { id: 'month', label: 'Mes' },
          { id: 'custom', label: 'Rango' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as FilterType)}
            className={cn(
              "flex-1 py-1.5 text-sm font-medium rounded-lg transition-all",
              filter === f.id ? "bg-white text-theme-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === 'custom' && (
        <div className="flex space-x-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input 
              type="date" 
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-theme-base outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input 
              type="date" 
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-theme-base outline-none"
            />
          </div>
        </div>
      )}

      {/* Biberón Dinámico */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Alimentación</h3>
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-4xl font-bold text-theme-dark">{totalOz.toFixed(1)}</p>
              <p className="text-sm text-gray-500 font-medium">Onzas totales</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-700">{totalBurps}</p>
              <p className="text-sm text-gray-500 font-medium">Eructos</p>
            </div>
          </div>
          <div className="w-16 h-32 border-4 border-gray-200 rounded-b-xl rounded-t-3xl relative overflow-hidden bg-gray-50">
            {/* Fill level based on an arbitrary max (e.g., 30oz per day) */}
            <div 
              className="absolute bottom-0 w-full bg-theme-base transition-all duration-1000 ease-out"
              style={{ height: `${Math.min(100, (totalOz / (filter === '24h' ? 30 : filter === '7d' ? 210 : 900)) * 100)}%` }}
            />
            {/* Measurement lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-2 opacity-20">
              {[1,2,3,4].map(i => <div key={i} className="w-4 h-[2px] bg-black ml-1" />)}
            </div>
          </div>
        </div>
      </div>

      {/* Sueño Radial */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Sueño</h3>
        <div className="flex items-center">
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sleepStats}
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {sleepStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="ml-6 space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-indigo-400" />
              <span className="text-sm text-gray-600 font-medium">{formatSleepHours(sleepStats[0].value)}h Dormido</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-indigo-100" />
              <span className="text-sm text-gray-600 font-medium">{formatSleepHours(sleepStats[1].value)}h Despierto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Higiene Barras */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Higiene</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hygieneStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 14, fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                {hygieneStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
