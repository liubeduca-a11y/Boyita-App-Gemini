import React, { useState, useRef } from 'react';
import { Sparkles, Image as ImageIcon, Plus, BookHeart, X } from 'lucide-react';
import { TimelineEntry } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PROMPTS = [
  "¿A qué huele la cabecita de tu bebé hoy?",
  "¿Qué fue lo más gracioso que hizo hoy?",
  "¿Cuál fue su mayor logro de esta semana?",
  "¿Qué canción le cantaste para dormir?",
  "¿Cómo te sentiste tú hoy como mamá/papá?",
  "¿Qué nueva cara o gesto descubriste hoy?",
];

export function TimelineView() {
  const [entries, setEntries] = useState<TimelineEntry[]>([
    {
      id: '1',
      date: new Date().toISOString(),
      text: 'Hoy descubrió sus manitas. Se quedó mirándolas por casi 10 minutos seguidos, cruzando los deditos.',
      tags: ['Desarrollo', 'Primera vez'],
    }
  ]);
  const [newText, setNewText] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePanicButton = () => {
    const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setNewText(randomPrompt + '\n\n');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEntry = () => {
    if (!newText.trim() && !newPhoto) return;
    
    const entry: TimelineEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      text: newText,
      tags: [],
      photoUrl: newPhoto || undefined,
    };

    setEntries([entry, ...entries]);
    setNewText('');
    setNewPhoto(null);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewText('');
    setNewPhoto(null);
  };

  return (
    <div className="space-y-8">
      {/* Add New Entry Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:text-theme-dark dark:hover:text-theme-base hover:border-theme-base dark:hover:border-theme-dark hover:bg-theme-base/10 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Escribir un nuevo recuerdo
          </button>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-800 dark:text-gray-100">Nuevo Recuerdo</h3>
              <button 
                onClick={handlePanicButton}
                className="flex items-center gap-2 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                title="Botón de Pánico Creativo"
              >
                <Sparkles className="w-3.5 h-3.5" />
                ¿Sin ideas?
              </button>
            </div>
            
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Escribe lo que pasó hoy..."
              className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-theme-dark dark:focus:ring-theme-base focus:border-transparent resize-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            
            {newPhoto && (
              <div className="relative inline-block mt-2">
                <img src={newPhoto} alt="Preview" className="h-32 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                <button 
                  onClick={() => setNewPhoto(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex gap-4 items-center">
              <label className="cursor-pointer p-2 text-gray-500 dark:text-gray-400 hover:text-theme-dark dark:hover:text-theme-base hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Añadir foto</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddEntry}
                className="px-4 py-2 text-sm font-medium bg-theme-dark dark:bg-theme-base text-white dark:text-theme-text rounded-lg hover:opacity-90 transition-colors shadow-sm"
              >
                Guardar Recuerdo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
        {entries.map((entry) => (
          <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Timeline dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-gray-50 dark:border-gray-900 bg-theme-base/20 dark:bg-theme-base/10 text-theme-dark dark:text-theme-base shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <BookHeart className="w-4 h-4" />
            </div>
            
            {/* Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-2">
                <time className="text-xs font-medium text-gray-400 dark:text-gray-500">
                  {format(new Date(entry.date), "d 'de' MMMM, yyyy • h:mm a", { locale: es })}
                </time>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{entry.text}</p>
                
                {entry.photoUrl && (
                  <img src={entry.photoUrl} alt="Recuerdo" className="rounded-xl mt-2 w-full object-cover max-h-64" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
