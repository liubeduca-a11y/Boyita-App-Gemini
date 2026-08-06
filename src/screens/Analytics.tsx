import React, { useState, useMemo } from 'react';
import { useStore, BabyEvent } from '../store';
import { Share2, FileText, ChevronDown, ChevronUp, Milk, Moon, Sun, Droplets, Bath, Ruler, Check, Calendar, Download } from 'lucide-react';
import { subDays, startOfMonth, isAfter, isBefore, startOfDay, endOfDay, format, differenceInDays, formatDistanceToNow, differenceInMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { FeedingAnalysis } from '../components/FeedingAnalysis';
import { cn } from '../components/Layout';
import { WEIGHT_BOYS, WEIGHT_GIRLS, HEIGHT_BOYS, HEIGHT_GIRLS } from '../utils/growthCharts';

type FilterType = '24h' | 'yesterday' | '7d' | 'month' | 'custom';

export function Analytics() {
  const events = useStore(state => state.events);
  const medicalRecords = useStore(state => state.medicalRecords);
  const profile = useStore(state => state.profile);

  const [filter, setFilter] = useState<FilterType>('24h');
  const [customStart, setCustomStart] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const [expanded, setExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem('analytics_accordions');
      return saved ? JSON.parse(saved) : { feeding: true, sleep: true, hygiene: false, growth: false };
    } catch (e) {
      return { feeding: true, sleep: true, hygiene: false, growth: false };
    }
  });

  const toggleSection = (section: keyof typeof expanded) => {
    const newExpanded = { ...expanded, [section]: !expanded[section] };
    setExpanded(newExpanded);
    localStorage.setItem('analytics_accordions', JSON.stringify(newExpanded));
  };

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    feeding: true,
    sleep: true,
    hygiene: true,
    growth: true
  });
  const [exportFilter, setExportFilter] = useState<FilterType>('7d');
  const [exportCustomStart, setExportCustomStart] = useState<string>(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [exportCustomEnd, setExportCustomEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Global events filter for the main view
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    const now = new Date();
    try {
      if (filter === '24h') {
        const start = startOfDay(now);
        const end = endOfDay(now);
        return events.filter(e => isAfter(new Date(e.timestamp), start) && isBefore(new Date(e.timestamp), end));
      }
      if (filter === 'yesterday') {
        const start = startOfDay(subDays(now, 1));
        const end = endOfDay(subDays(now, 1));
        return events.filter(e => isAfter(new Date(e.timestamp), start) && isBefore(new Date(e.timestamp), end));
      }
      if (filter === 'custom') {
        const start = startOfDay(new Date(customStart));
        const end = endOfDay(new Date(customEnd));
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
        return events.filter(e => isAfter(new Date(e.timestamp), start) && isBefore(new Date(e.timestamp), end));
      }
      let cutoffDate = now;
      if (filter === '7d') cutoffDate = subDays(now, 7);
      if (filter === 'month') cutoffDate = startOfMonth(now);
      return events.filter(e => isAfter(new Date(e.timestamp), cutoffDate));
    } catch (e) {
      return [];
    }
  }, [events, filter, customStart, customEnd]);

  // Calculations for Sueño
  const { sleepDayMs, sleepNightMs, lastSleepTime } = useMemo(() => {
    let sleepDayMs = 0;
    let sleepNightMs = 0;
    let lastSleepTime = 0;

    filteredEvents.forEach(e => {
      if (e.type === 'sleep') {
        const start = e.timestamp;
        const end = e.endTimestamp || Date.now();
        if (end > lastSleepTime) lastSleepTime = end;

        const startHour = new Date(start).getHours();
        if (startHour >= 6 && startHour < 20) {
          sleepDayMs += (end - start);
        } else {
          sleepNightMs += (end - start);
        }
      }
    });

    return { sleepDayMs, sleepNightMs, lastSleepTime };
  }, [filteredEvents]);

  const numDays = useMemo(() => {
    if (filter === '24h' || filter === 'yesterday') return 1;
    if (filter === '7d') return 7;
    if (filter === 'month') return 30; // Approx
    if (filter === 'custom') {
      const d1 = new Date(customStart);
      const d2 = new Date(customEnd);
      return Math.max(1, differenceInDays(d2, d1) + 1);
    }
    return 1;
  }, [filter, customStart, customEnd]);

  const avgSleepDayHr = (sleepDayMs / numDays) / (1000 * 60 * 60);
  const avgSleepNightHr = (sleepNightMs / numDays) / (1000 * 60 * 60);
  const avgTotalSleepHr = avgSleepDayHr + avgSleepNightHr;

  // Calculations for Higiene
  const { peeCount, pooCount, mixedCount, bathToday, lastBathTime } = useMemo(() => {
    let peeCount = 0;
    let pooCount = 0;
    let mixedCount = 0;
    let bathToday = false;
    let lastBathTime = 0;

    filteredEvents.forEach(e => {
      if (e.type === 'hygiene') {
        if (e.details?.hygieneType === 'pee') peeCount++;
        else if (e.details?.hygieneType === 'poo') pooCount++;
        else mixedCount++;
      } else if (e.type === 'bath') {
        bathToday = true;
        if (e.timestamp > lastBathTime) lastBathTime = e.timestamp;
      }
    });
    
    return {
      peeCount: Math.round(peeCount / numDays),
      pooCount: Math.round(pooCount / numDays),
      mixedCount: Math.round(mixedCount / numDays),
      bathToday,
      lastBathTime
    };
  }, [filteredEvents, numDays]);

  // Calculations for Crecimiento
  const lastGrowth = useMemo(() => {
    if (!medicalRecords || medicalRecords.length === 0) return null;
    return [...medicalRecords].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [medicalRecords]);

  const growthChartData = useMemo(() => {
    if (!medicalRecords || medicalRecords.length === 0) return [];

    const sortedRecords = [...medicalRecords].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
    });

    const weightTable = profile?.gender === 'boy' ? WEIGHT_BOYS : WEIGHT_GIRLS;
    const heightTable = profile?.gender === 'boy' ? HEIGHT_BOYS : HEIGHT_GIRLS;
    const tableMonths = Object.keys(weightTable).map(Number).sort((a, b) => a - b);

    return sortedRecords.map(record => {
      const rDate = new Date(record.date);
      const bDate = profile?.birthDate ? new Date(profile.birthDate) : null;
      let ageMonths = 0;
      if (bDate && !isNaN(bDate.getTime()) && !isNaN(rDate.getTime())) {
        ageMonths = Math.max(0, differenceInMonths(rDate, bDate));
      }

      const closestMonth = tableMonths.find(m => m === ageMonths) ?? [...tableMonths].reverse().find(m => m <= ageMonths) ?? 0;

      return {
        age: ageMonths,
        label: !isNaN(rDate.getTime()) ? format(rDate, 'dd/MM/yy') : record.date,
        peso: record.weight,
        talla: record.height,
        whoPeso: weightTable[closestMonth as keyof typeof weightTable]?.[1] || 0,
        whoTalla: heightTable[closestMonth as keyof typeof heightTable]?.[1] || 0,
      };
    });
  }, [medicalRecords, profile?.birthDate, profile?.gender]);

  // Export Logic
  const handleExport = () => {
    if (!exportOptions.feeding && !exportOptions.sleep && !exportOptions.hygiene && !exportOptions.growth) return;

    let report = `REPORTE PEDIÁTRICO - Boyita App\nGenerado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}\nPeriodo: ${exportFilter}\n\n`;

    // Filter events specifically for export
    const exportEvents = events.filter(e => {
      const now = new Date();
      if (exportFilter === '24h') return isAfter(e.timestamp, startOfDay(now));
      if (exportFilter === 'yesterday') return isAfter(e.timestamp, startOfDay(subDays(now, 1))) && isBefore(e.timestamp, endOfDay(subDays(now, 1)));
      if (exportFilter === '7d') return isAfter(e.timestamp, subDays(now, 7));
      if (exportFilter === 'month') return isAfter(e.timestamp, startOfMonth(now));
      if (exportFilter === 'custom') return isAfter(e.timestamp, startOfDay(new Date(exportCustomStart))) && isBefore(e.timestamp, endOfDay(new Date(exportCustomEnd)));
      return true;
    });

    if (exportOptions.feeding) {
      report += `=== ALIMENTACIÓN ===\n`;
      let liquidOz = 0;
      let feedCount = 0;
      exportEvents.forEach(e => {
        if (e.type === 'feeding') {
          feedCount++;
          if (e.details?.amount) liquidOz += e.details.amount;
        }
      });
      report += `Total Tomas: ${feedCount}\nVolumen Líquido: ${liquidOz} oz/ml\n\n`;
    }

    if (exportOptions.sleep) {
      report += `=== SUEÑO ===\n`;
      let totalSleepMs = 0;
      exportEvents.forEach(e => {
        if (e.type === 'sleep' && e.endTimestamp) totalSleepMs += (e.endTimestamp - e.timestamp);
      });
      report += `Total Horas Dormidas: ${(totalSleepMs / (1000 * 60 * 60)).toFixed(1)} h\n\n`;
    }

    if (exportOptions.hygiene) {
      report += `=== HIGIENE Y PAÑALES ===\n`;
      let pee = 0, poo = 0;
      exportEvents.forEach(e => {
        if (e.type === 'hygiene') {
          if (e.details?.hygieneType === 'pee') pee++;
          else poo++;
        }
      });
      report += `Pipí: ${pee}\nPopó/Mixto: ${poo}\n\n`;
    }

    if (exportOptions.growth && lastGrowth) {
      report += `=== CRECIMIENTO (Último Registro) ===\n`;
      report += `Fecha: ${format(new Date(lastGrowth.date), 'dd/MM/yyyy')}\n`;
      report += `Peso: ${lastGrowth.weight} kg\n`;
      report += `Talla: ${lastGrowth.height} cm\n`;
      if (lastGrowth.head) report += `Perímetro Cefálico: ${lastGrowth.head} cm\n`;
      report += `\n`;
    }

    navigator.clipboard.writeText(report).then(() => {
      alert("Reporte copiado al portapapeles. Puedes pegarlo en WhatsApp, correo, o tus notas.");
      setShowExportModal(false);
    }).catch(() => {
      alert("Hubo un error al copiar el reporte.");
    });
  };

  const isExportDisabled = !exportOptions.feeding && !exportOptions.sleep && !exportOptions.hygiene && !exportOptions.growth;

  return (
    <div className="pb-24 max-w-lg mx-auto w-full px-4 animate-in fade-in duration-300 relative">
      <div className="flex items-center justify-between mb-6 pt-4">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Análisis</h2>
        <button 
          onClick={() => setShowExportModal(true)}
          className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Reporte</span>
        </button>
      </div>

      {/* Rango de Fechas - Main View */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-1">
        {[
          { id: '24h', label: 'Hoy' },
          { id: 'yesterday', label: 'Ayer' },
          { id: '7d', label: '7D' },
          { id: 'month', label: 'Mes' },
          { id: 'custom', label: 'Rango', icon: Calendar }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as FilterType)}
            className={cn(
              "flex-1 flex items-center justify-center space-x-1.5 px-2 py-2 rounded-lg text-xs font-bold transition-all",
              filter === f.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            {f.icon && <f.icon className="w-3.5 h-3.5" />}
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {filter === 'custom' && (
        <div className="mb-6 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full p-2.5 text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" />
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full p-2.5 text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" />
        </div>
      )}

      <div className="space-y-4">
        
        {/* BLOQUE ALIMENTACIÓN */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <button 
            onClick={() => toggleSection('feeding')}
            className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <Milk className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Alimentación</h3>
            </div>
            {expanded.feeding ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          
          {expanded.feeding && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2 fade-in">
              <FeedingAnalysis events={filteredEvents} />
            </div>
          )}
        </div>

        {/* BLOQUE SUEÑO */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <button 
            onClick={() => toggleSection('sleep')}
            className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <Moon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Sueño</h3>
            </div>
            {expanded.sleep ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expanded.sleep && (
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 space-y-5 animate-in slide-in-from-top-2 fade-in">
              <div className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30">
                <p className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider mb-1">Total Dormido {numDays > 1 ? '(Promedio Diario)' : ''}</p>
                <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
                  {avgTotalSleepHr > 0 ? `${avgTotalSleepHr.toFixed(1)} h` : '--'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl flex items-center space-x-3 border border-gray-100 dark:border-gray-700">
                  <Sun className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Diurno</p>
                    <p className="font-black text-gray-800 dark:text-gray-200">{avgSleepDayHr > 0 ? `${avgSleepDayHr.toFixed(1)} h` : '--'}</p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl flex items-center space-x-3 border border-gray-100 dark:border-gray-700">
                  <Moon className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Nocturno</p>
                    <p className="font-black text-gray-800 dark:text-gray-200">{avgSleepNightHr > 0 ? `${avgSleepNightHr.toFixed(1)} h` : '--'}</p>
                  </div>
                </div>
              </div>

              {lastSleepTime > 0 && (
                <div className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Último descanso: hace {formatDistanceToNow(lastSleepTime, { locale: es })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* BLOQUE HIGIENE */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <button 
            onClick={() => toggleSection('hygiene')}
            className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Higiene</h3>
            </div>
            {expanded.hygiene ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expanded.hygiene && (
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 space-y-5 animate-in slide-in-from-top-2 fade-in">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Conteo de Pañales {numDays > 1 ? '(Promedio Diario)' : ''}</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 text-center">
                    <p className="text-2xl mb-1">💦</p>
                    <p className="text-lg font-black text-amber-600 dark:text-amber-400">{peeCount}</p>
                    <p className="text-[10px] font-bold text-amber-800/60 dark:text-amber-500">Pipí</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30 text-center">
                    <p className="text-2xl mb-1">💩</p>
                    <p className="text-lg font-black text-orange-600 dark:text-orange-400">{pooCount}</p>
                    <p className="text-[10px] font-bold text-orange-800/60 dark:text-orange-500">Popó</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                    <p className="text-2xl mb-1">🌀</p>
                    <p className="text-lg font-black text-gray-600 dark:text-gray-400">{mixedCount}</p>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Otros</p>
                  </div>
                </div>
              </div>

              <div className="bg-sky-50 dark:bg-sky-900/10 p-4 rounded-xl border border-sky-100 dark:border-sky-900/30 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bath className="w-5 h-5 text-sky-500" />
                  <div>
                    <p className="text-sm font-bold text-sky-900 dark:text-sky-100">Baño registrado {filter === '24h' ? 'hoy' : ''}</p>
                    {lastBathTime > 0 && <p className="text-[10px] text-sky-700 dark:text-sky-300">Último: {formatDistanceToNow(lastBathTime, { locale: es, addSuffix: true })}</p>}
                  </div>
                </div>
                <div className="font-black text-lg text-sky-600 dark:text-sky-400">
                  {bathToday ? 'Sí' : 'No'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BLOQUE CRECIMIENTO */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <button 
            onClick={() => toggleSection('growth')}
            className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Ruler className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Crecimiento</h3>
            </div>
            {expanded.growth ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expanded.growth && (
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 space-y-6 animate-in slide-in-from-top-2 fade-in">
              {lastGrowth ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <span>Último registro</span>
                      <span>{format(new Date(lastGrowth.date), 'dd/MM/yyyy')}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Peso</p>
                        <p className="text-xl font-black text-gray-900 dark:text-gray-100">{lastGrowth.weight} <span className="text-sm text-gray-500">kg</span></p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Talla</p>
                        <p className="text-xl font-black text-gray-900 dark:text-gray-100">{lastGrowth.height} <span className="text-sm text-gray-500">cm</span></p>
                      </div>
                      {lastGrowth.head && (
                        <div className="col-span-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                          <p className="text-xs font-bold text-gray-500 uppercase">Perímetro Cefálico</p>
                          <p className="text-lg font-black text-gray-900 dark:text-gray-100">{lastGrowth.head} <span className="text-sm text-gray-500">cm</span></p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Growth Charts */}
                  {growthChartData.length > 0 && (
                    <div className="space-y-6 pt-2">
                      {/* Peso Chart */}
                      <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                        <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider mb-3">
                          Curva de Peso (kg) vs OMS
                        </h4>
                        <div className="h-52 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={growthChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} domain={['auto', 'auto']} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }} 
                              />
                              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                              <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                              <Line type="monotone" dataKey="whoPeso" name="Mediana OMS" stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Talla Chart */}
                      <div className="bg-sky-50/50 dark:bg-sky-900/10 p-4 rounded-xl border border-sky-100 dark:border-sky-800/30">
                        <h4 className="text-xs font-bold text-sky-900 dark:text-sky-200 uppercase tracking-wider mb-3">
                          Curva de Talla (cm) vs OMS
                        </h4>
                        <div className="h-52 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={growthChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} domain={['auto', 'auto']} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }} 
                              />
                              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                              <Line type="monotone" dataKey="talla" name="Talla (cm)" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                              <Line type="monotone" dataKey="whoTalla" name="Mediana OMS" stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <Ruler className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Sin mediciones aún</p>
                  <p className="text-xs text-gray-500 mt-1">Agrega la primera en el módulo de salud.</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Generar Reporte Pediatra
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Secciones a incluir</p>
                <div className="space-y-2">
                  {[
                    { id: 'feeding', label: 'Alimentación' },
                    { id: 'sleep', label: 'Sueño' },
                    { id: 'hygiene', label: 'Higiene' },
                    { id: 'growth', label: 'Crecimiento' }
                  ].map(opt => (
                    <label key={opt.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={exportOptions[opt.id as keyof typeof exportOptions]}
                        onChange={(e) => setExportOptions({...exportOptions, [opt.id]: e.target.checked})}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Periodo</p>
                <select 
                  value={exportFilter}
                  onChange={(e) => setExportFilter(e.target.value as FilterType)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  <option value="24h">Últimas 24h</option>
                  <option value="7d">Última semana</option>
                  <option value="month">Último mes</option>
                  <option value="custom">Personalizado</option>
                </select>

                {exportFilter === 'custom' && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <input type="date" value={exportCustomStart} onChange={e => setExportCustomStart(e.target.value)} className="w-full p-2 text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
                    <input type="date" value={exportCustomEnd} onChange={e => setExportCustomEnd(e.target.value)} className="w-full p-2 text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
              <button
                onClick={handleExport}
                disabled={isExportDisabled}
                className={cn(
                  "w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all",
                  isExportDisabled 
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed" 
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-95"
                )}
              >
                <Download className="w-4 h-4" />
                <span>Exportar / Copiar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
