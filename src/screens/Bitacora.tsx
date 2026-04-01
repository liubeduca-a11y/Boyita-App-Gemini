import React, { useState } from 'react';
import { TimelineView } from '../components/TimelineView';
import { MedicalView } from '../components/MedicalView';
import { BookHeart, Stethoscope } from 'lucide-react';

export function Bitacora() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'medical'>('timeline');

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-100">Mi Bitácora</h1>
          </div>
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'timeline'
                  ? 'border-theme-dark text-theme-dark dark:border-theme-base dark:text-theme-base'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <BookHeart className="w-4 h-4" />
              Momentos
            </button>
            <button
              onClick={() => setActiveTab('medical')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'medical'
                  ? 'border-teal-500 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Consultas
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'timeline' ? <TimelineView /> : <MedicalView />}
      </div>
    </div>
  );
}
