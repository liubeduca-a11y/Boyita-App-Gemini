import React, { useState, useRef, useMemo } from 'react';
import { DateTimeInput12 } from './TimeInput12';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Plus, 
  BookHeart, 
  X, 
  Search, 
  Check, 
  Edit3, 
  Trash2,
  Smile,
  Moon,
  Baby,
  Award,
  Heart,
  Calendar,
  Filter,
  Flame,
  Milk,
  MessageSquare,
  BabyIcon,
  Star,
  Shuffle
} from 'lucide-react';
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

const CATEGORIES = [
  { id: 'Toma', label: 'Toma 🍼', color: 'orange', icon: Milk, bg: 'bg-orange-500/10 border-orange-200/60 dark:border-orange-500/30 text-orange-700 dark:text-orange-400' },
  { id: 'Sueño', label: 'Sueño 💤', color: 'blue', icon: Moon, bg: 'bg-blue-500/10 border-blue-200/60 dark:border-blue-500/30 text-blue-700 dark:text-blue-400' },
  { id: 'Pañal', label: 'Pañal 💩', color: 'amber', icon: Baby, bg: 'bg-amber-500/10 border-amber-200/60 dark:border-amber-500/30 text-amber-700 dark:text-amber-400' },
  { id: 'Logro', label: 'Logro 🎉', color: 'purple', icon: Award, bg: 'bg-purple-500/10 border-purple-200/60 dark:border-purple-500/30 text-purple-700 dark:text-purple-400' },
  { id: 'Momento', label: 'Especial ✨', color: 'emerald', icon: Heart, bg: 'bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' },
];

