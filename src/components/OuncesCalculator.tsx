import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Milk, Scale, Plus, Minus, Info, Calculator, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { differenceInMonths, differenceInDays } from 'date-fns';
import { cn } from './Layout';

export function OuncesCalculator() {
  const profile = useStore((state) => state.profile);
  const medicalRecords = useStore((state) => state.medicalRecords);

  // Get most recent weight record if possible
  const latestWeightInKg = [...medicalRecords]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .find((r) => r.weight && r.weight > 0)?.weight;

  // Initial values
  const defaultWeight = latestWeightInKg || profile.birthWeight || 5.0; // Default to 5.0 kg if totally missing
  
  // States
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [weightInput, setWeightInput] = useState<string>(String(defaultWeight));
  const [feedingsPerDay, setFeedingsPerDay] = useState<number>(8);
  const [customAgeMonths, setCustomAgeMonths] = useState<number>(2);
  const [useProfileAge, setUseProfileAge] = useState<boolean>(true);

  // Parse baby's birth age if birthDate is available
  const [babyAgeMonths, setBabyAgeMonths] = useState<number>(2);
  const [babyAgeLabel, setBabyAgeLabel] = useState<string>('2 meses');

  useEffect(() => {
    if (profile.birthDate) {
      const birth = new Date(profile.birthDate);
      const now = new Date();
      const m = differenceInMonths(now, birth);
      const d = differenceInDays(now, birth) % 30;
      setBabyAgeMonths(m);
      
      if (m === 0) setBabyAgeLabel(`${d} días`);
      else if (d === 0) setBabyAgeLabel(`${m} meses`);
      else setBabyAgeLabel(`${m} meses y ${d} días`);

      // Set feedings per day recommendations dynamically based on age
      if (m < 1) setFeedingsPerDay(10);
      else if (m < 2) setFeedingsPerDay(8);
      else if (m < 4) setFeedingsPerDay(7);
      else if (m < 6) setFeedingsPerDay(6);
      else setFeedingsPerDay(5);
    }
  }, [profile.birthDate]);

  // Derived Values
  const effectiveAge = useProfileAge && profile.birthDate ? babyAgeMonths : customAgeMonths;
  const customYears = Math.floor(customAgeMonths / 12);
  const customMonthsOnly = customAgeMonths % 12;
  
  // Weight conversions for computation
  const getWeightInKg = (): number => {
    const val = parseFloat(weightInput) || 4.0;
    return weightUnit === 'kg' ? val : val / 2.20462;
  };

  const getWeightInLbs = (): number => {
    const val = parseFloat(weightInput) || 8.8;
    return weightUnit === 'lb' ? val : val * 2.20462;
  };

  const weightKg = getWeightInKg();
  const weightLbs = getWeightInLbs();

  // Pediatric standard daily milk coefficients per age group (ounces per pound)
  // younger infants need more raw calories relative to weight, tapering off as biological growth slows and solid foods start.
  const getDailyMultipliers = (ageMonths: number) => {
    if (ageMonths < 1) {
      return { min: 2.1, max: 2.5, maxDayOzCap: 28 };
    } else if (ageMonths < 3) {
      return { min: 2.0, max: 2.4, maxDayOzCap: 32 };
    } else if (ageMonths < 6) {
      return { min: 1.6, max: 2.0, maxDayOzCap: 32 }; // For a 15 lb baby, this results in 24 - 30 oz. Very realistic!
    } else if (ageMonths < 9) {
      return { min: 1.4, max: 1.8, maxDayOzCap: 30 }; // Solids intro reduces daily formula volume
    } else {
      return { min: 1.2, max: 1.6, maxDayOzCap: 28 };
    }
  };

  const currentCoeffs = getDailyMultipliers(effectiveAge);

  // Initial calculation based on baby weight
  let minDailyOz = weightLbs * currentCoeffs.min;
  let maxDailyOz = weightLbs * currentCoeffs.max;

  // Pediatric safety absolute caps (preventing unrealistic high feed estimates for heavier infants)
  if (minDailyOz > currentCoeffs.maxDayOzCap) {
    minDailyOz = currentCoeffs.maxDayOzCap - 4;
  }
  if (maxDailyOz > currentCoeffs.maxDayOzCap) {
    maxDailyOz = currentCoeffs.maxDayOzCap;
  }

  // Consistent mL conversion (1 oz is standardly defined as 29.57 ml but pediatricians use 30 ml reference)
  const minDailyMl = Math.round(minDailyOz * 29.57);
  const maxDailyMl = Math.round(maxDailyOz * 29.57);

  // Average daily recommendation
  const avgDailyOz = Math.round((minDailyOz + maxDailyOz) / 2);
  const avgDailyMl = Math.round((minDailyMl + maxDailyMl) / 2);

  // Recommended values per feeding
  const ouncesPerFeeding = parseFloat((avgDailyOz / feedingsPerDay).toFixed(1));
  const mlPerFeeding = Math.round(avgDailyMl / feedingsPerDay);

  // Adjustments on unit toggle
  const handleUnitToggle = (unit: 'kg' | 'lb') => {
    if (unit === weightUnit) return;
    const currentVal = parseFloat(weightInput) || 0;
    if (currentVal > 0) {
      if (unit === 'lb') {
        setWeightInput((currentVal * 2.20462).toFixed(1));
      } else {
        setWeightInput((currentVal / 2.20462).toFixed(1));
      }
    }
    setWeightUnit(unit);
  };

  const incrementWeight = () => {
    const currentVal = parseFloat(weightInput) || 0;
    const step = weightUnit === 'kg' ? 0.1 : 0.2;
    setWeightInput((currentVal + step).toFixed(1));
  };

  const decrementWeight = () => {
    const currentVal = parseFloat(weightInput) || 0;
    const step = weightUnit === 'kg' ? 0.1 : 0.2;
    if (currentVal - step > 0.5) {
      setWeightInput((currentVal - step).toFixed(1));
    }
  };

  // Get age group tips
  const getAgeGroupTips = () => {
    if (effectiveAge < 1) {
      return {
        title: "Recién Nacido (0-4 semanas)",
        frequency: "Cada 2 a 3 horas (8-12 tomas al día)",
        advice: "El estómago del bebé es muy pequeño. Aliméntalo a libre demanda. No dejes que pasen más de 4 horas sin comer durante la noche.",
        signsStatus: "Busca señales de hambre: chuparse los puños, buscar el pecho o biberón, y movimientos rápidos de ojos."
      };
    } else if (effectiveAge < 2) {
      return {
        title: "Lactante menor (1-2 meses)",
        frequency: "Cada 3 horas (7-9 tomas al día)",
        advice: "Suelen consumir de 3 a 5 oz (90-150 ml) por toma. Verás que los tiempos de sueño nocturno comienzan a extenderse de forma natural.",
        signsStatus: "Evita alimentar en exceso. Si el bebé gira la cabeza o escupe la mamadera, es señal de que se siente saciado."
      };
    } else if (effectiveAge < 4) {
      return {
        title: "Crecimiento activo (2-4 meses)",
        frequency: "Cada 3 a 4 horas (6-8 tomas al día)",
        advice: "Suelen consumir entre 4 y 6 oz (120-180 ml). Es una etapa de crecimiento acelerado, por lo que podría pedir más leche por un par de días seguidos.",
        signsStatus: "La ganancia de peso óptima y mojar al menos 5-6 pañales al día es el indicador más confiable de una buena hidratación."
      };
    } else if (effectiveAge < 6) {
      return {
        title: "Consolidación (4-6 meses)",
        frequency: "Cada 4 a 5 horas (5-6 tomas al día)",
        advice: "Suelen tomar alrededor de 6 a 8 oz (180-240 ml). Mantén una rutina constante antes de tomar siestas largas de día.",
        signsStatus: "No introduzcas alimentos sólidos todavía a menos que tu pediatra lo recomiende explícitamente."
      };
    } else {
      return {
        title: "Alimentación Complementaria (6+ meses)",
        frequency: "Cada 5 horas + comida sólida (4-5 tomas al día)",
        advice: "Suelen consumir de 7 a 8 oz (210-240 ml). Su alimentación láctea sigue siendo su principal fuente de energía, pero disminuirá a medida que coma más papillitas.",
        signsStatus: "Asegúrate de ofrecer agua hervida limpia o pura en poquitas cantidades junto con los alimentos sólidos."
      };
    }
  };

  const currentTip = getAgeGroupTips();

  // Percentage to fill the baby bottle visualizer (Max visual represents 9 ounces / 270 ml)
  const maxBottleCapacityOz = 9;
  const bottleFillPercentage = Math.min(100, Math.max(10, (ouncesPerFeeding / maxBottleCapacityOz) * 100));

  return (
    <div id="ounces-calculator-container" className="space-y-6">
      
      {/* Main Grid: Inputs and Simulated Bottle */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Step Inputs (7 Columns) */}
        <div className="md:col-span-7 bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          


          {/* 1. Baby Weight (Interactive numeric picker) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
              <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap leading-none select-none">
                <Scale className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                1. Peso Actual del Bebé
              </label>

              {/* Unit Toggle */}
              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-0.5 flex">
                <button
                  onClick={() => handleUnitToggle('kg')}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all select-none",
                    weightUnit === 'kg' 
                      ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm" 
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  )}
                >
                  Kilogramos (kg)
                </button>
                <button
                  onClick={() => handleUnitToggle('lb')}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all select-none",
                    weightUnit === 'lb' 
                      ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm" 
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  )}
                >
                  Libras (lbs)
                </button>
              </div>
            </div>

            {/* Weight Value Display & Modifier Buttons */}
            <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-900 p-2.5 rounded-2xl border border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={decrementWeight}
                className="w-11 h-11 flex-shrink-0 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300 rounded-xl flex items-center justify-center shadow-sm select-none border border-gray-150 dark:border-gray-705 active:scale-95 transition-all"
              >
                <Minus className="w-5 h-5 stroke-[2.5]" />
              </button>
              
              <div className="flex-1 text-center relative">
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full text-center bg-transparent border-none text-2xl font-black text-gray-800 dark:text-white focus:ring-0 focus:outline-none p-0"
                />
                <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase block -mt-1">
                  {weightUnit === 'kg' ? 'Kilogramos' : 'Libras'}
                </span>
              </div>

              <button
                type="button"
                onClick={incrementWeight}
                className="w-11 h-11 flex-shrink-0 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300 rounded-xl flex items-center justify-center shadow-sm select-none border border-gray-150 dark:border-gray-705 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Quick Helper Auto Information */}
            {latestWeightInKg && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <Info className="w-3.5 h-3.5" />
                Cargado automáticamente de la consulta más reciente ({weightUnit === 'kg' ? `${latestWeightInKg} kg` : `${(latestWeightInKg * 2.20462).toFixed(1)} lbs`}).
              </p>
            )}
          </div>

          {/* 2. Age of the Baby (Interactive slider/selection) */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
              <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap leading-none select-none">
                <Clock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                2. Edad para Parámetros
              </label>

              {profile.birthDate && (
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">Usar edad real</span>
                  <input
                    type="checkbox"
                    checked={useProfileAge}
                    onChange={(e) => setUseProfileAge(e.target.checked)}
                    className="w-4 h-4 rounded text-theme-base bg-gray-100 border-gray-300 focus:ring-theme-base accent-theme-base cursor-pointer"
                  />
                </div>
              )}
            </div>

            {(!useProfileAge || !profile.birthDate) ? (
              <div className="bg-gray-50 dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-bold">Edad del bebé (ingresa manualmente):</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Years Field */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gray-650 dark:text-gray-400 font-bold uppercase tracking-wider block">
                      Años (A)
                    </span>
                    <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-gray-150 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => {
                          const newY = Math.max(0, customYears - 1);
                          setCustomAgeMonths(newY * 12 + customMonthsOnly);
                        }}
                        className="w-8 h-8 flex-shrink-0 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-300 rounded-lg flex items-center justify-center shadow-sm select-none border border-gray-200 dark:border-gray-750 active:scale-95 transition-all text-xs font-bold"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={customYears}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const y = isNaN(val) ? 0 : Math.max(0, Math.min(5, val));
                          setCustomAgeMonths(y * 12 + customMonthsOnly);
                        }}
                        className="w-full text-center bg-transparent border-none text-base font-bold text-gray-800 dark:text-white focus:ring-0 focus:outline-none p-0"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newY = Math.min(5, customYears + 1);
                          setCustomAgeMonths(newY * 12 + customMonthsOnly);
                        }}
                        className="w-8 h-8 flex-shrink-0 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-300 rounded-lg flex items-center justify-center shadow-sm select-none border border-gray-200 dark:border-gray-750 active:scale-95 transition-all text-xs font-bold"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Months Field */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gray-650 dark:text-gray-400 font-bold uppercase tracking-wider block">
                      Meses (M)
                    </span>
                    <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-gray-150 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => {
                          const newM = Math.max(0, customMonthsOnly - 1);
                          setCustomAgeMonths(customYears * 12 + newM);
                        }}
                        className="w-8 h-8 flex-shrink-0 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-300 rounded-lg flex items-center justify-center shadow-sm select-none border border-gray-200 dark:border-gray-750 active:scale-95 transition-all text-xs font-bold"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="11"
                        value={customMonthsOnly}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const m = isNaN(val) ? 0 : Math.max(0, Math.min(11, val));
                          setCustomAgeMonths(customYears * 12 + m);
                        }}
                        className="w-full text-center bg-transparent border-none text-base font-bold text-gray-800 dark:text-white focus:ring-0 focus:outline-none p-0"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newM = Math.min(11, customMonthsOnly + 1);
                          setCustomAgeMonths(customYears * 12 + newM);
                        }}
                        className="w-8 h-8 flex-shrink-0 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-300 rounded-lg flex items-center justify-center shadow-sm select-none border border-gray-200 dark:border-gray-750 active:scale-95 transition-all text-xs font-bold"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-1.5 border-t border-gray-200/50 dark:border-gray-800/60">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold block">
                    Edad establecida: {customYears > 0 ? `${customYears} ${customYears === 1 ? 'año' : 'años'} ${customMonthsOnly > 0 ? `y ${customMonthsOnly} ${customMonthsOnly === 1 ? 'mes' : 'meses'}` : ''}` : `${customMonthsOnly} ${customMonthsOnly === 1 ? 'mes' : 'meses'}`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/20 p-3.5 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  Edad establecida automáticamente de la fecha de nacimiento:
                </span>
                <span className="text-xs font-bold text-indigo-850 dark:text-indigo-200 bg-indigo-100/50 dark:bg-indigo-850/50 px-2.5 py-1 rounded-lg border border-indigo-200/20">
                  {babyAgeLabel}
                </span>
              </div>
            )}
          </div>

          {/* 3. Feedings per custom intervals - Redesigned to be parent-friendly */}
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap leading-none select-none">
                <Milk className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                3. ¿Cada cuánto tiempo come el bebé?
              </label>
              <p className="text-[11px] text-gray-700 dark:text-gray-300 mt-1.5 leading-relaxed font-semibold">
                Selecciona el intervalo aproximado entre comidas. Esto nos ayuda a calcular cuánta leche debe llevar cada biberón individual.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
              {/* Quick Presets Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFeedingsPerDay(9)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all active:scale-[0.98]",
                    feedingsPerDay === 9
                      ? "bg-orange-500/10 border-orange-400 dark:border-orange-500/60"
                      : "bg-white dark:bg-gray-800 border-gray-150 dark:border-gray-700/80 hover:bg-gray-100/50"
                  )}
                >
                  <span className={cn("text-xs font-bold block", feedingsPerDay === 9 ? "text-orange-600 dark:text-orange-400" : "text-gray-700 dark:text-gray-200")}>
                    Cada 2.5 horas
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 block">
                    (9 tomas al día - Ideal recién nacidos)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedingsPerDay(8)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all active:scale-[0.98]",
                    feedingsPerDay === 8
                      ? "bg-orange-500/10 border-orange-400 dark:border-orange-500/60"
                      : "bg-white dark:bg-gray-800 border-gray-150 dark:border-gray-700/80 hover:bg-gray-100/50"
                  )}
                >
                  <span className={cn("text-xs font-bold block", feedingsPerDay === 8 ? "text-orange-600 dark:text-orange-400" : "text-gray-700 dark:text-gray-200")}>
                    Cada 3 horas
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 block">
                    (8 tomas al día - Estándar recomendado)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedingsPerDay(6)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all active:scale-[0.98]",
                    feedingsPerDay === 6
                      ? "bg-orange-500/10 border-orange-400 dark:border-orange-500/60"
                      : "bg-white dark:bg-gray-800 border-gray-150 dark:border-gray-700/80 hover:bg-gray-100/50"
                  )}
                >
                  <span className={cn("text-xs font-bold block", feedingsPerDay === 6 ? "text-orange-600 dark:text-orange-400" : "text-gray-700 dark:text-gray-200")}>
                    Cada 4 horas
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 block">
                    (6 tomas al día - Bebés de 3+ meses)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedingsPerDay(5)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all active:scale-[0.98]",
                    feedingsPerDay === 5
                      ? "bg-orange-500/10 border-orange-400 dark:border-orange-500/60"
                      : "bg-white dark:bg-gray-800 border-gray-150 dark:border-gray-700/80 hover:bg-gray-100/50"
                  )}
                >
                  <span className={cn("text-xs font-bold block", feedingsPerDay === 5 ? "text-orange-600 dark:text-orange-400" : "text-gray-700 dark:text-gray-200")}>
                    Cada 5 horas
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 block">
                    (5 tomas al día - Lactantes grandes)
                  </span>
                </button>
              </div>

              {/* Precise Tweak Control */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-450 leading-tight">
                  ¿Usa otra cantidad de tomas? Ajusta aquí:
                </span>
                
                <div className="flex items-center space-x-2.5 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200/80 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setFeedingsPerDay(prev => Math.max(4, prev - 1))}
                    className="w-7 h-7 flex bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-300 rounded-lg items-center justify-center border border-gray-200 dark:border-gray-750 active:scale-95 transition-all text-xs font-bold"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <div className="text-center min-w-[50px]">
                    <span className="text-xs font-black text-gray-800 dark:text-white block">
                      {feedingsPerDay}
                    </span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block -mt-0.5">
                      tomas / día
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedingsPerDay(prev => Math.min(12, prev + 1))}
                    className="w-7 h-7 flex bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-300 rounded-lg items-center justify-center border border-gray-200 dark:border-gray-750 active:scale-95 transition-all text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Dynamic Bottle & Recommended Summary Container (5 Columns) */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-6">
          
          {/* Output Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col items-center justify-center flex-1 relative overflow-hidden min-h-[300px]">
            
            {/* Soft glowing ambient circles */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-theme-base/5 filter blur-3xl" />
            <div className="absolute bottom-4 left-0 w-24 h-24 rounded-full bg-orange-500/5 filter blur-2xl" />

            {/* Bottle and measurements grid */}
            <div className="grid grid-cols-12 gap-4 w-full relative z-10">
              
              {/* Bottle Visualization (5 cols) */}
              <div className="col-span-5 flex flex-col items-center justify-center">
                <div className="relative w-16 h-48 bg-slate-950/80 rounded-b-2xl rounded-t-lg border-2 border-slate-500/50 flex items-end justify-center overflow-hidden shadow-inner">
                  
                  {/* Bottle nipple cap cap */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-5 bg-amber-400/80 rounded-t-full border border-amber-500/30" />
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-2 bg-slate-500 rounded-md" />
                  
                  {/* Fluid contents */}
                  <div 
                    className="w-full bg-gradient-to-t from-orange-50/90 via-amber-50/80 to-white/95 rounded-b-xl border-t border-amber-200/50 transition-all duration-700 ease-out flex items-center justify-center"
                    style={{ height: `${bottleFillPercentage}%` }}
                  >
                    {/* Animated bubbles in baby milk */}
                    <span className="text-[9px] font-black text-amber-500/40 select-none animate-pulse">
                      🥛
                    </span>
                  </div>

                  {/* Bottle Oz markings */}
                  <div className="absolute inset-y-2 left-0 w-full h-[90%] flex flex-col justify-between text-[10px] text-white font-black px-1.5 select-none pointer-events-none drop-shadow-[0_1.5px_2px_rgba(15,23,42,1.0)]">
                    <div className="flex justify-between w-full"><span>- 8 oz</span><span>240ml -</span></div>
                    <div className="flex justify-between w-full"><span>- 6 oz</span><span>180ml -</span></div>
                    <div className="flex justify-between w-full"><span>- 4 oz</span><span>120ml -</span></div>
                    <div className="flex justify-between w-full"><span>- 2 oz</span><span>60ml -</span></div>
                    <div className="flex justify-between w-full"><span>- 1 oz</span><span>30ml -</span></div>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-350 font-black uppercase tracking-widest text-center">
                  Biberón Estimado
                </div>
              </div>

              {/* Numerical Text Output (7 cols) */}
              <div className="col-span-7 flex flex-col justify-center space-y-4">
                
                {/* Result 1: Total hydration daily requirement */}
                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-black text-orange-350 uppercase tracking-widest block mb-0.5">
                    Sugerido Diario Total
                  </span>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <span className="text-2xl font-black text-orange-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                      {Math.round(minDailyOz)} - {Math.round(maxDailyOz)}
                    </span>
                    <span className="text-xs font-bold text-slate-300">oz</span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-semibold block mt-1">
                    ({Math.round(minDailyMl)} - {Math.round(maxDailyMl)} ml por día)
                  </span>
                </div>

                {/* Result 2: Recommended intake per feeding */}
                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-black text-sky-300 uppercase tracking-widest block mb-0.5">
                    Por Toma Recomendada
                  </span>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <span className="text-3xl font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                      {ouncesPerFeeding}
                    </span>
                    <span className="text-xs font-bold text-slate-300">oz</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1 mt-1.5 bg-emerald-950/50 border border-emerald-900/50 px-2.5 py-0.5 rounded-lg w-fit">
                    👉 {mlPerFeeding} ml / toma
                  </span>
                </div>

              </div>

            </div>

            {/* Core alert disclaimer warning */}
            <div className="mt-5 pt-3 border-t border-slate-800/80 w-full flex flex-col gap-2 text-[11px] text-slate-350 leading-relaxed font-semibold">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-450 shrink-0" />
                <span>
                  <strong className="text-orange-300">¡Guía para papás!:</strong> Cada bebé regula su apetito a libre demanda. Si tu bebé toma alrededor de <strong className="text-white">24 a 28 oz en total al día (ej: 25 oz)</strong>, está en un rango perfectamente saludable. ¡No lo fuerces a tomar más! Su ganancia constante de peso es el mejor indicador de salud.
                </span>
              </div>
            </div>

          </div>

          {/* Tips and Advice Block */}
          <div className="bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/10 dark:border-teal-400/20 rounded-3xl p-5 space-y-2.5">
            <h4 className="text-xs font-bold text-teal-800 dark:text-teal-400 tracking-wider uppercase flex items-center gap-1.5">
              💡 Consejos para la etapa: {currentTip.title}
            </h4>
            <div className="space-y-1.5 text-xs text-teal-980 dark:text-teal-200/90 leading-relaxed">
              <p>
                <strong>Intervalos recomendados:</strong> {currentTip.frequency}
              </p>
              <p>
                <strong>Guía de consumo:</strong> {currentTip.advice}
              </p>
              <p className="text-[11px] text-teal-700/80 dark:text-teal-300/80 italic">
                {currentTip.signsStatus}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
