import React from 'react';
import { Clock } from 'lucide-react';

interface TimeInput12Props {
  value: string; // "HH:mm" in 24h format e.g. "18:18"
  onChange: (value24: string) => void;
  className?: string;
  id?: string;
}

export function TimeInput12({ value, onChange, className = '', id }: TimeInput12Props) {
  // Parse 24h string "HH:mm"
  let h24 = 12;
  let m = 0;
  if (value && value.includes(':')) {
    const parts = value.split(':');
    h24 = parseInt(parts[0], 10);
    if (isNaN(h24)) h24 = 12;
    m = parseInt(parts[1], 10);
    if (isNaN(m)) m = 0;
  }

  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;

  const updateTime = (newH12: number, newM: number, newPeriod: 'AM' | 'PM') => {
    let finalH24 = newH12;
    if (newPeriod === 'AM') {
      finalH24 = newH12 === 12 ? 0 : newH12;
    } else {
      finalH24 = newH12 === 12 ? 12 : newH12 + 12;
    }
    const hStr = String(finalH24).padStart(2, '0');
    const mStr = String(newM).padStart(2, '0');
    onChange(`${hStr}:${mStr}`);
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newH = parseInt(e.target.value, 10);
    updateTime(newH, m, period);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newM = parseInt(e.target.value, 10);
    updateTime(h12, newM, period);
  };

  const togglePeriod = () => {
    const nextPeriod = period === 'AM' ? 'PM' : 'AM';
    updateTime(h12, m, nextPeriod);
  };

  return (
    <div id={id} className={`w-full max-w-full min-w-0 flex items-center justify-between gap-1 px-2.5 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl transition-all ${className}`}>
      <div className="flex items-center gap-0.5 min-w-0">
        <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0 mr-1" />
        
        {/* Hours Select */}
        <select
          value={h12}
          onChange={handleHourChange}
          className="appearance-none bg-gray-200/50 dark:bg-gray-600/40 hover:bg-gray-200 dark:hover:bg-gray-600 rounded px-1.5 py-0.5 font-extrabold text-xs text-gray-950 dark:text-white outline-none cursor-pointer text-center focus:ring-1 focus:ring-indigo-500"
          aria-label="Hora"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
            <option key={hour} value={hour} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold">
              {String(hour).padStart(2, '0')}
            </option>
          ))}
        </select>

        <span className="font-extrabold text-xs text-gray-500 dark:text-gray-400 shrink-0 px-0.5">:</span>

        {/* Minutes Select */}
        <select
          value={m}
          onChange={handleMinuteChange}
          className="appearance-none bg-gray-200/50 dark:bg-gray-600/40 hover:bg-gray-200 dark:hover:bg-gray-600 rounded px-1.5 py-0.5 font-extrabold text-xs text-gray-950 dark:text-white outline-none cursor-pointer text-center focus:ring-1 focus:ring-indigo-500"
          aria-label="Minutos"
        >
          {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
            <option key={minute} value={minute} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold">
              {String(minute).padStart(2, '0')}
            </option>
          ))}
        </select>
      </div>

      {/* AM/PM Toggle Button */}
      <button
        type="button"
        onClick={togglePeriod}
        title="Cambiar AM/PM"
        className="shrink-0 px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/80 font-black text-[10px] tracking-wider transition-all active:scale-95 border border-indigo-200/60 dark:border-indigo-700/60"
      >
        {period}
      </button>
    </div>
  );
}

interface DateTimeInput12Props {
  value: string; // "YYYY-MM-DDTHH:mm"
  onChange: (valueIso: string) => void;
  className?: string;
  id?: string;
}

export function DateTimeInput12({ value, onChange, className = '', id }: DateTimeInput12Props) {
  let datePart = '';
  let timePart = '12:00';

  if (value && value.includes('T')) {
    const parts = value.split('T');
    datePart = parts[0];
    timePart = parts[1] || '12:00';
  } else if (value) {
    datePart = value;
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    onChange(`${newDate}T${timePart}`);
  };

  const handleTimeChange = (newTime: string) => {
    onChange(`${datePart}T${newTime}`);
  };

  return (
    <div id={id} className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${className}`}>
      <input
        type="date"
        value={datePart}
        onChange={handleDateChange}
        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-gray-950 dark:text-white transition-all font-bold"
      />
      <TimeInput12
        value={timePart}
        onChange={handleTimeChange}
      />
    </div>
  );
}
