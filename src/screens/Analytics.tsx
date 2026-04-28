import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Share2, TrendingUp, TrendingDown, Minus, Info, Download } from 'lucide-react';
import { subDays, startOfMonth, isAfter, isBefore, startOfDay, endOfDay, format, startOfHour, differenceInMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { toBlob } from 'html-to-image';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { cn } from '../components/Layout';
import { WEIGHT_BOYS, WEIGHT_GIRLS, HEIGHT_BOYS, HEIGHT_GIRLS } from '../utils/growthCharts';

type FilterType = '24h' | 'yesterday' | '7d' | 'month' | 'custom';
type CompareType = 'yesterday' | 'weekAvg';

export function Analytics() {
  const [filter, setFilter] = useState<FilterType>('24h');
  const [compareType, setCompareType] = useState<CompareType>('yesterday');
  const [customStart, setCustomStart] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  const events = useStore(state => state.events);
  const profile = useStore(state => state.profile);
  const medicalRecords = useStore(state => state.medicalRecords);

  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});

  const toggleSeries = (dataKey: string) => {
    setHiddenSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };

  const ageInMonths = useMemo(() => {
    if (!profile.birthDate) return 0;
    const d = new Date(profile.birthDate);
    if (isNaN(d.getTime())) return 0;
    return Math.max(0, differenceInMonths(new Date(), d));
  }, [profile.birthDate]);

  // Scroll to top when component mounts
  React.useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  const analyticsRef = React.useRef<HTMLDivElement>(null);

  // --- Filtered Events for Current Period ---
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    const now = new Date();
    
    try {
      if (filter === '24h') {
        const start = startOfDay(now);
        const end = endOfDay(now);
        return events.filter(e => {
          const eventDate = new Date(e.timestamp);
          return isAfter(eventDate, start) && isBefore(eventDate, end);
        });
      }

      if (filter === 'yesterday') {
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
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
        return events.filter(e => {
          const eventDate = new Date(e.timestamp);
          return isAfter(eventDate, start) && isBefore(eventDate, end);
        });
      }

      let cutoffDate = now;
      if (filter === '7d') cutoffDate = subDays(now, 7);
      if (filter === 'month') cutoffDate = startOfMonth(now);

      return events.filter(e => isAfter(new Date(e.timestamp), cutoffDate));
    } catch (e) {
      console.error("Error filtering events in Analytics:", e);
      return [];
    }
  }, [events, filter, customStart, customEnd]);

  // --- Growth Chart Data ---
  const growthData = useMemo(() => {
    if (!profile.birthDate || !medicalRecords.length) return [];
    
    const sortedRecords = [...medicalRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sortedRecords.map(record => {
      const bDate = new Date(profile.birthDate);
      const rDate = new Date(record.date);
      const ageMonths = differenceInMonths(rDate, bDate);
      
      const weightTable = profile.gender === 'boy' ? WEIGHT_BOYS : WEIGHT_GIRLS;
      const heightTable = profile.gender === 'boy' ? HEIGHT_BOYS : HEIGHT_GIRLS;
      
      // Find exact or closest preceding value in WHO table (Median is index 1 for weight, 1 for height)
      const tableMonths = Object.keys(weightTable).map(Number).sort((a, b) => a - b);
      const closestMonth = tableMonths.find(m => m === ageMonths) ?? [...tableMonths].reverse().find(m => m <= ageMonths) ?? 0;
      
      return {
        age: ageMonths,
        label: `${ageMonths}m`,
        peso: record.weight,
        talla: record.height,
        whoPeso: weightTable[closestMonth as keyof typeof weightTable]?.[1] || 0,
        whoTalla: heightTable[closestMonth as keyof typeof heightTable]?.[1] || 0,
      };
    });
  }, [medicalRecords, profile.birthDate, profile.gender]);

  // --- Current Period Stats ---
  const currentStats = useMemo(() => {
    let oz = 0;
    let pee = 0;
    let poo = 0;
    let constip = 0;
    let burps = 0;
    let baths = 0;
    let sleepMs = 0;

    filteredEvents.forEach(e => {
      if (e.type === 'feeding' && e.details?.amount) oz += e.details.amount;
      if (e.type === 'hygiene') {
        if (e.details?.hygieneType === 'pee') pee += 1;
        if (e.details?.hygieneType === 'poo') poo += 1;
        if (e.details?.hygieneType === 'constipation') constip += 1;
      }
      if (e.type === 'burp') burps += 1;
      if (e.type === 'bath') baths += 1;
      if (e.type === 'sleep' && e.endTimestamp) sleepMs += (e.endTimestamp - e.timestamp);
    });

    // Calculate daily averages if period is longer than 1 day
    let days = 1;
    if (filter === '7d') days = 7;
    if (filter === 'month') days = 30;
    if (filter === 'custom') {
      const start = startOfDay(new Date(customStart));
      const end = endOfDay(new Date(customEnd));
      days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return { 
      oz: oz / days, 
      pee: pee / days, 
      poo: poo / days, 
      constip: constip / days,
      burps: burps / days, 
      baths: baths / days,
      sleepHours: (sleepMs / (1000 * 60 * 60)) / days 
    };
  }, [filteredEvents, filter, customStart, customEnd]);

  // --- Comparison Stats ---
  const comparisonStats = useMemo(() => {
    const now = new Date();
    let compEvents: typeof events = [];

    if (compareType === 'yesterday') {
      // If filter is 24h, compare to the day before yesterday
      // If filter is 7d, compare to the previous 7 days
      let start, end;
      if (filter === '24h') {
        start = startOfDay(subDays(now, 1));
        end = endOfDay(subDays(now, 1));
      } else if (filter === 'yesterday') {
        start = startOfDay(subDays(now, 2));
        end = endOfDay(subDays(now, 2));
      } else if (filter === '7d') {
        start = startOfDay(subDays(now, 14));
        end = endOfDay(subDays(now, 7));
      } else if (filter === 'month') {
        start = startOfMonth(subDays(startOfMonth(now), 1));
        end = endOfDay(subDays(startOfMonth(now), 1));
      } else {
        // Custom: compare to previous period of same length
        const currentStart = startOfDay(new Date(customStart));
        const currentEnd = endOfDay(new Date(customEnd));
        const diffDays = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
        start = startOfDay(subDays(currentStart, diffDays));
        end = endOfDay(subDays(currentStart, 1));
      }

      compEvents = events.filter(e => {
        const d = new Date(e.timestamp);
        return isAfter(d, start) && isBefore(d, end);
      });
    } else if (compareType === 'weekAvg') {
      // Compare to average of last 7 days
      const start = startOfDay(subDays(now, 7));
      const end = endOfDay(now);
      compEvents = events.filter(e => {
        const d = new Date(e.timestamp);
        return isAfter(d, start) && isBefore(d, end);
      });
    }

    let oz = 0;
    let pee = 0;
    let poo = 0;
    let constip = 0;
    let burps = 0;
    let baths = 0;
    let sleepMs = 0;

    compEvents.forEach(e => {
      if (e.type === 'feeding' && e.details?.amount) oz += e.details.amount;
      if (e.type === 'hygiene') {
        if (e.details?.hygieneType === 'pee') pee += 1;
        if (e.details?.hygieneType === 'poo') poo += 1;
        if (e.details?.hygieneType === 'constipation') constip += 1;
      }
      if (e.type === 'burp') burps += 1;
      if (e.type === 'bath') baths += 1;
      if (e.type === 'sleep' && e.endTimestamp) sleepMs += (e.endTimestamp - e.timestamp);
    });

    let days = 1;
    if (compareType === 'yesterday') {
      if (filter === '7d') days = 7;
      if (filter === 'month') days = 30;
      if (filter === 'custom') {
        const start = startOfDay(new Date(customStart));
        const end = endOfDay(new Date(customEnd));
        days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      }
    } else if (compareType === 'weekAvg') {
      days = 7;
    }

    return { 
      oz: oz / days, 
      pee: pee / days, 
      poo: poo / days, 
      constip: constip / days,
      burps: burps / days, 
      baths: baths / days,
      sleepHours: (sleepMs / (1000 * 60 * 60)) / days 
    };
  }, [events, filter, customStart, customEnd, compareType]);

  // --- Chart Data Aggregation ---
  const chartData = useMemo(() => {
    const isSingleDay = filter === '24h' || filter === 'yesterday' || (filter === 'custom' && customStart === customEnd);
    const dataMap = new Map<string, any>();

    let cumulativeOz = 0;

    // Sort events chronologically to calculate cumulative values
    const sortedEvents = [...filteredEvents].sort((a, b) => a.timestamp - b.timestamp);

    sortedEvents.forEach(e => {
      const date = new Date(e.timestamp);
      const key = isSingleDay ? format(date, 'HH:00') : format(date, 'MMM dd');
      
      if (!dataMap.has(key)) {
        dataMap.set(key, { 
          label: key, 
          timestamp: isSingleDay ? startOfHour(date).getTime() : startOfDay(date).getTime(), 
          oz: 0, 
          cumulativeOz: cumulativeOz,
          burps: 0, 
          baths: 0,
          pee: 0, 
          poo: 0,
          constip: 0,
          sleepMs: 0
        });
      }
      const entry = dataMap.get(key);
      
      if (e.type === 'feeding' && e.details?.amount) {
        entry.oz += e.details.amount;
        cumulativeOz += e.details.amount;
        entry.cumulativeOz = cumulativeOz;
      }
      if (e.type === 'burp') entry.burps += 1;
      if (e.type === 'bath') entry.baths += 1;
      if (e.type === 'hygiene') {
        if (e.details?.hygieneType === 'pee') entry.pee += 1;
        if (e.details?.hygieneType === 'poo') entry.poo += 1;
        if (e.details?.hygieneType === 'constipation') entry.constip += 1;
      }
      if (e.type === 'sleep' && e.endTimestamp) {
        entry.sleepMs += (e.endTimestamp - e.timestamp);
      }
    });

    // For burps and baths, we only want to show points where > 0
    const finalData = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    finalData.forEach(d => {
      if (d.burps === 0) d.burps = null; // Set to null so line chart doesn't plot 0
      if (d.baths === 0) d.baths = null;
      d.sleepHours = d.sleepMs / (1000 * 60 * 60);
    });

    return finalData;
  }, [filteredEvents, filter, customStart, customEnd]);

  const handleDownload = async () => {
    if (!analyticsRef.current) return;
    try {
      const blob = await toBlob(analyticsRef.current, { cacheBust: true, backgroundColor: '#f9fafb' });
      if (!blob) throw new Error('No se pudo generar la imagen');
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analisis-boyita.png';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Hubo un error al generar la imagen.');
    }
  };

  const renderTrend = (current: number, comparison: number, unit: string = '') => {
    const diff = current - comparison;
    const isPositiveGood = unit === 'oz' || unit === 'h'; // For diapers, more isn't necessarily better, but let's keep it simple
    
    if (Math.abs(diff) < 0.1) {
      return <span className="text-gray-400 flex items-center text-xs font-medium mt-1"><Minus className="w-3 h-3 mr-1"/> Igual que {compareType === 'yesterday' ? 'ayer' : 'promedio'}</span>;
    }
    
    if (diff > 0) {
      return <span className="text-emerald-500 flex items-center text-xs font-medium mt-1"><TrendingUp className="w-3 h-3 mr-1"/> +{diff.toFixed(unit === 'oz' || unit === 'h' ? 1 : 0)}{unit} vs {compareType === 'yesterday' ? 'ayer' : 'promedio'}</span>;
    } else {
      return <span className="text-rose-500 flex items-center text-xs font-medium mt-1"><TrendingDown className="w-3 h-3 mr-1"/> {diff.toFixed(unit === 'oz' || unit === 'h' ? 1 : 0)}{unit} vs {compareType === 'yesterday' ? 'ayer' : 'promedio'}</span>;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 min-w-[150px]">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{entry.name}:</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-gray-100 ml-4">
                  {entry.value?.toFixed ? entry.value.toFixed(1) : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex justify-center space-x-4 mt-2">
        {payload.map((entry: any, index: number) => (
          <button
            key={`item-${index}`}
            onClick={() => toggleSeries(entry.dataKey)}
            className={cn(
              "flex items-center space-x-1.5 text-xs font-medium transition-all hover:opacity-80",
              hiddenSeries[entry.dataKey] ? "opacity-40 grayscale" : "opacity-100"
            )}
          >
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-700 dark:text-gray-300">{entry.value}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div ref={analyticsRef} className="p-4 space-y-6 max-w-md md:max-w-4xl mx-auto pb-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      
      {/* Banner de Contexto */}
      <div className="bg-gradient-to-r from-theme-light to-theme-base/20 dark:from-theme-dark/40 dark:to-theme-dark/20 p-4 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-theme-dark dark:text-theme-light">
            Análisis para {profile.name || 'Bebé'}
          </h2>
          <p className="text-sm text-theme-dark/80 dark:text-theme-light/80">
            {ageInMonths} meses de edad
          </p>
        </div>
        <button onClick={handleDownload} className="p-2 bg-white/50 dark:bg-black/20 text-theme-dark dark:text-theme-light rounded-full hover:bg-white dark:hover:bg-black/40 transition-colors" title="Descargar análisis">
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Filtros Globales */}
      <div className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm py-4 -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex space-x-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-x-auto whitespace-nowrap scrollbar-hide">
            {[
              { id: '24h', label: 'Hoy' },
              { id: 'yesterday', label: 'Ayer' },
              { id: '7d', label: '7 Días' },
              { id: 'month', label: '1 Mes' },
              { id: 'custom', label: 'Rango' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as FilterType)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  filter === f.id ? "bg-theme-base text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 pl-2">Comparar con:</span>
            <select 
              value={compareType}
              onChange={(e) => setCompareType(e.target.value as CompareType)}
              className="text-sm bg-transparent border-none text-gray-700 dark:text-gray-200 outline-none focus:ring-0 cursor-pointer pr-2"
            >
              <option value="yesterday">Período Anterior</option>
              <option value="weekAvg">Promedio Semanal</option>
            </select>
          </div>
        </div>

        {filter === 'custom' && (
          <div className="flex space-x-3 mt-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Desde</label>
              <input 
                type="date" 
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full text-sm p-2.5 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-theme-base outline-none text-gray-900 dark:text-white transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Hasta</label>
              <input 
                type="date" 
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full text-sm p-2.5 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-theme-base outline-none text-gray-900 dark:text-white transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Resumen de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative group">
          <div className="absolute top-2 right-2 text-gray-400 hover:text-theme-base cursor-help">
            <Info className="w-4 h-4" />
            <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10">
              Volumen total consumido. Promedio saludable: 24-32 oz/día.
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Onzas / Día</p>
          <p className="text-2xl font-bold text-theme-dark dark:text-theme-base">{(currentStats.oz || 0).toFixed(1)}</p>
          {renderTrend(currentStats.oz, comparisonStats.oz, 'oz')}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative group">
          <div className="absolute top-2 right-2 text-gray-400 hover:text-theme-base cursor-help">
            <Info className="w-4 h-4" />
            <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10">
              Frecuencia de pañales mojados. Promedio saludable: 5-6/día.
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Pipí / Día</p>
          <p className="text-2xl font-bold text-theme-dark dark:text-theme-base">{(currentStats.pee || 0).toFixed(1)}</p>
          {renderTrend(currentStats.pee, comparisonStats.pee)}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative group">
          <div className="absolute top-2 right-2 text-gray-400 hover:text-theme-base cursor-help">
            <Info className="w-4 h-4" />
            <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10">
              Frecuencia de deposiciones. Varía mucho por edad y dieta.
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Popó / Día</p>
          <p className="text-2xl font-bold text-theme-dark dark:text-theme-base">{(currentStats.poo || 0).toFixed(1)}</p>
          {renderTrend(currentStats.poo, comparisonStats.poo)}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative group">
          <div className="absolute top-2 right-2 text-gray-400 hover:text-theme-base cursor-help">
            <Info className="w-4 h-4" />
            <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10">
              Frecuencia de eructos registrados. Ayuda a prevenir cólicos.
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Eructos / Día</p>
          <p className="text-2xl font-bold text-theme-dark dark:text-theme-base">{(currentStats.burps || 0).toFixed(1)}</p>
          {renderTrend(currentStats.burps, comparisonStats.burps)}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative group">
          <div className="absolute top-2 right-2 text-gray-400 hover:text-theme-base cursor-help">
            <Info className="w-4 h-4" />
            <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10">
              Frecuencia de baños.
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Baños / Día</p>
          <p className="text-2xl font-bold text-theme-dark dark:text-theme-base">{(currentStats.baths || 0).toFixed(1)}</p>
          {renderTrend(currentStats.baths, comparisonStats.baths)}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative group">
          <div className="absolute top-2 right-2 text-gray-400 hover:text-theme-base cursor-help">
            <Info className="w-4 h-4" />
            <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10">
              Días con registro de estreñimiento.
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Estreñimiento / Día</p>
          <p className="text-2xl font-bold text-theme-dark dark:text-theme-base">{(currentStats.constip || 0).toFixed(1)}</p>
          {renderTrend(currentStats.constip, comparisonStats.constip)}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative group col-span-2 lg:col-span-1">
          <div className="absolute top-2 right-2 text-gray-400 hover:text-theme-base cursor-help">
            <Info className="w-4 h-4" />
            <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10">
              Horas totales de sueño. Promedio saludable: 12-16h/día (depende de la edad).
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Sueño / Día</p>
          <p className="text-2xl font-bold text-theme-dark dark:text-theme-base">{(currentStats.sleepHours || 0).toFixed(1)}h</p>
          {renderTrend(currentStats.sleepHours, comparisonStats.sleepHours, 'h')}
        </div>
      </div>

      {/* Crecimiento - Comparativa OMS */}
      {growthData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 font-serif">Curvas de Crecimiento</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Comparativa con la mediana de la OMS para {profile.gender === 'boy' ? 'niños' : 'niñas'}</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-1.5">
                 <div className="w-3 h-1 rounded-full bg-theme-base" />
                 <span className="text-[10px] font-bold text-gray-500 uppercase">Bebé</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <div className="w-3 h-1 rounded-full bg-gray-300" />
                 <span className="text-[10px] font-bold text-gray-500 uppercase">OMS</span>
               </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="h-64">
              <div className="text-[10px] mb-2 font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Peso (kg)
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#AEC6CF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#AEC6CF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="peso" stroke="#AEC6CF" strokeWidth={4} fillOpacity={1} fill="url(#colorWeight)" name="Peso Bebé" />
                  <Area type="monotone" dataKey="whoPeso" stroke="#94a3b8" strokeDasharray="5 5" fill="none" strokeWidth={1} name="Mediana OMS" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              <div className="text-[10px] mb-2 font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Talla (cm)
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="talla" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorHeight)" name="Talla Bebé" />
                  <Area type="monotone" dataKey="whoTalla" stroke="#94a3b8" strokeDasharray="5 5" fill="none" strokeWidth={1} name="Mediana OMS" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Gráficas */}
      <div className="space-y-6">
        
        {/* Onzas - Barras Diarias */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Consumo de Alimentación (Onzas Diarias)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Legend content={renderLegend} verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                <Bar hide={hiddenSeries.oz} dataKey="oz" name="Onzas Consumidas" fill="#3b82f6" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pañales - Barras Apiladas */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Higiene y Pañales</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dx={-10} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Legend content={renderLegend} verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                <Bar hide={hiddenSeries.pee} dataKey="pee" name="Pipí" stackId="a" fill="#facc15" />
                <Bar hide={hiddenSeries.poo} dataKey="poo" name="Popó" stackId="a" fill="#fb923c" radius={[4, 4, 0, 0]} />
                <Bar hide={hiddenSeries.constip} dataKey="constip" name="Días Estreñimiento" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sueño - Barras */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Patrones de Sueño</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Legend content={renderLegend} verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                <Bar hide={hiddenSeries.sleepHours} dataKey="sleepHours" name="Horas de Sueño" fill="#818cf8" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Eructos y Baños - Barras */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Frecuencia de Eructos</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dx={-10} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Legend content={renderLegend} verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Bar hide={hiddenSeries.burps} dataKey="burps" name="Eructos" fill="#10b981" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Frecuencia de Baños</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dx={-10} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Legend content={renderLegend} verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Bar hide={hiddenSeries.baths} dataKey="baths" name="Baños" fill="#0ea5e9" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
