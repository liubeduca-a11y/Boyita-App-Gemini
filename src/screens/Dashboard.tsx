import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { 
  Clock, Droplets, Moon, Wind, Check, X, Camera, Edit3, Timer, Sparkles, 
  AlertTriangle, Save, Bath, Milk, CloudMoon, Bed, Sparkle, Heart, FlameKindling, Info
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

export function Dashboard() {
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
    <div className="p-4 md:p-8 max-w-md md:max-w-none mx-auto space-y-6">
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
        <FeedingModule />
        <HygieneModule />
        <SleepModule />
        <BathModule />
      </div>
    </div>
  );
}

function FeedingModule() {
  const { activeFeeding, startFeeding, stopFeeding, addEvent } = useStore();
  const [elapsed, setElapsed] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [oz, setOz] = useState('');
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<'timer' | 'manual'>('manual');

  useEffect(() => {
    let interval: number;
    if (activeFeeding) {
      interval = window.setInterval(() => {
        setElapsed(Date.now() - activeFeeding.startTime);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeFeeding]);

  const handleStop = () => {
    setShowModal(true);
  };

  const handleSaveTimer = () => {
    stopFeeding(Number(oz), notes);
    setShowModal(false);
    setOz('');
    setNotes('');
  };

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleSaveManual = () => {
    if (!oz) return;
    addEvent({
      type: 'feeding',
      timestamp: Date.now(),
      details: { amount: Number(oz) },
      notes
    });
    setOz('');
    setNotes('');
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 1000);
  };

  const [showBurpSuccess, setShowBurpSuccess] = useState(false);

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
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">Alimentación</h2>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 md:inline-block hidden">Tomas y onzas de fórmula o leche</span>
            </div>
          </div>
          <div className="flex bg-gray-100/90 dark:bg-gray-700 p-1 rounded-xl border border-gray-200/20 shrink-0">
            <button
              onClick={() => setMode('manual')}
              className={cn(
                "p-2 rounded-lg transition-all flex items-center space-x-1.5 text-xs font-bold select-none focus:outline-none focus:ring-0",
                mode === 'manual' 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-theme-dark dark:text-theme-base border border-gray-200/10 dark:border-gray-600" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Manual</span>
            </button>
            <button
              onClick={() => setMode('timer')}
              className={cn(
                "p-2 rounded-lg transition-all flex items-center space-x-1.5 text-xs font-bold select-none focus:outline-none focus:ring-0",
                mode === 'timer' 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-theme-dark dark:text-theme-base border border-gray-200/10 dark:border-gray-600" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Crono</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {mode === 'timer' ? (
            activeFeeding ? (
              <div className="flex flex-col items-center p-6 bg-gradient-to-br from-sky-50/60 to-indigo-50/20 dark:from-sky-950/15 dark:to-indigo-950/5 rounded-2xl border border-sky-100/80 dark:border-sky-900/30 shadow-inner relative overflow-hidden">
                <div className="absolute top-3 right-4 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest">En Curso</span>
                </div>
                <span className="text-4xl font-mono font-bold text-sky-600 dark:text-sky-400 mb-5 tracking-tight">
                  {formatDuration(elapsed)}
                </span>
                <button
                  onClick={handleStop}
                  className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 active:scale-98 text-white rounded-xl font-bold text-base transition-all shadow-md shadow-red-500/15 select-none"
                >
                  Finalizar Toma
                </button>
              </div>
            ) : (
              <button
                onClick={startFeeding}
                className="w-full py-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 hover:bg-sky-50/20 dark:hover:bg-sky-950/10 active:scale-[0.99] text-sky-600 dark:text-sky-400 border border-dashed border-sky-300 dark:border-sky-800/80 rounded-2xl font-bold text-base transition-all shadow-sm flex items-center justify-center space-x-2.5 select-none"
              >
                <div className="bg-sky-100 dark:bg-sky-950 p-2 rounded-xl text-sky-600 dark:text-sky-400">
                  <Timer className="w-5 h-5" />
                </div>
                <span>Iniciar Cronómetro de Toma</span>
              </button>
            )
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Onzas Consumidas</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={oz}
                    onChange={(e) => setOz(e.target.value)}
                    className="w-full p-3.5 pl-4 border border-gray-200 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl focus:ring-2 focus:ring-sky-400 dark:focus:ring-sky-500/50 outline-none text-lg font-bold text-gray-900 dark:text-white transition-all"
                    placeholder="Ej. 4.5"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 dark:text-gray-400">oz</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Observaciones</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Tomó con buen ritmo, con eructo hábil"
                  className="w-full p-3.5 border border-gray-200 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 dark:focus:ring-sky-500/50 outline-none text-gray-900 dark:text-white transition-all"
                />
              </div>
              <button
                onClick={handleSaveManual}
                disabled={!oz || showSaveSuccess}
                className={cn(
                  "w-full py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-300 select-none shadow-sm",
                  showSaveSuccess 
                    ? "bg-green-100 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 scale-95" 
                    : "bg-theme-dark dark:bg-theme-dark/95 text-white hover:opacity-90 active:scale-98 disabled:opacity-40"
                )}
              >
                {showSaveSuccess ? <Check className="w-5 h-5 animate-bounce" /> : <Save className="w-5 h-5" />}
                <span>{showSaveSuccess ? "¡Registrado!" : "Registrar Toma"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-1">
        <button
          onClick={handleBurp}
          className={cn(
            "w-full py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2.5 transition-all duration-300 border select-none",
            showBurpSuccess 
              ? "bg-green-100 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 scale-95 shadow-sm" 
              : "bg-gray-50 hover:bg-gray-100/80 border-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-200 hover:shadow-xs active:scale-[0.98]"
          )}
        >
          {showBurpSuccess ? <Check className="w-5 h-5 text-green-500 animate-bounce" /> : <Wind className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
          <span>{showBurpSuccess ? "¡Registrado!" : "Registrar Eructo"}</span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center space-x-2">
              <span className="p-1.5 bg-sky-100 dark:bg-sky-900 text-sky-600 rounded-lg">👶</span>
              <span>Finalizar Toma</span>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Onzas Consumidas</label>
                <input
                  type="number"
                  step="0.5"
                  value={oz}
                  onChange={(e) => setOz(e.target.value)}
                  className="w-full p-3.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none text-lg font-bold text-gray-900 dark:text-white"
                  placeholder="Ej. 4.5"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Observaciones</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none resize-none text-sm text-gray-900 dark:text-white"
                  rows={2}
                  placeholder="Opcional..."
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTimer}
                  disabled={!oz}
                  className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-2xl font-bold text-sm disabled:opacity-40 select-none shadow-md shadow-sky-500/10 hover:opacity-95"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">Higiene</h2>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 md:inline-block hidden">Registro de pañal: pipí o popó</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={() => { setType('pee'); setTexture(null); setPhotoUrl(null); }}
              className={cn(
                "flex-1 py-4 rounded-2xl font-bold border transition-all text-sm flex flex-col items-center justify-center space-y-1.5 select-none",
                type === 'pee' 
                  ? "bg-yellow-500/5 border-yellow-300 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50/50 dark:from-yellow-950/20 dark:to-amber-950/10 ring-2 ring-yellow-400/10 shadow-sm" 
                  : "bg-gray-50 border-gray-100 text-gray-500 hover:text-gray-700 dark:bg-gray-800/40 dark:border-gray-700 hover:bg-gray-100/60 dark:hover:bg-gray-700"
              )}
            >
              <span className="text-2xl drop-shadow-sm">💛</span>
              <span>Pipí</span>
            </button>
            <button
              onClick={() => { setType('poo'); setLevel(null); }}
              className={cn(
                "flex-1 py-4 rounded-2xl font-bold border transition-all text-sm flex flex-col items-center justify-center space-y-1.5 select-none",
                type === 'poo' 
                  ? "bg-amber-100 border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 ring-2 ring-amber-400/10 shadow-sm" 
                  : "bg-gray-50 border-gray-100 text-gray-500 hover:text-gray-700 dark:bg-gray-800/40 dark:border-gray-700 hover:bg-gray-100/60 dark:hover:bg-gray-700"
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
              <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Nivel de Humedad</label>
              <div className="flex space-x-2">
                {['poco', 'medio', 'lleno'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l as any)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-xs font-bold border capitalize transition-all select-none",
                      level === l 
                        ? "bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-700 dark:text-yellow-300 font-bold" 
                        : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-700"
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
                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Consistencia / Alertas</label>
                
                <button
                  onClick={() => setTexture('diarrea')}
                  className={cn(
                    "w-full mb-3 py-3 rounded-2xl font-bold border transition-all flex items-center justify-center space-x-2 select-none",
                    texture === 'diarrea' 
                      ? "bg-red-50 dark:bg-red-950/20 border-red-400 text-red-800 dark:text-red-400 ring-2 ring-red-400/10 shadow-sm" 
                      : "bg-red-50/20 border-red-200/55 text-red-600 hover:bg-red-50 dark:bg-red-950/10 dark:border-red-900/10 dark:text-red-400 dark:hover:bg-red-900/15"
                  )}
                >
                  <AlertTriangle className="w-4 h-4 animate-bounce text-red-500" />
                  <span>Alerta: Diarrea</span>
                </button>

                <div className="flex space-x-2">
                  {['liquido', 'viscoso', 'pastoso', 'duro'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTexture(t as any)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold border capitalize transition-all select-none",
                        texture === t 
                          ? "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/20 dark:border-amber-700 dark:text-amber-300" 
                          : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest mb-2">Foto de Referencia (Opcional)</label>
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
                    className="w-full py-4.5 border-2 border-dashed border-gray-200 hover:border-amber-305 dark:border-gray-700 rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-amber-500/5 transition-all flex flex-col items-center justify-center space-y-1.5"
                  >
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 dark:text-gray-550">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Capturar o subir imagen</span>
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
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Color normal, sin irritación"
                className="w-full p-3.5 border border-gray-200 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/30 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 outline-none text-gray-900 dark:text-white"
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

function SleepModule() {
  const { activeSleep, startSleep, stopSleep, addEvent } = useStore();
  const [elapsed, setElapsed] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<'timer' | 'manual'>('timer');
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');

  useEffect(() => {
    let interval: number;
    if (activeSleep) {
      interval = window.setInterval(() => {
        setElapsed(Date.now() - activeSleep.startTime);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeSleep]);

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleSaveTimer = () => {
    stopSleep(notes);
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      setShowModal(false);
      setNotes('');
    }, 1000);
  };

  const handleSaveManual = () => {
    if (!manualStart || !manualEnd) return;
    const start = new Date(manualStart).getTime();
    const end = new Date(manualEnd).getTime();
    if (end <= start) {
      alert('La hora de fin debe ser mayor a la de inicio');
      return;
    }
    addEvent({
      type: 'sleep',
      timestamp: start,
      endTimestamp: end,
      notes
    });
    setManualStart('');
    setManualEnd('');
    setNotes('');
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 1000);
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
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">Sueño</h2>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 md:inline-block hidden">Gestiona siestas y descanso nocturno</span>
            </div>
          </div>
          <div className="flex bg-gray-100/90 dark:bg-gray-700 p-1 rounded-xl border border-gray-200/20 shrink-0">
            <button
              onClick={() => setMode('timer')}
              className={cn(
                "p-2 rounded-lg transition-all flex items-center space-x-1.5 text-xs font-bold select-none focus:outline-none focus:ring-0",
                mode === 'timer' 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-theme-dark dark:text-theme-base border border-gray-200/10 dark:border-gray-600" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Crono</span>
            </button>
            <button
              onClick={() => setMode('manual')}
              className={cn(
                "p-2 rounded-lg transition-all flex items-center space-x-1.5 text-xs font-bold select-none focus:outline-none focus:ring-0",
                mode === 'manual' 
                  ? "bg-white dark:bg-gray-700 shadow-sm text-theme-dark dark:text-theme-base border border-gray-200/10 dark:border-gray-600" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Manual</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {mode === 'timer' ? (
            activeSleep ? (
              <div className="flex flex-col items-center p-6 bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-900/40 text-slate-100 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-2 left-4 text-indigo-300 opacity-60 animate-pulse text-xs">✨</div>
                <div className="absolute bottom-4 right-6 text-indigo-300 opacity-40 animate-pulse text-sm">✦</div>
                <div className="absolute top-4 right-10 text-indigo-400 opacity-50 text-xs">⭐</div>

                <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest mb-1.5 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                  <span>Durmiendo...</span>
                </span>
                <span className="text-4xl font-mono font-bold text-white mb-5 tracking-tight drop-shadow-sm">
                  {formatDuration(elapsed)}
                </span>
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-95 active:scale-98 text-white rounded-xl font-bold text-base transition-all shadow-md shadow-indigo-900/30 select-none"
                >
                  Despertar ☀️
                </button>
              </div>
            ) : (
              <button
                onClick={startSleep}
                className="w-full py-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 active:scale-[0.99] text-indigo-600 dark:text-indigo-400 border border-dashed border-indigo-300 dark:border-indigo-805/80 rounded-2xl font-bold text-base transition-all shadow-sm flex items-center justify-center space-x-2.5 select-none"
              >
                <div className="bg-indigo-100 dark:bg-indigo-950 p-2 rounded-xl text-indigo-600 dark:text-indigo-405">
                  <Moon className="w-5 h-5" />
                </div>
                <span>Registrar Inicio de Sueño</span>
              </button>
            )
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Inicio</label>
                  <input
                    type="datetime-local"
                    value={manualStart}
                    onChange={(e) => setManualStart(e.target.value)}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-gray-950 dark:text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Fin</label>
                  <input
                    type="datetime-local"
                    value={manualEnd}
                    onChange={(e) => setManualEnd(e.target.value)}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-gray-950 dark:text-white transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-sans">Observaciones</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Tomó siesta corta pero reparadora"
                  className="w-full p-3.5 border border-gray-200 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all"
                />
              </div>
              <button
                onClick={handleSaveManual}
                disabled={!manualStart || !manualEnd || showSaveSuccess}
                className={cn(
                  "w-full py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-300 select-none shadow-sm",
                  showSaveSuccess 
                    ? "bg-green-100 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 scale-95" 
                    : "bg-indigo-600 dark:bg-indigo-500 text-white hover:opacity-90 active:scale-98 disabled:opacity-40"
                )}
              >
                {showSaveSuccess ? <Check className="w-5 h-5 animate-bounce" /> : <Moon className="w-5 h-5" />}
                <span>{showSaveSuccess ? "¡Registrado!" : "Registrar Sueño"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center space-x-2">
              <span className="p-1.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 rounded-lg">🌙</span>
              <span>Fin del Sueño</span>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Observaciones</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm text-gray-900 dark:text-white"
                  rows={2}
                  placeholder="Opcional..."
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTimer}
                  disabled={showSaveSuccess}
                  className={cn(
                    "flex-1 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 text-sm shadow-md",
                    showSaveSuccess
                      ? "bg-green-105 border border-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-400 scale-95"
                      : "bg-indigo-500 text-white shadow-indigo-500/10 hover:opacity-95"
                  )}
                >
                  {showSaveSuccess ? <Check className="w-5 h-5" /> : null}
                  <span>{showSaveSuccess ? "¡Guardado!" : "Guardar"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">Baño</h2>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 md:inline-block hidden">Registra momentos refrescantes y relajantes</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="animate-in fade-in duration-200 space-y-3">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notas de Baño</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Cómo le fue en el baño? ¿Usaste algún champú especial o juguete nuevo?..."
              className="w-full p-3.5 border border-gray-200 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-2xl text-sm focus:ring-2 focus:ring-teal-400 outline-none resize-none h-24 text-gray-900 dark:text-white transition-all"
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
