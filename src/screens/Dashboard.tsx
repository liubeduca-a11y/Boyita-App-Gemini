import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Clock, Droplets, Moon, Wind, Check, X, Camera, Edit3, Timer, Sparkles, AlertTriangle, Save, Bath } from 'lucide-react';
import { cn } from '../components/Layout';
import confetti from 'canvas-confetti';
import { compressImage } from '../utils/image';

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function Dashboard() {
  const { events } = useStore();
  const [showConstipationWarning, setShowConstipationWarning] = useState(false);

  useEffect(() => {
    const checkConstipation = () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      const lastPooEvent = [...events]
        .filter(e => e.type === 'hygiene' && e.details?.hygieneType === 'poo')
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (lastPooEvent) {
        const timeSinceLastPoo = now - lastPooEvent.timestamp;
        if (timeSinceLastPoo > oneDayMs) {
          setShowConstipationWarning(true);
        } else {
          setShowConstipationWarning(false);
        }
      }
    };

    checkConstipation();
  }, [events]);

  return (
    <div className="p-4 md:p-8 max-w-md md:max-w-none mx-auto space-y-6">
      {showConstipationWarning && (
        <div className="bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 p-4 rounded-r-xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-orange-800 dark:text-orange-300">Alerta de Estreñimiento</h3>
            <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
              Ha pasado más de 1 día sin registros de popó. Si esto continúa, considera consultar al pediatra.
            </p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-theme-light dark:bg-theme-dark/20 rounded-xl text-theme-dark dark:text-theme-base">
            <Droplets className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Alimentación</h2>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setMode('manual')}
            className={cn("p-1.5 rounded-md transition-all", mode === 'manual' ? "bg-white dark:bg-gray-600 shadow-sm text-theme-dark dark:text-theme-base" : "text-gray-500 dark:text-gray-400")}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMode('timer')}
            className={cn("p-1.5 rounded-md transition-all", mode === 'timer' ? "bg-white dark:bg-gray-600 shadow-sm text-theme-dark dark:text-theme-base" : "text-gray-500 dark:text-gray-400")}
          >
            <Timer className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {mode === 'timer' ? (
          activeFeeding ? (
            <div className="flex flex-col items-center p-6 bg-theme-light/50 dark:bg-theme-dark/10 rounded-xl border border-theme-base/20 dark:border-theme-base/10">
              <span className="text-3xl font-mono font-medium text-theme-dark dark:text-theme-base mb-4">
                {formatDuration(elapsed)}
              </span>
              <button
                onClick={handleStop}
                className="w-full py-4 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-xl font-semibold text-lg transition-colors shadow-sm"
              >
                Finalizar Toma
              </button>
            </div>
          ) : (
            <button
              onClick={startFeeding}
              className="w-full py-4 bg-theme-base hover:bg-theme-dark dark:hover:bg-theme-light active:scale-[0.98] text-theme-text rounded-xl font-semibold text-lg transition-all shadow-sm flex items-center justify-center space-x-2"
            >
              <Timer className="w-5 h-5" />
              <span>Iniciar Cronómetro</span>
            </button>
          )
        ) : (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Onzas Consumidas</label>
              <input
                type="number"
                step="0.5"
                value={oz}
                onChange={(e) => setOz(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-theme-base outline-none text-lg text-gray-900 dark:text-white"
                placeholder="Ej. 4.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentarios del padre</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones..."
                className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-theme-base outline-none text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={handleSaveManual}
              disabled={!oz || showSaveSuccess}
              className={cn(
                "w-full py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-300",
                showSaveSuccess 
                  ? "bg-green-100 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 scale-95" 
                  : "bg-theme-dark text-white disabled:opacity-50"
              )}
            >
              <Check className="w-5 h-5" />
              <span>{showSaveSuccess ? "¡Registrado!" : "Registrar Toma"}</span>
            </button>
          </div>
        )}

        <button
          onClick={handleBurp}
          className={cn(
            "w-full py-3 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all duration-300",
            showBurpSuccess 
              ? "bg-green-100 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 scale-95" 
              : "bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-700 dark:border-gray-700 dark:text-gray-300 active:scale-[0.98]"
          )}
        >
          {showBurpSuccess ? <Check className="w-5 h-5" /> : <Wind className="w-5 h-5" />}
          <span>{showBurpSuccess ? "¡Registrado!" : "Registrar Eructo"}</span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Finalizar Toma</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Onzas Consumidas</label>
                <input
                  type="number"
                  step="0.5"
                  value={oz}
                  onChange={(e) => setOz(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-theme-base focus:border-theme-base outline-none text-lg text-gray-900 dark:text-white"
                  placeholder="Ej. 4.5"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-theme-base outline-none resize-none text-gray-900 dark:text-white"
                  rows={2}
                  placeholder="Opcional..."
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTimer}
                  disabled={!oz}
                  className="flex-1 py-3 bg-theme-base text-theme-text rounded-xl font-semibold disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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
      // Reset after animation
      setType(null);
      setLevel(null);
      setTexture(null);
      setNotes('');
      setPhotoUrl(null);
    }, 1000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-theme-light dark:bg-theme-dark/20 rounded-xl text-theme-dark dark:text-theme-base">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Higiene</h2>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-3">
          <button
            onClick={() => { setType('pee'); setTexture(null); setPhotoUrl(null); }}
            className={cn(
              "flex-1 py-3 rounded-xl font-medium border transition-all",
              type === 'pee' ? "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300" : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-400"
            )}
          >
            Pipí
          </button>
          <button
            onClick={() => { setType('poo'); setLevel(null); }}
            className={cn(
              "flex-1 py-3 rounded-xl font-medium border transition-all",
              type === 'poo' ? "bg-orange-100 border-orange-300 text-orange-900 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300" : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-400"
            )}
          >
            Popó
          </button>
        </div>

        {type === 'pee' && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nivel</label>
            <div className="flex space-x-2">
              {['poco', 'medio', 'lleno'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l as any)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium border capitalize transition-all",
                    level === l ? "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300" : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === 'poo' && (
          <div className="animate-in slide-in-from-top-2 duration-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Textura</label>
              
              <button
                onClick={() => setTexture('diarrea')}
                className={cn(
                  "w-full mb-3 py-3 rounded-xl font-bold border transition-all flex items-center justify-center space-x-2",
                  texture === 'diarrea' 
                    ? "bg-red-100 border-red-400 text-red-800 dark:bg-red-900/40 dark:border-red-600 dark:text-red-300 shadow-sm" 
                    : "bg-red-50/50 border-red-200 text-red-600 hover:bg-red-50 dark:bg-red-900/10 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
                )}
              >
                <AlertTriangle className="w-5 h-5" />
                <span>Diarrea</span>
              </button>

              <div className="flex space-x-2">
                {['liquido', 'viscoso', 'pastoso', 'duro'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTexture(t as any)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium border capitalize transition-all",
                      texture === t ? "bg-orange-100 border-orange-300 text-orange-900 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300" : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Foto (Opcional)</label>
              {photoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 h-32 bg-gray-50 dark:bg-gray-700">
                  <img src={photoUrl} alt="Popó" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setPhotoUrl(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 transition-all flex flex-col items-center justify-center space-y-2"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-sm font-medium">Tomar foto o subir imagen</span>
                </button>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoChange} 
                accept="image/*" 
                capture="environment"
                className="hidden" 
              />
            </div>
          </div>
        )}

        {type && (
          <div className="animate-in fade-in duration-200 space-y-3">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones..."
              className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-theme-base outline-none text-gray-900 dark:text-white"
            />
            <button
              onClick={handleSave}
              disabled={!type || showSaveSuccess}
              className={cn(
                "w-full py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-300",
                showSaveSuccess 
                  ? "bg-green-100 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 scale-95" 
                  : "bg-theme-dark text-white disabled:opacity-50"
              )}
            >
              {showSaveSuccess ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              <span>{showSaveSuccess ? "¡Registrado!" : "Guardar Registro"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-theme-light dark:bg-theme-dark/20 rounded-xl text-theme-dark dark:text-theme-base">
          <Bath className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Baño</h2>
      </div>

      <div className="space-y-4">
        <div className="animate-in fade-in duration-200 space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Cómo le fue en el baño? ¿Usaste algún jabón nuevo?..."
            className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-theme-base outline-none resize-none h-24 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleSave}
            disabled={showSaveSuccess}
            className={cn(
              "w-full py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-300",
              showSaveSuccess 
                ? "bg-green-100 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 scale-95" 
                : "bg-theme-dark text-white disabled:opacity-50"
            )}
          >
            {showSaveSuccess ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            <span>{showSaveSuccess ? "¡Registrado!" : "Registrar Baño"}</span>
          </button>
        </div>
      </div>
    </div>
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-theme-light dark:bg-theme-dark/20 rounded-xl text-theme-dark dark:text-theme-base">
            <Moon className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Sueño</h2>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setMode('timer')}
            className={cn("p-1.5 rounded-md transition-all", mode === 'timer' ? "bg-white dark:bg-gray-600 shadow-sm text-theme-dark dark:text-theme-base" : "text-gray-500 dark:text-gray-400")}
          >
            <Timer className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMode('manual')}
            className={cn("p-1.5 rounded-md transition-all", mode === 'manual' ? "bg-white dark:bg-gray-600 shadow-sm text-theme-dark dark:text-theme-base" : "text-gray-500 dark:text-gray-400")}
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {mode === 'timer' ? (
          activeSleep ? (
            <div className="flex flex-col items-center p-6 bg-theme-light/50 dark:bg-theme-dark/10 rounded-xl border border-theme-base/20 dark:border-theme-base/10">
              <span className="text-3xl font-mono font-medium text-theme-dark dark:text-theme-base mb-4">
                {formatDuration(elapsed)}
              </span>
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl font-semibold text-lg transition-colors shadow-sm"
              >
                Despertar
              </button>
            </div>
          ) : (
            <button
              onClick={startSleep}
              className="w-full py-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 active:scale-[0.98] text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-semibold text-lg transition-all shadow-sm flex items-center justify-center space-x-2"
            >
              <Timer className="w-5 h-5" />
              <span>A Dormir</span>
            </button>
          )
        ) : (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex space-x-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Inicio</label>
                <input
                  type="datetime-local"
                  value={manualStart}
                  onChange={(e) => setManualStart(e.target.value)}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fin</label>
                <input
                  type="datetime-local"
                  value={manualEnd}
                  onChange={(e) => setManualEnd(e.target.value)}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones..."
                className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={handleSaveManual}
              disabled={!manualStart || !manualEnd || showSaveSuccess}
              className={cn(
                "w-full py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-300",
                showSaveSuccess 
                  ? "bg-green-100 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 scale-95" 
                  : "bg-indigo-600 text-white disabled:opacity-50"
              )}
            >
              {showSaveSuccess ? <Check className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{showSaveSuccess ? "¡Registrado!" : "Registrar Sueño"}</span>
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Fin del Sueño</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-theme-base outline-none resize-none text-gray-900 dark:text-white"
                  rows={2}
                  placeholder="Opcional..."
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTimer}
                  disabled={showSaveSuccess}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2",
                    showSaveSuccess
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 scale-95"
                      : "bg-indigo-500 text-white"
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
    </div>
  );
}
