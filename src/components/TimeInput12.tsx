import React, { useRef } from 'react';

interface TimeInput12Props {
  value: string; // "HH:mm" in 24h format e.g. "18:18"
  onChange: (value24: string) => void;
  className?: string;
  id?: string;
}

export function TimeInput12({ value, onChange, className = '', id }: TimeInput12Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenPicker = () => {
    try {
      if (inputRef.current && 'showPicker' in inputRef.current) {
        inputRef.current.showPicker();
      }
    } catch (err) {
      // ignore if showPicker is blocked
    }
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <input
        ref={inputRef}
        id={id}
        type="time"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          try {
            if ('showPicker' in e.currentTarget) {
              (e.currentTarget as any).showPicker();
            }
          } catch (err) {}
        }}
        onFocus={handleOpenPicker}
        className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-gray-950 dark:text-white transition-all cursor-pointer"
      />
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
        onClick={(e) => {
          try {
            if ('showPicker' in e.currentTarget) {
              (e.currentTarget as any).showPicker();
            }
          } catch (err) {}
        }}
        className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 bg-gray-50/40 dark:bg-gray-700/35 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-gray-950 dark:text-white transition-all cursor-pointer"
      />
      <TimeInput12
        value={timePart}
        onChange={handleTimeChange}
      />
    </div>
  );
}

