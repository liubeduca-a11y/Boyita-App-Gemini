import React, { useState, useRef, useMemo } from 'react';
import { Sparkles, Image as ImageIcon, Plus, BookHeart, X, Search, Check, Edit3, Trash2 } from 'lucide-react';
import { TimelineEntry } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useStore } from '../store';
import { cn } from './Layout';
import { compressImage } from '../utils/image';

const PROMPTS = [
  "¿A qué huele la cabecita de tu bebé hoy?",
  "¿Qué fue lo más gracioso que hizo hoy?",
  "¿Cuál fue su mayor logro de esta semana?",
  "¿Qué canción le cantaste para dormir?",
  "¿Cómo te sentiste tú hoy como mamá/papá?",
  "¿Qué nueva cara o gesto descubriste hoy?",
];

export function TimelineView() {
  const { timelineEntries, addTimelineEntry, updateTimelineEntry, deleteTimelineEntry, deleteAllTimelineEntries } = useStore();
  const [newText, setNewText] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredEntries = useMemo(() => {
    if (!searchTerm) return timelineEntries;
    const lowerSearch = searchTerm.toLowerCase();
    return timelineEntries.filter(entry => 
      entry.text.toLowerCase().includes(lowerSearch)
    );
  }, [timelineEntries, searchTerm]);

  const handlePanicButton = () => {
    const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setNewText(randomPrompt + '\n\n');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setNewPhoto(compressedBase64);
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Hubo un error al procesar la imagen. Intenta con una más pequeña.");
      }
    }
  };

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleAddEntry = () => {
    if (!newText.trim() && !newPhoto) return;
    
    addTimelineEntry({
      date: new Date().toISOString(),
      text: newText,
      tags: [],
      photoUrl: newPhoto || undefined,
    });

    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      setNewText('');
      setNewPhoto(null);
      setIsAdding(false);
    }, 1000);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewText('');
    setNewPhoto(null);
  };

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar en la bitácora..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-theme-base focus:border-theme-base sm:text-sm transition-colors text-gray-900 dark:text-gray-100"
        />
      </div>

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
                disabled={showSaveSuccess}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 shadow-sm flex items-center justify-center space-x-2",
                  showSaveSuccess 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 scale-95" 
                    : "bg-theme-dark dark:bg-theme-base text-white dark:text-theme-text hover:opacity-90 disabled:opacity-50"
                )}
              >
                {showSaveSuccess ? <Check className="w-4 h-4" /> : null}
                <span>{showSaveSuccess ? "¡Guardado!" : "Guardar Recuerdo"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-gray-800 dark:text-gray-100">Línea de Tiempo</h2>
        {timelineEntries.length > 0 && (
          <button
            onClick={() => {
              if(window.confirm('¿Estás seguro de que quieres eliminar TODOS los recuerdos? Esta acción no se puede deshacer.')) {
                deleteAllTimelineEntries();
              }
            }}
            className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            title="Eliminar todos los recuerdos"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar todos
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No se encontraron resultados para tu búsqueda.' : 'Aún no hay recuerdos registrados. ¡Escribe el primero!'}
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Timeline dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-gray-50 dark:border-gray-900 bg-theme-base/20 dark:bg-theme-base/10 text-theme-dark dark:text-theme-base shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <BookHeart className="w-4 h-4" />
            </div>
            
            {/* Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <time className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-2">
                  {(() => {
                    try {
                      const d = new Date(entry.date);
                      if (isNaN(d.getTime())) return "Fecha inválida";
                      return format(d, "d 'de' MMMM, yyyy • h:mm a", { locale: es });
                    } catch (e) {
                      return "Fecha inválida";
                    }
                  })()}
                </time>
                <div className="flex space-x-1 -mt-2 -mr-2">
                  <button
                    onClick={() => setEditingEntry(entry)}
                    className="p-2.5 text-gray-400 hover:text-theme-dark dark:hover:text-theme-base hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteTimelineEntry(entry.id)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{entry.text}</p>
                
                {entry.photoUrl && (
                  <img src={entry.photoUrl} alt="Recuerdo" className="rounded-xl mt-2 w-full object-cover max-h-64" />
                )}
              </div>
            </div>
          </div>
          ))
        )}
      </div>
      {editingEntry && (
        <EditTimelineEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={(id, data) => {
            updateTimelineEntry(id, data);
            setEditingEntry(null);
          }}
        />
      )}
    </div>
  );
}

function EditTimelineEntryModal({ entry, onClose, onSave }: { entry: TimelineEntry, onClose: () => void, onSave: (id: string, data: Partial<TimelineEntry>) => void }) {
  const [text, setText] = useState(entry.text);
  const [photoUrl, setPhotoUrl] = useState<string | null>(entry.photoUrl || null);
  const [date, setDate] = useState(format(new Date(entry.date), "yyyy-MM-dd'T'HH:mm"));
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSave = () => {
    if (!text.trim() && !photoUrl) return;

    const data: Partial<TimelineEntry> = {
      text,
      date: new Date(date).toISOString(),
      photoUrl: photoUrl || undefined,
    };

    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      onSave(entry.id, data);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Editar Recuerdo</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha y Hora</label>
            <input 
              type="datetime-local" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-theme-base outline-none text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recuerdo</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-theme-dark dark:focus:ring-theme-base focus:border-transparent resize-none transition-all text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Foto</label>
            {photoUrl ? (
              <div className="relative inline-block mt-2">
                <img src={photoUrl} alt="Preview" className="h-32 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                <button 
                  onClick={() => setPhotoUrl(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:text-theme-dark dark:hover:text-theme-base hover:border-theme-base dark:hover:border-theme-dark hover:bg-theme-base/10 transition-all flex flex-col items-center justify-center gap-2 font-medium">
                <ImageIcon className="w-6 h-6" />
                <span>Añadir foto</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                />
              </label>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={showSaveSuccess}
            className={cn(
              "w-full py-3 mt-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-300",
              showSaveSuccess 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 scale-95" 
                : "bg-theme-dark dark:bg-theme-base text-white dark:text-theme-text hover:opacity-90 disabled:opacity-50"
            )}
          >
            <Check className="w-5 h-5" />
            <span>{showSaveSuccess ? "¡Guardado!" : "Guardar Cambios"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
