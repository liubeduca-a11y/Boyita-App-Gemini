import React, { useMemo, useState } from 'react';
import { BabyEvent, useStore } from '../store';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Milk, Apple, Clock } from 'lucide-react';

interface ConceptStat {
  concepto: string;
  isLiquid: boolean;
  frecuencia: number;
  ultima_toma: number;
  volumen_total: number;
  unit: string;
}

export function FeedingAnalysis({ events }: { events: BabyEvent[] }) {
  const [showAllLiquids, setShowAllLiquids] = useState(false);
  const [showAllSolids, setShowAllSolids] = useState(false);
  
  // Also requested: a dropdown to filter by shortcuts.
  // Wait, the prompt says "Filtro por Atajos: Integración del selector desplegable en la parte superior del módulo de análisis para filtrar métricas rápidamente por conceptos guardados".
  const atajos = useStore(state => state.atajos_alimentacion);
  const [selectedAtajo, setSelectedAtajo] = useState<string>('all');

  const { liquids, solids, lastFeedingTime, allLiquidsCount, allSolidsCount } = useMemo(() => {
    const map = new Map<string, ConceptStat>();
    let maxTime = 0;

    events.forEach(e => {
      if (e.type !== 'feeding') return;
      
      const details = e.details || {};
      let rawConcept = "Desconocido";
      let isLiquid = false;
      let value = 0;
      let unit = "";

      if (details.subtype === 'lactancia') {
        rawConcept = "Leche Materna";
        isLiquid = true;
        value = details.duracion_total_toma || 0;
        unit = "min";
      } else if (details.subtype === 'biberon') {
        rawConcept = details.bottleType?.trim() || "Biberón";
        isLiquid = true;
        value = details.amount || 0;
        unit = details.unit || "oz";
      } else if (details.subtype === 'solidos') {
        rawConcept = details.solidsType?.trim() || "Comida";
        isLiquid = false;
        unit = details.solidsAmount || "";
      }

      // Overrides based on keywords
      const lowerConcept = rawConcept.toLowerCase();
      const liquidRegex = /\b(biberón|biberon|agua|fórmula|formula|leche|jugo|té|te|pecho)\b/i;
      const solidRegex = /\b(papilla|puré|pure|comida|verdura|fruta|cereal|galleta)\b/i;

      if (unit === 'ml' || unit === 'oz' || liquidRegex.test(lowerConcept)) {
        isLiquid = true;
      } else if (unit.includes('gr') || unit.includes('porción') || unit.includes('porcion') || solidRegex.test(lowerConcept)) {
        isLiquid = false;
      }

      let concepto = rawConcept.trim();
      if (concepto.length > 0) {
        concepto = concepto.charAt(0).toUpperCase() + concepto.slice(1).toLowerCase();
      }

      // Filter by selected shortcut if applicable
      if (selectedAtajo !== 'all') {
        const atajo = atajos.find(a => a.id === selectedAtajo);
        if (atajo && concepto.toLowerCase() !== atajo.concepto.toLowerCase().trim()) {
           return; // skip this event
        }
      }

      if (e.timestamp > maxTime) {
        maxTime = e.timestamp;
      }

      const key = concepto.toLowerCase().replace(/\s+/g, ' ');

      if (!map.has(key)) {
        map.set(key, {
          concepto,
          isLiquid,
          frecuencia: 0,
          ultima_toma: 0,
          volumen_total: 0,
          unit: unit === 'min' ? 'min' : (isLiquid ? unit : '')
        });
      }

      const entry = map.get(key)!;
      entry.frecuencia += 1;
      if (e.timestamp > entry.ultima_toma) {
        entry.ultima_toma = e.timestamp;
      }
      if (isLiquid && typeof value === 'number') {
        entry.volumen_total += value;
      }
    });

    const allLiquids = Array.from(map.values()).filter(c => c.isLiquid).sort((a, b) => b.frecuencia - a.frecuencia);
    const allSolids = Array.from(map.values()).filter(c => !c.isLiquid).sort((a, b) => b.frecuencia - a.frecuencia);

    return {
      liquids: showAllLiquids ? allLiquids : allLiquids.slice(0, 3),
      allLiquidsCount: allLiquids.length,
      solids: showAllSolids ? allSolids : allSolids.slice(0, 3),
      allSolidsCount: allSolids.length,
      lastFeedingTime: maxTime
    };
  }, [events, selectedAtajo, atajos, showAllLiquids, showAllSolids]);

  const timeSinceLast = lastFeedingTime > 0 
    ? formatDistanceToNow(lastFeedingTime, { addSuffix: true, locale: es })
    : "Sin registros";

  const renderItem = (item: ConceptStat) => (
    <div key={item.concepto} className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div>
        <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{item.concepto}</p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          Última toma: {formatDistanceToNow(item.ultima_toma, { addSuffix: true, locale: es })}
        </p>
      </div>
      <div className="text-right">
        {item.isLiquid && item.volumen_total > 0 && (
          <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
            {item.volumen_total} {item.unit}
          </p>
        )}
        {!item.isLiquid && item.unit && (
          <p className="font-bold text-orange-600 dark:text-orange-400 text-sm">
            {item.unit}
          </p>
        )}
        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
          {item.frecuencia} {item.isLiquid ? (item.frecuencia === 1 ? 'toma' : 'tomas') : (item.frecuencia === 1 ? 'registro' : 'registros')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-500" />
            Tiempo desde la última toma
          </h4>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 capitalize">
            {timeSinceLast}
          </p>
        </div>
        
        {atajos.length > 0 && (
          <select
            value={selectedAtajo}
            onChange={(e) => setSelectedAtajo(e.target.value)}
            className="p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los conceptos</option>
            {atajos.map(a => (
              <option key={a.id} value={a.id}>{a.concepto}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Líquidos */}
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
          <h5 className="flex items-center gap-2 font-bold text-sm text-indigo-900 dark:text-indigo-200 mb-3 border-b border-indigo-100 dark:border-indigo-800/50 pb-2">
            <Milk className="w-4 h-4 text-indigo-500" />
            Biberón / Líquidos
          </h5>
          
          {liquids.length > 0 ? (
            <div className="space-y-1">
              {liquids.map(renderItem)}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center italic">No hay registros de líquidos.</p>
          )}

          {allLiquidsCount > 3 && (
            <button
              onClick={() => setShowAllLiquids(!showAllLiquids)}
              className="mt-3 w-full py-2 flex items-center justify-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
            >
              {showAllLiquids ? (
                <>Ver menos <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Ver más ({allLiquidsCount - 3}) <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          )}
        </div>

        {/* Sólidos */}
        <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-100 dark:border-orange-800/30">
          <h5 className="flex items-center gap-2 font-bold text-sm text-orange-900 dark:text-orange-200 mb-3 border-b border-orange-100 dark:border-orange-800/50 pb-2">
            <Apple className="w-4 h-4 text-orange-500" />
            Comida / Sólidos
          </h5>

          {solids.length > 0 ? (
            <div className="space-y-1">
              {solids.map(renderItem)}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center italic">No hay registros de sólidos.</p>
          )}

          {allSolidsCount > 3 && (
            <button
              onClick={() => setShowAllSolids(!showAllSolids)}
              className="mt-3 w-full py-2 flex items-center justify-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-lg transition-colors"
            >
              {showAllSolids ? (
                <>Ver menos <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Ver más ({allSolidsCount - 3}) <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
