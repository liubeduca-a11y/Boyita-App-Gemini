import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Clock, Droplets, Moon, Wind, Check, X } from 'lucide-react';
import { cn } from '../components/Layout';

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function Dashboard() {
  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      <FeedingModule />
      <HygieneModule />
      <SleepModule />
    </div>
  );
}

function FeedingModule() {
  const { activeFeeding, startFeeding, stopFeeding, addEvent } = useStore();
  const [elapsed, setElapsed] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [oz, setOz] = useState('');
  const [notes, setNotes] = useState('');

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

  const handleSave = () => {
    stopFeeding(Number(oz), notes);
    setShowModal(false);
    setOz('');
    setNotes('');
  };

  const handleBurp = () => {
    addEvent({
      type: 'burp',
      timestamp: Date.now(),
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-theme-light rounded-xl text-theme-dark">
          <Droplets className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Alimentación</h2>
      </div>

      <div className="space-y-4">
        {activeFeeding ? (
          <div className="flex flex-col items-center p-6 bg-theme-light/50 rounded-xl border border-theme-base/20">
            <span className="text-3xl font-mono font-medium text-theme-dark mb-4">
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
            className="w-full py-4 bg-theme-base hover:bg-theme-dark active:scale-[0.98] text-theme-text rounded-xl font-semibold text-lg transition-all shadow-sm"
          >
            Iniciar Toma
          </button>
        )}

        <button
          onClick={handleBurp}
          className="w-full py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl font-medium flex items-center justify-center space-x-2 active:scale-[0.98] transition-all"
        >
          <Wind className="w-5 h-5" />
          <span>Registrar Eructo</span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Finalizar Toma</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Onzas Consumidas</label>
                <input
                  type="number"
                  step="0.5"
                  value={oz}
                  onChange={(e) => setOz(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-theme-base focus:border-theme-base outline-none text-lg"
                  placeholder="Ej. 4.5"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-theme-base outline-none resize-none"
                  rows={2}
                  placeholder="Opcional..."
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
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
  const [level, setLevel] = useState<'poco' | 'mucho' | 'lleno' | null>(null);
  const [texture, setTexture] = useState<'liquido' | 'pastoso' | 'duro' | null>(null);
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!type) return;
    addEvent({
      type: 'hygiene',
      timestamp: Date.now(),
      details: {
        hygieneType: type,
        level: type === 'pee' ? level || undefined : undefined,
        texture: type === 'poo' ? texture || undefined : undefined,
      },
      notes
    });
    // Reset
    setType(null);
    setLevel(null);
    setTexture(null);
    setNotes('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-theme-light rounded-xl text-theme-dark">
          <Droplets className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Higiene</h2>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-3">
          <button
            onClick={() => { setType('pee'); setTexture(null); }}
            className={cn(
              "flex-1 py-3 rounded-xl font-medium border transition-all",
              type === 'pee' ? "bg-theme-base border-theme-dark text-theme-text" : "bg-gray-50 border-gray-200 text-gray-600"
            )}
          >
            Pipí
          </button>
          <button
            onClick={() => { setType('poo'); setLevel(null); }}
            className={cn(
              "flex-1 py-3 rounded-xl font-medium border transition-all",
              type === 'poo' ? "bg-theme-base border-theme-dark text-theme-text" : "bg-gray-50 border-gray-200 text-gray-600"
            )}
          >
            Popó
          </button>
        </div>

        {type === 'pee' && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nivel</label>
            <div className="flex space-x-2">
              {['poco', 'mucho', 'lleno'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l as any)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium border capitalize transition-all",
                    level === l ? "bg-theme-light border-theme-base text-theme-dark" : "bg-white border-gray-200 text-gray-600"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === 'poo' && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Textura</label>
            <div className="flex space-x-2">
              {['liquido', 'pastoso', 'duro'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTexture(t as any)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium border capitalize transition-all",
                    texture === t ? "bg-theme-light border-theme-base text-theme-dark" : "bg-white border-gray-200 text-gray-600"
                  )}
                >
                  {t}
                </button>
              ))}
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
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-theme-base outline-none"
            />
            <button
              onClick={handleSave}
              className="w-full py-3 bg-theme-dark text-white rounded-xl font-semibold flex items-center justify-center space-x-2"
            >
              <Check className="w-5 h-5" />
              <span>Guardar Registro</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SleepModule() {
  const { activeSleep, startSleep, stopSleep } = useStore();
  const [elapsed, setElapsed] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');

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

  const handleSave = () => {
    stopSleep(notes);
    setShowModal(false);
    setNotes('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-theme-light rounded-xl text-theme-dark">
          <Moon className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Sueño</h2>
      </div>

      <div className="space-y-4">
        {activeSleep ? (
          <div className="flex flex-col items-center p-6 bg-theme-light/50 rounded-xl border border-theme-base/20">
            <span className="text-3xl font-mono font-medium text-theme-dark mb-4">
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
            className="w-full py-4 bg-indigo-50 hover:bg-indigo-100 active:scale-[0.98] text-indigo-700 border border-indigo-200 rounded-xl font-semibold text-lg transition-all shadow-sm"
          >
            A Dormir
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Fin del Sueño</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-theme-base outline-none resize-none"
                  rows={2}
                  placeholder="Opcional..."
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-semibold"
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
