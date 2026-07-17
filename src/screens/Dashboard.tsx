import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { 
  Clock, Droplets, Moon, Wind, Check, X, Camera, Edit3, Timer, Sparkles, 
  AlertTriangle, Save, Bath, Milk, CloudMoon, Bed, Sparkle, Heart, FlameKindling, Info,
  Apple
} from 'lucide-react';
import { cn } from '../components/Layout';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage } from '../utils/image';

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function Dashboard({ onTabChange }: { onTabChange?: (tab: any) => void }) {
  const { events, addEvent } = useStore();
  const [showConstipationWarning, setShowConstipationWarning] = useState(false);
  const [constipationSuccess, setConstipationSuccess] = useState(false);

  useEffect(() => {
    const checkConstipation = () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      const lastPooOrConstipationEvent = [...events]
        .filter(e => e.type === 'hygiene' && (e.details?.hygieneType === 'poo' || e.details?.hygieneType === 'constipation'))
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (lastPooOrConstipationEvent && lastPooOrConstipationEvent.details?.hygieneType === 'poo') {
        const timeSinceLast = now - lastPooOrConstipationEvent.timestamp;
        if (timeSinceLast > oneDayMs) {
          setShowConstipationWarning(true);
        } else {
          setShowConstipationWarning(false);
        }
      } else {
        if (lastPooOrConstipationEvent && lastPooOrConstipationEvent.details?.hygieneType === 'constipation') {
           const timeSinceLast = now - lastPooOrConstipationEvent.timestamp;
           if (timeSinceLast > oneDayMs) {
             setShowConstipationWarning(true);
           } else {
             setShowConstipationWarning(false);
           }
        } else {
          setShowConstipationWarning(false);
        }
      }
    };

    checkConstipation();
  }, [events]);

  const handleRegisterConstipation = () => {
    addEvent({
      type: 'hygiene',
      timestamp: Date.now(),
      details: { hygieneType: 'constipation' },
      notes: 'Día de estreñimiento registrado'
    });
    setConstipationSuccess(true);
    setTimeout(() => {
      setConstipationSuccess(false);
      setShowConstipationWarning(false);
    }, 1500);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-md md:max-w-none mx-auto space-y-6">
      <AnimatePresence>
        {showConstipationWarning && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="bg-gradient-to-r from-orange-50/95 to-amber-50/95 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-900/40 p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-orange-100 dark:bg-orange-900/45 text-orange-600 dark:text-orange-400 rounded-xl mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-orange-900 dark:text-orange-300">Alerta de Estreñimiento</h3>
                <p className="text-sm text-orange-700/90 dark:text-orange-400">
                  Ha pasado más de 1 día sin registros de popó. Si esto continúa, considera consultar al pediatra.
                </p>
              </div>
            </div>
            <div className="shrink-0">
               <button
                  onClick={handleRegisterConstipation}
                  disabled={constipationSuccess}
                  className={cn(
                    "py-3 px-5 rounded-xl text-sm font-bold transition-all w-full md:w-auto flex items-center justify-center space-x-2 select-none",
                    constipationSuccess 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800" 
                      : "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90 active:scale-95 shadow-md shadow-orange-500/10"
                  )}
               >
                  {constipationSuccess ? <Check className="w-4 h-4" /> : null}
                  <span>{constipationSuccess ? "¡Registrado!" : "Registrar Día"}</span>
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 pb-24 md:pb-6">
        <FeedingModule onTabChange={onTabChange} />
        <HygieneModule />
        <SleepModule onTabChange={onTabChange} />
        <BathModule />
      </div>
    </div>
  );
}