const MOODS = [
  { emoji: '😄', label: 'Alegre', bg: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/40' },
  { emoji: '😴', label: 'Dormilón', bg: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/40' },
  { emoji: '🤪', label: 'Juguetón', bg: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/40' },
  { emoji: '😢', label: 'Sensible', bg: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/40' },
  { emoji: '🧐', label: 'Curioso', bg: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/40' },
];

const TEMPLATES: Record<string, string[]> = {
  Toma: [
    "Tomó ____ oz de su biberón y quedó muy satisfecho/a hoy.",
    "Comió súper bien a su hora y tuvo su provecho con calma.",
    "Tomó pecho/biberón tranquilo/a y rápido, durando un buen rato."
  ],
  Sueño: [
    "Durmió una siesta riquísima de ____ minutos en su cunita.",
    "Le costó un poquito conciliar el sueño hoy, pero logramos una siesta corta.",
    "Se durmió tempranito y con mucha paz escuchando música suave."
  ],
  Pañal: [
    "Cambio de pañal exitoso (pipí y popó normal). ¡Piel sana y limpia!",
    "Cambio de pañal rápido por la mañana, todo en orden/limpio."
  ],
  Logro: [
    "¡Hoy descubrió cómo sostener su cabecita por completo con mucha fuerza!",
    "Sostuvo su juguete favorito por primera vez él/ella solito/a.",
    "¡Nos regaló la sonrisa social más hermosa y ruidosa del mundo!"
  ],
  Momento: [
    "Estuvimos jugando boca abajo en el tapete haciendo gestos divertidos.",
    "Salimos a dar un paseo corto en la carriola bajo la sombra para respirar aire fresco.",
    "Disfrutamos de muchos mimos y pláticas tiernas en el sillón."
  ]
};

export function TimelineView() {
  const { timelineEntries, addTimelineEntry, updateTimelineEntry, deleteTimelineEntry } = useStore();
  const [newText, setNewText] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom interactive log elements
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeTagFilter, setActiveTagFilter] = useState<string>('');
  
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute logs stats to provide immediate feedback/gamification to the user
  const stats = useMemo(() => {
    const total = timelineEntries.length;
    const meals = timelineEntries.filter(e => e.tags?.includes('Toma')).length;
    const sleeps = timelineEntries.filter(e => e.tags?.includes('Sueño')).length;
    const diapers = timelineEntries.filter(e => e.tags?.includes('Pañal')).length;
    const achievements = timelineEntries.filter(e => e.tags?.includes('Logro')).length;
    
    return { total, meals, sleeps, diapers, achievements };
  }, [timelineEntries]);

  const filteredEntries = useMemo(() => {
    let entries = timelineEntries;
    
    // Quick category filtering
    if (activeTagFilter) {
      entries = entries.filter(entry => entry.tags?.includes(activeTagFilter));
    }
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      entries = entries.filter(entry => 
        entry.text.toLowerCase().includes(lowerSearch)
      );
    }
    
    return entries;
  }, [timelineEntries, searchTerm, activeTagFilter]);

  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [featuredMemory, setFeaturedMemory] = useState<TimelineEntry | null>(null);

  const handleFeaturedMemory = () => {
    if (timelineEntries.length === 0) return;
    const filtered = timelineEntries.filter(e => e.id !== featuredMemory?.id);
    const pool = filtered.length > 0 ? filtered : timelineEntries;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setFeaturedMemory(pool[randomIndex]);
  };

  const toggleFavorite = (entry: TimelineEntry) => {
    const isFav = entry.tags?.includes('Favorito');
    const newTags = isFav 
      ? (entry.tags || []).filter(t => t !== 'Favorito')
      : [...(entry.tags || []), 'Favorito'];
    updateTimelineEntry(entry.id, { tags: newTags });
    if (featuredMemory && featuredMemory.id === entry.id) {
      setFeaturedMemory({ ...featuredMemory, tags: newTags });
    }
  };

  const handlePanicButton = () => {
    const randomPrompt = PROMPTS[currentPromptIndex];
    setNewText(prev => (prev ? prev + '\n' + randomPrompt : randomPrompt));
    setCurrentPromptIndex((prev) => (prev + 1) % PROMPTS.length);
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

  const handleApplyTemplate = (tpl: string) => {
    setNewText(tpl);
  };

  const handleAddEntry = () => {
    if (!newText.trim() && !newPhoto) return;
    
    // Build tags array dynamically based on selected mood & category
    const tagsToSave: string[] = [];
    if (selectedCategory) tagsToSave.push(selectedCategory);
    if (selectedMood) tagsToSave.push(selectedMood);

    addTimelineEntry({
      date: new Date().toISOString(),
      text: newText,
      tags: tagsToSave,
      photoUrl: newPhoto || undefined,
    });

    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      setNewText('');
      setNewPhoto(null);
      setSelectedCategory('');
      setSelectedMood('');
      setIsAdding(false);
    }, 1000);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewText('');
    setNewPhoto(null);
    setSelectedCategory('');
    setSelectedMood('');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Parent Memory Statistics - Visual proof of effort */}
      <div className="bg-gradient-to-r from-teal-500/10 via-theme-base/10 to-orange-500/10 rounded-2.5xl p-5 border border-white/20 dark:border-gray-800/40 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-black text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-theme-dark dark:text-theme-base animate-spin" />
              Diario de Recuerdos del Bebé
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              Cada momento que guardas construye un hermoso libro digital de su crecimiento.
            </p>
          </div>
          
          <div className="flex items-center space-x-1.5 bg-white/85 dark:bg-gray-800/85 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-bold shadow-sm">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse animate-duration-1000" />
            <span className="text-gray-800 dark:text-gray-100 font-extrabold">
              {stats.total === 0 ? "¡Listo para iniciar!" : `${stats.total} momentos guardados`}
            </span>
          </div>
        </div>

        {/* Dynamic Logging Badges count */}
        {stats.total > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-200/60 dark:border-gray-700/50">
            <div className="text-center bg-orange-500/5 dark:bg-orange-500/10 p-2 rounded-xl border border-orange-500/10">
              <span className="text-lg block">🍼</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">Tomas</span>
              <span className="text-xs font-black text-orange-600 dark:text-orange-400">{stats.meals}</span>
            </div>
            
            <div className="text-center bg-blue-500/5 dark:bg-blue-500/10 p-2 rounded-xl border border-blue-500/10">
              <span className="text-lg block">💤</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">Siestas</span>
              <span className="text-xs font-black text-blue-600 dark:text-blue-400">{stats.sleeps}</span>
            </div>
            
            <div className="text-center bg-amber-500/5 dark:bg-amber-500/10 p-2 rounded-xl border border-amber-500/10">
              <span className="text-lg block">💩</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">Pañales</span>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400">{stats.diapers}</span>
            </div>

            <div className="text-center bg-purple-500/5 dark:bg-purple-500/10 p-2 rounded-xl border border-purple-500/10">
              <span className="text-lg block">🎉</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">Hitos</span>
              <span className="text-xs font-black text-purple-600 dark:text-purple-400">{stats.achievements}</span>
            </div>
          </div>
        )}
      </div>

      {timelineEntries.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2.5xl p-5 border border-indigo-150/40 dark:border-indigo-900/30 shadow-sm relative overflow-hidden">
          <div className="absolute top-2 right-4 text-indigo-400 opacity-20 text-xs select-none">✨ nostalgia</div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl shrink-0">🎡</span>
              <div>
                <h4 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">Ruleta del Recuerdo de Boyita</h4>
                <p className="text-[11px] text-gray-650 dark:text-gray-400">¿Tienes un minuto para revivir momentos hermosos ya registrados?</p>
              </div>
            </div>
            <button
               onClick={handleFeaturedMemory}
               className="p-2 py-1.5 shrink-0 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Recordar Momentitos ✨</span>
            </button>
          </div>

          {featuredMemory ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-indigo-200/40 dark:border-indigo-900/30 shadow-sm animate-in zoom-in-95 duration-300 relative group/polaroid">
              <button 
                onClick={() => setFeaturedMemory(null)}
                className="absolute top-2.5 right-2.5 p-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              
              <div className="flex items-start gap-4">
                {featuredMemory.photoUrl && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-150 dark:border-gray-700 shrink-0">
                    <img src={featuredMemory.photoUrl} alt="Foto del recuerdo" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="text-[9px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                    {(() => {
                      try {
                        return format(new Date(featuredMemory.date), "d 'de' MMMM, yyyy", { locale: es });
                      } catch (e) {
                        return "Fecha guardada";
                      }
                    })()}
                  </span>
                  <p className="text-xs text-gray-750 dark:text-gray-250 italic line-clamp-3 leading-relaxed">
                    "{featuredMemory.text}"
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => toggleFavorite(featuredMemory)}
                      className="flex items-center gap-1 text-[10px] font-bold text-amber-500 hover:text-amber-600 transition-colors"
                    >
                      <Star className={cn("w-3.5 h-3.5", featuredMemory.tags?.includes('Favorito') ? "fill-amber-400" : "")} />
                      <span>{featuredMemory.tags?.includes('Favorito') ? "Favorito ⭐" : "Guardar en favoritos"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs font-bold text-gray-650 dark:text-gray-400 border border-dashed border-indigo-200 dark:border-indigo-900/40 rounded-2xl bg-white/40 dark:bg-gray-800/20">
              Presiona el botón para rodar y traer al presente un recuerdo grabado con amor 💖
            </div>
          )}
        </div>
      )}

      {/* 2. Add New Entry Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-750 rounded-2xl text-gray-500 dark:text-gray-400 hover:text-theme-dark dark:hover:text-theme-base hover:border-theme-base hover:bg-theme-base/5 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 font-bold text-sm"
          >
            <Plus className="w-5 h-5 text-theme-dark dark:text-theme-base" />
            Escribir un nuevo recuerdo o hito
          </button>
        ) : (
          <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
            
            {/* Header Form */}
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-750">
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                <BookHeart className="w-4 h-4 text-emerald-500" />
                Registrar un Momento
              </h3>
              <button 
                type="button"
                onClick={handlePanicButton}
                className="flex items-center gap-1 text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg hover:bg-amber-500/15 active:scale-95 transition-all"
                title="Botón de Pánico Creativo"
              >
                <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                ¿Sin ideas?
              </button>
            </div>

            {/* A. Category Selector (Feed, Sleeping, Diaper, Milestone, etc.) */}
            <div className="space-y-2">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block">
                ¿De qué se trata este momento? (Categoría)
              </span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => {
                  const CatIcon = cat.icon;
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(isActive ? '' : cat.id);
                        // pre-fill a helpful template if they select a category
                        if (!isActive) {
                          const list = TEMPLATES[cat.id];
                          if (list && list.length > 0) {
                            handleApplyTemplate(list[0]);
                          }
                        } else {
                          setNewText('');
                        }
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 shadow-xs",
                        isActive 
                          ? "bg-theme-dark dark:bg-theme-base border-transparent text-white dark:text-theme-text scale-[1.03]" 
                          : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-750 hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-300"
                      )}
                    >
                      <CatIcon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* B. Quick Templates Helper (Fills text template instantly) */}
            {selectedCategory && TEMPLATES[selectedCategory] && (
              <div className="space-y-2 bg-theme-base/5 dark:bg-theme-base/10 p-3 rounded-xl border border-theme-base/10">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider block">
                  💡 Ideas rápidas de Boyita (Presiona para rellenar):
                </span>
                <div className="flex flex-col gap-1.5">
                  {TEMPLATES[selectedCategory].map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className={cn(
                        "text-left text-xs p-2 rounded-lg border transition-all text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 active:scale-[0.99]",
                        newText === tpl ? "bg-white dark:bg-gray-850 border-theme-dark dark:border-theme-base font-medium" : "bg-transparent border-gray-100 dark:border-gray-750"
                      )}
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* C. Baby's Mood Selector */}
            <div className="space-y-2">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block">
                ¿Cuál es el humor del bebé en este recuerdo? (Estado de ánimo)
              </span>
              <div className="flex items-center space-x-2">
                {MOODS.map(mood => {
                  const isActive = selectedMood === mood.emoji;
                  return (
                    <button
                      key={mood.emoji}
                      type="button"
                      onClick={() => setSelectedMood(isActive ? '' : mood.emoji)}
                      className={cn(
                        "w-10 h-10 flex flex-col items-center justify-center rounded-xl border transition-all active:scale-90 hover:scale-[1.05]",
                        isActive 
                          ? "bg-theme-dark/10 border-theme-dark dark:border-theme-base scale-110" 
                          : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-750"
                      )}
                      title={mood.label}
                    >
                      <span className="text-lg">{mood.emoji}</span>
                      <span className="text-[8px] text-gray-400 dark:text-gray-500 font-bold">{mood.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* D. Main Text Area */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block">
                Detalles del recuerdo / notas libres:
              </span>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Hoy mi bebé estuvo increíble porque..."
                className="w-full h-28 p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 rounded-xl focus:ring-2 focus:ring-theme-dark dark:focus:ring-theme-base focus:border-transparent outline-none resize-none transition-all text-xs font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            
            {newPhoto && (
              <div className="relative inline-block mt-2">
                <img src={newPhoto} alt="Preview" className="h-28 rounded-xl object-contain border border-gray-200 dark:border-gray-700" />
                <button 
                  type="button"
                  onClick={() => setNewPhoto(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-650 shadow-md active:scale-90 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            
            {/* Action buttons bar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
              <label className="cursor-pointer p-2 text-gray-500 dark:text-gray-400 hover:text-theme-dark dark:hover:text-theme-base hover:bg-gray-100 dark:hover:bg-gray-750 rounded-xl transition-all flex items-center justify-center gap-2 select-none border border-dashed border-gray-200 dark:border-gray-700">
                <ImageIcon className="w-4 h-4" />
                <span className="text-[11px] font-bold">Añadir una foto</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                />
              </label>

              <div className="flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-750 dark:hover:text-gray-300 transition-all border border-transparent rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleAddEntry}
                  disabled={showSaveSuccess || (!newText.trim() && !newPhoto)}
                  className={cn(
                    "px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center space-x-2",
                    showSaveSuccess 
                      ? "bg-green-100 text-green-700 dark:bg-green-905/30 dark:text-green-400 scale-95" 
                      : "bg-theme-dark dark:bg-theme-base text-white dark:text-theme-text hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                  )}
                >
                  {showSaveSuccess ? <Check className="w-4 h-4 animate-scale" /> : null}
                  <span>{showSaveSuccess ? "¡Guardado!" : "Guardar en Bitácora"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Search and Quick Filters bar */}
      <div className="space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Escribe palabras clave para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-150 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-theme-base focus:border-theme-base text-xs transition-colors text-gray-900 dark:text-gray-100"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Quick Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1">
          <div className="flex items-center gap-1.5 shrink-0 text-[10px] uppercase font-black tracking-wider text-gray-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar:</span>
          </div>
          <button
            onClick={() => setActiveTagFilter('')}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-bold border transition-all shrink-0",
              activeTagFilter === ''
                ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-transparent shadow-xs"
                : "bg-white dark:bg-gray-800 border-gray-150 dark:border-gray-750 text-gray-600 dark:text-gray-400 hover:border-gray-300"
            )}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveTagFilter('Favorito')}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-bold border transition-all shrink-0 flex items-center gap-1",
              activeTagFilter === 'Favorito'
                ? "bg-amber-500 text-white border-transparent shadow-xs scale-103"
                : "bg-white dark:bg-gray-800 border-gray-150 dark:border-gray-750 text-gray-600 dark:text-gray-400 hover:border-gray-300"
            )}
          >
            <span>⭐</span>
            <span>Favoritos</span>
          </button>
          {CATEGORIES.map(cat => {
            const isActive = activeTagFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTagFilter(isActive ? '' : cat.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-bold border transition-all shrink-0 flex items-center gap-1",
                  isActive
                    ? "bg-theme-dark dark:bg-theme-base text-white dark:text-theme-text border-transparent shadow-xs scale-103"
                    : "bg-white dark:bg-gray-800 border-gray-150 dark:border-gray-750 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                )}
              >
                <span>{cat.id === 'Toma' ? '🍼' : cat.id === 'Sueño' ? '💤' : cat.id === 'Pañal' ? '💩' : cat.id === 'Logro' ? '🎉' : '✨'}</span>
                <span>{cat.id === 'Toma' ? 'Tomas' : cat.id === 'Sueño' ? 'Siestas' : cat.id === 'Pañal' ? 'Pañales' : cat.id === 'Logro' ? 'Hitos' : 'Especial'}</span>
              </button>
            )
          })}

          {/* If there's an active tags filter, show clear indicator tag */}
          {activeTagFilter && !CATEGORIES.some(c => c.id === activeTagFilter) && (
            <button
              onClick={() => setActiveTagFilter('')}
              className="px-3 py-1 rounded-full text-[11px] font-bold border bg-teal-500/10 border-teal-300 text-teal-800 dark:bg-teal-950/20 dark:text-teal-400 shrink-0 flex items-center gap-1"
            >
              <span>#{activeTagFilter}</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Timeline Segment */}
      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-750 shadow-xs space-y-3">
            <span className="text-4xl block animate-bounce">📔</span>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {searchTerm || activeTagFilter 
                ? 'No se encontraron recuerdos que coincidan con los filtros establecidos.' 
                : 'Tu bitácora está limpia y lista para brillar. ¡Registra su primer momento arriba!'}
            </p>
            {(searchTerm || activeTagFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveTagFilter('');
                }}
                className="text-xs font-bold text-theme-dark dark:text-theme-base underline"
              >
                Limpiar filtros de búsqueda
              </button>
            )}
          </div>
        ) : (
          filteredEntries.map((entry) => {
            // Find if this entry has category tags or mood tags
            const catTag = CATEGORIES.find(c => entry.tags?.includes(c.id));
            const moodTag = MOODS.find(m => entry.tags?.includes(m.emoji));
            const otherTags = entry.tags?.filter(t => t !== catTag?.id && t !== moodTag?.emoji) || [];

            return (
              <div key={entry.id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group select-none">
                
                {/* Timeline dot with category visualizer */}
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-4 border-gray-50 dark:border-gray-900 bg-white dark:bg-gray-850 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110",
                  catTag?.id === 'Toma' ? 'text-orange-500' :
                  catTag?.id === 'Sueño' ? 'text-blue-500' :
                  catTag?.id === 'Pañal' ? 'text-amber-500' :
                  catTag?.id === 'Logro' ? 'text-purple-500' :
                  catTag?.id === 'Momento' ? 'text-emerald-500' : 'text-gray-400'
                )}>
                  {catTag?.id === 'Toma' ? <Milk className="w-4 h-4 stroke-[2.5]" /> :
                   catTag?.id === 'Sueño' ? <Moon className="w-4 h-4 stroke-[2.5]" /> :
                   catTag?.id === 'Pañal' ? <BabyIcon className="w-4 h-4 stroke-[2.5]" /> :
                   catTag?.id === 'Logro' ? <Award className="w-4 h-4 stroke-[2.5]" /> :
                   catTag?.id === 'Momento' ? <Heart className="w-4 h-4 stroke-[2.5]" /> :
                   <BookHeart className="w-4 h-4" />}
                </div>
                
                {/* Visual Card */}
                <div className="w-[calc(100%-3.5rem)] md:w-[calc(50%-2.2rem)] p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-150/55 dark:border-gray-750/70 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all">
                  
                  {/* Card Header metadata */}
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="space-y-0.5">
                      <time className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
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
                      
                      {/* Active Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {catTag && (
                          <button
                            type="button"
                            onClick={() => setActiveTagFilter(activeTagFilter === catTag.id ? '' : catTag.id)}
                            className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all active:scale-95", catTag.bg)}
                            title="Haz clic para filtrar por esta categoría"
                          >
                            {catTag.label}
                          </button>
                        )}

                        {moodTag && (
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-gray-50 dark:bg-gray-900 border-gray-150 dark:border-gray-750 select-none text-gray-550 dark:text-gray-300">
                            <span className="text-xs -mt-0.5">{moodTag.emoji}</span>
                            <span>{moodTag.label}</span>
                          </span>
                        )}

                        {otherTags.map((tag, tIdx) => (
                          <button
                            key={tIdx}
                            type="button"
                            onClick={() => setActiveTagFilter(activeTagFilter === tag ? '' : tag)}
                            className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-teal-150 bg-teal-500/5 text-teal-700 dark:border-teal-900/40 dark:text-teal-400 transition-all active:scale-95"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Edit/Trash Actions */}
                    <div className="flex space-x-0.5 -mt-2 -mr-2">
                      <button
                        onClick={() => toggleFavorite(entry)}
                        className={cn(
                          "p-1 px-1.5 rounded-lg transition-colors",
                          entry.tags?.includes('Favorito') 
                            ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20" 
                            : "text-gray-400 hover:text-amber-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                        )}
                        title={entry.tags?.includes('Favorito') ? "Quitar de favoritos" : "Marcar como favorito"}
                      >
                        <Star className={cn("w-4 h-4", entry.tags?.includes('Favorito') ? "fill-amber-400" : "")} />
                      </button>
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="p-1 px-1.5 text-gray-400 hover:text-theme-dark dark:hover:text-theme-base hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar recuerdo"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("¿Estás seguro de que quieres eliminar este bello momento?")) {
                            deleteTimelineEntry(entry.id);
                          }
                        }}
                        className="p-1 px-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar de la bitácora"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Main Rich Content */}
                  <div className="flex flex-col gap-2">
                    <p className="text-gray-700 dark:text-gray-200 text-xs md:text-[13px] whitespace-pre-wrap leading-relaxed">
                      {entry.text}
                    </p>
                    
                    {entry.photoUrl && (
                      <div className="mt-2.5 overflow-hidden rounded-xl border border-gray-150 dark:border-gray-750 shadow-inner group-hover:shadow-md transition-all">
                        <img 
                          src={entry.photoUrl} 
                          alt="Recuerdo del bebé" 
                          className="w-full object-cover max-h-56 hover:scale-[1.02] transition-transform duration-300" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })
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
    <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-gray-750">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Editar Recuerdo</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500 mb-1">Fecha y Hora</label>
            <DateTimeInput12 
              value={date}
              onChange={setDate}
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500 mb-1">Recuerdo</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-32 p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-theme-dark dark:focus:ring-theme-base focus:border-transparent resize-none transition-all text-xs font-bold text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500 mb-1">Foto</label>
            {photoUrl ? (
              <div className="relative inline-block mt-2">
                <img src={photoUrl} alt="Preview" className="h-28 rounded-lg object-contain border border-gray-200 dark:border-gray-700" />
                <button 
                  onClick={() => setPhotoUrl(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer p-4 border-2 border-dashed border-gray-200 dark:border-gray-750 rounded-xl text-gray-500 dark:text-gray-400 hover:text-theme-dark dark:hover:text-theme-base hover:border-theme-base hover:bg-theme-base/5 transition-all flex flex-col items-center justify-center gap-2 font-bold text-xs">
                <ImageIcon className="w-6 h-6" />
                <span>Modificar foto</span>
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

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-750">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={showSaveSuccess}
              className={cn(
                "px-5 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all duration-300",
                showSaveSuccess 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 scale-95" 
                  : "bg-theme-dark dark:bg-theme-base text-white dark:text-theme-text hover:opacity-90 active:scale-95 disabled:opacity-50"
              )}
            >
              {showSaveSuccess ? <Check className="w-4 h-4" /> : null}
              <span>{showSaveSuccess ? "¡Guardado!" : "Guardar Cambios"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