function FeedingModule({ onTabChange }: { onTabChange?: (tab: any) => void }) {
  const { addEvent, atajos_alimentacion, addAtajoAlimentacion } = useStore();
  const [feedingType, setFeedingType] = useState<'lactancia' | 'biberon' | 'solidos'>('biberon');
  
  // Date & Time
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(() => format(new Date(), 'HH:mm'));

  // Lactancia (Pecho)
  const [leftBreast, setLeftBreast] = useState('0');
  const [rightBreast, setRightBreast] = useState('0');

  // Biberón
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<'oz' | 'ml'>('oz');
  const [bottleType, setBottleType] = useState('');

  // Sólidos
  const [solidsType, setSolidsType] = useState('');
  const [solidsAmount, setSolidsAmount] = useState('');

  // Dropdowns and checkbox for food shortcuts
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showAmountDropdown, setShowAmountDropdown] = useState(false);
  const [showBiberonDropdown, setShowBiberonDropdown] = useState(false);
  const [showBottleTypeDropdown, setShowBottleTypeDropdown] = useState(false);
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);

  const filteredTypeShortcuts = atajos_alimentacion
    .filter(s => s.categoria === 'tipo_alimento')
    .filter(s => s.concepto.toLowerCase().includes(solidsType.toLowerCase()));

  const filteredAmountShortcuts = atajos_alimentacion
    .filter(s => s.categoria === 'cantidad_porcion')
    .filter(s => s.concepto.toLowerCase().includes(solidsAmount.toLowerCase()));

  const filteredBiberonShortcuts = atajos_alimentacion
    .filter(s => s.categoria === 'cantidad_biberon')
    .filter(s => {
      if (!amount) return true;
      return s.concepto.toLowerCase().includes(amount.toLowerCase());
    });

  const filteredBottleTypeShortcuts = atajos_alimentacion
    .filter(s => s.categoria === 'tipo_biberon')
    .filter(s => s.concepto.toLowerCase().includes(bottleType.toLowerCase()));

  const handleSelectBiberonShortcut = (concept: string) => {
    const numMatch = concept.match(/\d+(\.\d+)?/);
    if (numMatch) {
      setAmount(numMatch[0]);
    } else {
      setAmount(concept);
    }
    
    if (concept.toLowerCase().includes('oz')) {
      setUnit('oz');
    } else if (concept.toLowerCase().includes('ml')) {
      setUnit('ml');
    }
  };

  const [notes, setNotes] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showBurpSuccess, setShowBurpSuccess] = useState(false);

  const handleLeftBreastChange = (val: string) => {
    const num = Number(val) || 0;
    if (num > 60) {
      setLeftBreast('60');
    } else if (num < 0) {
      setLeftBreast('0');
    } else {
      setLeftBreast(val);
    }
  };

  const handleRightBreastChange = (val: string) => {
    const num = Number(val) || 0;
    if (num > 60) {
      setRightBreast('60');
    } else if (num < 0) {
      setRightBreast('0');
    } else {
      setRightBreast(val);
    }
  };

  const handleSave = () => {
    let eventTimestamp = Date.now();
    if (date && time) {
      try {
        const [year, month, day] = date.split('-').map(Number);
        const [h, m] = time.split(':').map(Number);
        const customDate = new Date(year, month - 1, day, h, m);
        if (!isNaN(customDate.getTime())) {
          eventTimestamp = customDate.getTime();
        }
      } catch (e) {
        console.error("Error parsing date/time for feeding:", e);
      }
    }

    let details: any = {};

    if (feedingType === 'lactancia') {
      const izq = Number(leftBreast) || 0;
      const der = Number(rightBreast) || 0;
      if (izq === 0 && der === 0) {
        alert('Por favor ingresa minutos para al menos un lado del pecho.');
        return;
      }
      details = {
        subtype: 'lactancia',
        duracion_pecho_izquierdo: izq,
        duracion_pecho_derecho: der,
        duracion_total_toma: izq + der
      };
    } else if (feedingType === 'biberon') {
      const amt = Number(amount) || 0;
      if (amt <= 0) {
        alert('Por favor ingresa una cantidad válida de onzas/ml.');
        return;
      }
      details = {
        subtype: 'biberon',
        amount: amt,
        unit: unit,
        bottleType: bottleType.trim() || undefined
      };
    } else if (feedingType === 'solidos') {
      if (!solidsType.trim()) {
        alert('Por favor especifica el tipo de alimento sólido.');
        return;
      }
      details = {
        subtype: 'solidos',
        solidsType: solidsType.trim(),
        solidsAmount: solidsAmount.trim() || undefined
      };
    }

    addEvent({
      type: 'feeding',
      timestamp: eventTimestamp,
      details,
      notes: notes.trim() || undefined
    });

    if (feedingType === 'solidos' && saveAsFavorite) {
      const simplifiedType = solidsType.trim().toLowerCase().replace(/\s+/g, ' ');
      const simplifiedAmount = solidsAmount.trim().toLowerCase().replace(/\s+/g, ' ');

      if (solidsType.trim() && solidsType.trim().length <= 25) {
        const typeExists = atajos_alimentacion.some(shortcut => 
          shortcut.categoria === 'tipo_alimento' &&
          shortcut.concepto.toLowerCase().trim().replace(/\s+/g, ' ') === simplifiedType
        );
        if (!typeExists) {
          addAtajoAlimentacion(solidsType.trim(), 'tipo_alimento').catch(err => {
            console.error("Error saving food shortcut automatically:", err);
          });
        }
      }

      if (solidsAmount.trim() && solidsAmount.trim().length <= 25) {
        const amountExists = atajos_alimentacion.some(shortcut => 
          shortcut.categoria === 'cantidad_porcion' &&
          shortcut.concepto.toLowerCase().trim().replace(/\s+/g, ' ') === simplifiedAmount
        );
        if (!amountExists) {
          addAtajoAlimentacion(solidsAmount.trim(), 'cantidad_porcion').catch(err => {
            console.error("Error saving food shortcut automatically:", err);
          });
        }
      }
    }

    if (feedingType === 'biberon' && saveAsFavorite) {
      const formatted = `${amount} ${unit}`;
      const simplifiedAmount = formatted.trim().toLowerCase().replace(/\s+/g, ' ');

      if (amount.trim() && formatted.length <= 25) {
        const amountExists = atajos_alimentacion.some(shortcut => 
          shortcut.categoria === 'cantidad_biberon' &&
          shortcut.concepto.toLowerCase().trim().replace(/\s+/g, ' ') === simplifiedAmount
        );
        if (!amountExists) {
          addAtajoAlimentacion(formatted, 'cantidad_biberon').catch(err => {
            console.error("Error saving food shortcut automatically:", err);
          });
        }
      }

      const simplifiedBottleType = bottleType.trim().toLowerCase().replace(/\s+/g, ' ');
      if (bottleType.trim() && bottleType.trim().length <= 25) {
        const typeExists = atajos_alimentacion.some(shortcut => 
          shortcut.categoria === 'tipo_biberon' &&
          shortcut.concepto.toLowerCase().trim().replace(/\s+/g, ' ') === simplifiedBottleType
        );
        if (!typeExists) {
          addAtajoAlimentacion(bottleType.trim(), 'tipo_biberon').catch(err => {
            console.error("Error saving food shortcut automatically:", err);
          });
        }
      }
    }

    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      setLeftBreast('0');
      setRightBreast('0');
      setAmount('');
      setBottleType('');
      setSolidsType('');
      setSolidsAmount('');
      setSaveAsFavorite(false);
      setNotes('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTime(format(new Date(), 'HH:mm'));

      if (onTabChange) {
        onTabChange('history');
      }
    }, 1500);
  };

  const handleBurp = () => {
    addEvent({
      type: 'burp',
      timestamp: Date.now(),
    });
    setShowBurpSuccess(true);
    setTimeout(() => setShowBurpSuccess(false), 1000);
  };

  return (
    <motion.div 
      whileHover={{ y: -3, boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.08)' }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/80 p-5 flex flex-col justify-between"
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-5">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-gradient-to-br from-sky-400/15 via-sky-400/10 to-transparent dark:from-sky-500/20 rounded-2xl text-sky-500 dark:text-sky-400 border border-sky-100/30">
              <Milk className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50 leading-tight">Alimentación</h2>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 md:inline-block hidden font-medium">Biberón, comida y pecho sin temporizadores</span>
            </div>
          </div>
        </div>

        {/* Feeding Type Selector */}
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200/10 dark:border-gray-700 mb-5">
          {[
            { id: 'biberon', label: 'Biberón', icon: Milk },
            { id: 'solidos', label: 'Comida', icon: Apple },
            { id: 'lactancia', label: 'Pecho', icon: Heart }
          ].map((type) => {
            const Icon = type.icon;
            const isActive = feedingType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setFeedingType(type.id as any)}
                className={cn(
                  "flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 text-xs font-bold select-none focus:outline-none focus:ring-0",
                  isActive 
                    ? "bg-white dark:bg-gray-800 shadow-sm text-theme-dark dark:text-theme-base border border-gray-200/10 dark:border-gray-700" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-sky-500" : "text-gray-400 dark:text-gray-500")} />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Subtype Forms */}
          {feedingType === 'lactancia' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Lado Izquierdo</label>
                <div className="relative">
                  <input
                    type="number"
                    max="60"
                    value={leftBreast}
                    onChange={(e) => handleLeftBreastChange(e.target.value)}
                    className="w-full p-3 pl-4 pr-12 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none text-base font-bold text-gray-900 dark:text-white transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600 dark:text-gray-400">min</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Lado Derecho</label>
                <div className="relative">
                  <input
                    type="number"
                    max="60"
                    value={rightBreast}
                    onChange={(e) => handleRightBreastChange(e.target.value)}
                    className="w-full p-3 pl-4 pr-12 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none text-base font-bold text-gray-900 dark:text-white transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600 dark:text-gray-400">min</span>
                </div>
              </div>
              <div className="col-span-2 text-xs font-bold text-sky-600 dark:text-sky-400">
                Total toma: {(Number(leftBreast) || 0) + (Number(rightBreast) || 0)} minutos
              </div>
            </div>
          )}

          {feedingType === 'biberon' && (
            <div className="space-y-3.5 animate-in fade-in">
              <div className="relative">
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Tipo de Biberón</label>
                <input
                  type="text"
                  value={bottleType}
                  onChange={(e) => {
                    setBottleType(e.target.value);
                    setShowBottleTypeDropdown(true);
                  }}
                  onFocus={() => setShowBottleTypeDropdown(true)}
                  onBlur={() => setTimeout(() => setShowBottleTypeDropdown(false), 200)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none text-xs text-gray-900 dark:text-white transition-all placeholder-gray-400"
                  placeholder="Ej. Fórmula, Leche materna, Agua..."
                />
                {showBottleTypeDropdown && filteredBottleTypeShortcuts.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                    {filteredBottleTypeShortcuts.map((shortcut) => (
                      <button
                        key={shortcut.id}
                        type="button"
                        onMouseDown={() => {
                          setBottleType(shortcut.concepto);
                          setShowBottleTypeDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium border-b border-gray-50 dark:border-gray-750 last:border-0"
                      >
                        {shortcut.concepto}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="col-span-2 relative">
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Cantidad</label>
                  <input
                    type="number"
                    step="0.5"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setShowBiberonDropdown(true);
                    }}
                    onFocus={() => setShowBiberonDropdown(true)}
                    onBlur={() => setTimeout(() => setShowBiberonDropdown(false), 200)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none text-base font-bold text-gray-900 dark:text-white transition-all"
                    placeholder="Ej. 4.5"
                  />
                  {showBiberonDropdown && filteredBiberonShortcuts.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                      {filteredBiberonShortcuts.map((shortcut) => (
                        <button
                          key={shortcut.id}
                          type="button"
                          onMouseDown={() => {
                            handleSelectBiberonShortcut(shortcut.concepto);
                            setShowBiberonDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium border-b border-gray-50 dark:border-gray-750 last:border-0"
                        >
                          {shortcut.concepto}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Unidad</label>
                  <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200/10 dark:border-gray-750">
                    <button
                      type="button"
                      onClick={() => setUnit('oz')}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all", unit === 'oz' ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400")}
                    >oz</button>
                    <button
                      type="button"
                      onClick={() => setUnit('ml')}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all", unit === 'ml' ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400")}
                    >ml</button>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2.5 py-1">
                <input
                  type="checkbox"
                  id="saveBiberonAsFavorite"
                  checked={saveAsFavorite}
                  onChange={(e) => setSaveAsFavorite(e.target.checked)}
                  className="w-4 h-4 text-sky-500 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-sky-400 animate-in fade-in"
                />
                <label htmlFor="saveBiberonAsFavorite" className="text-xs font-bold text-gray-650 dark:text-gray-300 cursor-pointer select-none">
                  ¿Guardar como favorito?
                </label>
              </div>
            </div>
          )}

          {feedingType === 'solidos' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Tipo de Comida</label>
                  <input
                    type="text"
                    value={solidsType}
                    onChange={(e) => {
                      setSolidsType(e.target.value);
                      setShowTypeDropdown(true);
                    }}
                    onFocus={() => setShowTypeDropdown(true)}
                    onBlur={() => setTimeout(() => setShowTypeDropdown(false), 200)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none text-xs text-gray-900 dark:text-white transition-all placeholder-gray-400"
                    placeholder="Ej. Papilla de manzana, avena..."
                  />
                  {showTypeDropdown && filteredTypeShortcuts.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                      {filteredTypeShortcuts.map((shortcut) => (
                        <button
                          key={shortcut.id}
                          type="button"
                          onMouseDown={() => {
                            setSolidsType(shortcut.concepto);
                            setShowTypeDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium border-b border-gray-50 dark:border-gray-750 last:border-0"
                        >
                          {shortcut.concepto}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Cantidad / Porción</label>
                  <input
                    type="text"
                    value={solidsAmount}
                    onChange={(e) => {
                      setSolidsAmount(e.target.value);
                      setShowAmountDropdown(true);
                    }}
                    onFocus={() => setShowAmountDropdown(true)}
                    onBlur={() => setTimeout(() => setShowAmountDropdown(false), 200)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none text-xs text-gray-900 dark:text-white transition-all placeholder-gray-400"
                    placeholder="Ej. 100g, 1 porción"
                  />
                  {showAmountDropdown && filteredAmountShortcuts.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                      {filteredAmountShortcuts.map((shortcut) => (
                        <button
                          key={shortcut.id}
                          type="button"
                          onMouseDown={() => {
                            setSolidsAmount(shortcut.concepto);
                            setShowAmountDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium border-b border-gray-50 dark:border-gray-750 last:border-0"
                        >
                          {shortcut.concepto}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2.5 py-1">
                <input
                  type="checkbox"
                  id="saveAsFavorite"
                  checked={saveAsFavorite}
                  onChange={(e) => setSaveAsFavorite(e.target.checked)}
                  className="w-4 h-4 text-sky-500 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-sky-400 animate-in fade-in"
                />
                <label htmlFor="saveAsFavorite" className="text-xs font-bold text-gray-650 dark:text-gray-300 cursor-pointer select-none">
                  ¿Guardar como favorito?
                </label>
              </div>
            </div>
          )}

          {/* Date & Time Selectors for back-recording */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 outline-none text-gray-950 dark:text-white transition-all font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Hora</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 outline-none text-gray-950 dark:text-white transition-all font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Observaciones</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Tomó con buen apetito"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 outline-none text-gray-900 dark:text-white transition-all placeholder-gray-500"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={showSaveSuccess}
            className={cn(
              "w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-300 select-none shadow-sm",
              showSaveSuccess 
                ? "bg-green-100 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 scale-95" 
                : "bg-theme-dark dark:bg-theme-dark/95 text-white hover:opacity-90 active:scale-98 disabled:opacity-40"
            )}
          >
            {showSaveSuccess ? <Check className="w-5 h-5 animate-bounce" /> : <Save className="w-5 h-5" />}
            <span>{showSaveSuccess ? "¡Registrado!" : "Registrar Alimentación"}</span>
          </button>
        </div>
      </div>

      <div className="mt-4 pt-1 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={handleBurp}
          className={cn(
            "w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2.5 transition-all duration-300 border select-none",
            showBurpSuccess 
              ? "bg-green-100 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 scale-95 shadow-sm" 
              : "bg-gray-50 hover:bg-gray-100/80 border-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-200 hover:shadow-xs active:scale-[0.98]"
          )}
        >
          {showBurpSuccess ? <Check className="w-5 h-5 text-green-500 animate-bounce" /> : <Wind className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
          <span>{showBurpSuccess ? "¡Registrado!" : "Registrar Eructo"}</span>
        </button>
      </div>
    </motion.div>
  );
}

function HygieneModule() {
  const { addEvent } = useStore();
  const [type, setType] = useState<'pee' | 'poo' | null>(null);
  const [level, setLevel] = useState<'poco' | 'medio' | 'lleno' | null>(null);
  const [texture, setTexture] = useState<'liquido' | 'viscoso' | 'pastoso' | 'duro' | 'diarrea' | null>(null);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setPhotoUrl(compressedBase64);
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Hubo un error al procesar la imagen. Intenta con una más pequeña.");
      }
    }
  };

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleSave = () => {
    if (!type) return;
    if (type === 'pee' && !level) {
      setError('Por favor, selecciona el nivel de llenado del pañal');
      return;
    }
    if (type === 'poo' && !texture) {
      setError('Por favor, selecciona la consistencia / textura del popó');
      return;
    }

    setError(null);
    addEvent({
      type: 'hygiene',
      timestamp: Date.now(),
      details: {
        hygieneType: type,
        level: type === 'pee' ? level || undefined : undefined,
        texture: type === 'poo' ? texture || undefined : undefined,
        photoUrl: type === 'poo' && photoUrl ? photoUrl : undefined,
      },
      notes
    });

    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      setType(null);
      setLevel(null);
      setTexture(null);
      setNotes('');
      setPhotoUrl(null);
    }, 1000);
  };

  return (
    <motion.div 
      whileHover={{ y: -3, boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.08)' }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/80 p-5 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center space-x-3.5 mb-5">
          <div className="p-3 bg-gradient-to-br from-amber-400/15 via-amber-400/10 to-transparent dark:from-amber-500/20 rounded-2xl text-amber-500 dark:text-amber-400 border border-amber-100/30">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">Higiene</h2>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 md:inline-block hidden font-medium">Registro de pañal: pipí o popó</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={() => { setType('pee'); setTexture(null); setPhotoUrl(null); setError(null); }}
              className={cn(
                "flex-1 py-4 rounded-2xl font-bold border transition-all text-sm flex flex-col items-center justify-center space-y-1.5 select-none",
                type === 'pee' 
                  ? "bg-yellow-500/5 border-yellow-300 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50/50 dark:from-yellow-950/20 dark:to-amber-950/10 ring-2 ring-yellow-400/10 shadow-sm" 
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-800 dark:bg-gray-800/40 dark:border-gray-700 hover:bg-gray-100/60 dark:hover:bg-gray-700 font-extrabold"
              )}
            >
              <span className="text-2xl drop-shadow-sm">💛</span>
              <span>Pipí</span>
            </button>
            <button
              onClick={() => { setType('poo'); setLevel(null); setError(null); }}
              className={cn(
                "flex-1 py-4 rounded-2xl font-bold border transition-all text-sm flex flex-col items-center justify-center space-y-1.5 select-none",
                type === 'poo' 
                  ? "bg-amber-100 border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 ring-2 ring-amber-400/10 shadow-sm" 
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-800 dark:bg-gray-800/40 dark:border-gray-700 hover:bg-gray-100/60 dark:hover:bg-gray-700 font-extrabold"
              )}
            >
              <span className="text-2xl drop-shadow-sm">💩</span>
              <span>Popó</span>
            </button>
          </div>

          {type === 'pee' && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 pt-1"
            >
              <label className="block text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Nivel de Humedad</label>
              <div className="flex space-x-2">
                {['poco', 'medio', 'lleno'].map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLevel(l as any); setError(null); }}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-xs font-bold border capitalize transition-all select-none",
                      level === l 
                        ? "bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-700 dark:text-yellow-300 font-bold" 
                        : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-800"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {type === 'poo' && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-1"
            >
              <div>
                <label className="block text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">Consistencia / Alertas</label>
                
                <button
                  onClick={() => { setTexture('diarrea'); setError(null); }}
                  className={cn(
                    "w-full mb-3 py-3 rounded-2xl font-bold border transition-all flex items-center justify-center space-x-2 select-none",
                    texture === 'diarrea' 
                      ? "bg-red-50 dark:bg-red-950/20 border-red-400 text-red-800 dark:text-red-400 ring-2 ring-red-400/10 shadow-sm" 
                      : "bg-red-50/20 border-red-200 text-red-600 hover:bg-red-50 dark:bg-red-950/10 dark:border-red-900/10 dark:text-red-400 dark:hover:bg-red-900/15 font-black"
                  )}
                >
                  <AlertTriangle className="w-4 h-4 animate-bounce text-red-500" />
                  <span>Alerta: Diarrea</span>
                </button>

                <div className="flex space-x-2">
                  {['liquido', 'viscoso', 'pastoso', 'duro'].map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTexture(t as any); setError(null); }}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold border capitalize transition-all select-none",
                        texture === t 
                          ? "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/20 dark:border-amber-700 dark:text-amber-300" 
                          : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-800"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">Foto de Referencia (Opcional)</label>
                {photoUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 h-36 bg-gray-50 dark:bg-gray-900">
                    <img src={photoUrl} alt="Foto pañal" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => setPhotoUrl(null)}
                      className="absolute top-3 right-3 p-2 bg-black/60 shadow text-white rounded-full hover:bg-black/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4.5 border-2 border-dashed border-gray-200 hover:border-amber-300 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-350 hover:bg-amber-500/5 transition-all flex flex-col items-center justify-center space-y-1.5"
                  >
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-650 dark:text-gray-350">Capturar o subir imagen</span>
                  </button>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </motion.div>
          )}

          {type && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 pt-1"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-bold text-red-650 dark:text-red-400 flex items-center space-x-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </motion.div>
              )}

              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Color normal, sin irritación"
                className="w-full p-3.5 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/30 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                onClick={handleSave}
                disabled={!type || showSaveSuccess}
                className={cn(
                  "w-full py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-300 select-none shadow-sm",
                  showSaveSuccess 
                    ? "bg-green-100 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 scale-95" 
                    : "bg-theme-dark dark:bg-theme-dark/95 text-white hover:opacity-90 active:scale-98 disabled:opacity-40"
                )}
              >
                {showSaveSuccess ? <Check className="w-5 h-5 animate-bounce" /> : <Save className="w-5 h-5" />}
                <span>{showSaveSuccess ? "¡Registrado!" : "Guardar Registro"}</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SleepModule({ onTabChange }: { onTabChange?: (tab: any) => void }) {
  const { addEvent } = useStore();
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [endTime, setEndTime] = useState(() => format(new Date(), 'HH:mm'));
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('0');
  const [notes, setNotes] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const getCalculatedTimes = () => {
    if (!date || !endTime) return null;
    try {
      const [year, month, day] = date.split('-').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const endDateTime = new Date(year, month - 1, day, endH, endM);

      const hrs = Number(hours) || 0;
      const mins = Number(minutes) || 0;
      const durationMs = (hrs * 60 + mins) * 60 * 1000;

      const startDateTime = new Date(endDateTime.getTime() - durationMs);
      return {
        start: startDateTime,
        end: endDateTime,
        durationMs,
        startStr: format(startDateTime, 'HH:mm'),
        startDateStr: format(startDateTime, 'dd/MM/yyyy')
      };
    } catch (e) {
      return null;
    }
  };

  const times = getCalculatedTimes();

  const handleSave = () => {
    if (!times) return;

    if (times.durationMs <= 0) {
      alert('La duración del sueño debe ser mayor a 0 minutos.');
      return;
    }

    addEvent({
      type: 'sleep',
      timestamp: times.start.getTime(),
      endTimestamp: times.end.getTime(),
      notes: notes.trim() || undefined
    });

    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      setHours('1');
      setMinutes('0');
      setNotes('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setEndTime(format(new Date(), 'HH:mm'));

      if (onTabChange) {
        onTabChange('history');
      }
    }, 1500);
  };

  return (
    <motion.div 
      whileHover={{ y: -3, boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.08)' }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/80 p-5 flex flex-col justify-between"
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-5">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-gradient-to-br from-indigo-400/15 via-indigo-400/10 to-transparent dark:from-indigo-500/20 rounded-2xl text-indigo-500 dark:text-indigo-400 border border-indigo-100/30">
              <CloudMoon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">Sueño</h2>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 md:inline-block hidden font-medium">Registra siestas e historial sin temporizadores</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Fecha de Siesta</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-gray-950 dark:text-white transition-all font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Hora de Fin</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-gray-950 dark:text-white transition-all font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Horas de Sueño</label>
              <input
                type="number"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-gray-950 dark:text-white transition-all"
                placeholder="Ej. 1"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Minutos de Sueño</label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-gray-950 dark:text-white transition-all"
                placeholder="Ej. 30"
              />
            </div>
          </div>

          {/* Computed times preview */}
          {times && (
            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/25 border border-indigo-100/50 dark:border-indigo-900/40 rounded-2xl flex items-start space-x-3 text-xs leading-relaxed">
              <span className="text-base text-indigo-500">⏰</span>
              <div>
                <span className="font-extrabold text-indigo-950 dark:text-indigo-200 block uppercase tracking-wider text-[10px] mb-1">Cálculo Automático</span>
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  Inicio estimado: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{times.startStr}</strong> ({times.startDateStr})
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                  Fin de la siesta: <span className="font-bold">{endTime}</span> ({format(times.end, 'dd/MM/yyyy')})
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Observaciones</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Tomó siesta corta pero reparadora"
              className="w-full p-3.5 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all placeholder-gray-500"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={showSaveSuccess}
            className={cn(
              "w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-300 select-none shadow-sm",
              showSaveSuccess 
                ? "bg-green-100 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 scale-95" 
                : "bg-indigo-600 dark:bg-indigo-500 text-white hover:opacity-90 active:scale-98 disabled:opacity-40"
            )}
          >
            {showSaveSuccess ? <Check className="w-5 h-5 animate-bounce" /> : <Save className="w-5 h-5" />}
            <span>{showSaveSuccess ? "¡Registrado!" : "Registrar Sueño"}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function BathModule() {
  const { addEvent } = useStore();
  const [notes, setNotes] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleSave = () => {
    addEvent({
      type: 'bath',
      timestamp: Date.now(),
      notes
    });

    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      setNotes('');
    }, 1000);
  };

  return (
    <motion.div 
      whileHover={{ y: -3, boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.08)' }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/80 p-5 flex flex-col justify-between md:mb-0 mb-12"
    >
      <div>
        <div className="flex items-center space-x-3.5 mb-5">
          <div className="p-3 bg-gradient-to-br from-teal-400/15 via-teal-400/10 to-transparent dark:from-teal-500/20 rounded-2xl text-teal-500 dark:text-teal-400 border border-teal-100/30">
            <Bath className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">Baño</h2>
            <span className="text-[11px] text-gray-650 dark:text-gray-400 md:inline-block hidden font-medium">Registra momentos refrescantes y relajantes</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="animate-in fade-in duration-200 space-y-3">
            <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">Notas de Baño</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Cómo le fue en el baño? ¿Usaste algún champú especial o juguete nuevo?..."
              className="w-full p-3.5 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-2xl text-sm focus:ring-2 focus:ring-teal-400 outline-none resize-none h-24 text-gray-900 dark:text-white transition-all placeholder-gray-500 dark:placeholder-gray-400"
            />
            <button
              onClick={handleSave}
              disabled={showSaveSuccess}
              className={cn(
                "w-full py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-300 select-none shadow-sm",
                showSaveSuccess 
                  ? "bg-green-100 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 scale-95" 
                  : "bg-theme-dark dark:bg-theme-dark/95 text-white hover:opacity-90 active:scale-98 disabled:opacity-40"
              )}
            >
              {showSaveSuccess ? <Check className="w-5 h-5 animate-bounce" /> : <Save className="w-5 h-5" />}
              <span>{showSaveSuccess ? "¡Registrado!" : "Registrar Baño"}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
