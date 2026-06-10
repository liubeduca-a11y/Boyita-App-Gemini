import React, { useState, useMemo, useRef } from 'react';
import { useStore, BabyEvent } from '../store';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, Edit2, Download, FileText, FileSpreadsheet, Check, X, Calendar, Filter, Search, Camera } from 'lucide-react';
import { cn } from '../components/Layout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { compressImage } from '../utils/image';

export function History() {
  const { events, deleteEvent, updateEvent } = useStore();
  const [showExport, setShowExport] = useState(false);
  const [editingEvent, setEditingEvent] = useState<BabyEvent | null>(null);

  const [filterType, setFilterType] = useState<'all' | 'custom'>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'feeding' | 'hygiene' | 'sleep' | 'burp' | 'bath'>('all');
  const [customStart, setCustomStart] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState('');

  const getEventDescription = (event: BabyEvent) => {
    switch (event.type) {
      case 'feeding':
        return `${event.details?.amount} oz consumidas`;
      case 'burp':
        return 'Eructo registrado';
      case 'hygiene':
        if (event.details?.hygieneType === 'pee') return `Pipí (${event.details.level || 'N/A'})`;
        if (event.details?.hygieneType === 'poo') return `Popó (${event.details.texture || 'N/A'})`;
        if (event.details?.hygieneType === 'constipation') return '1 día de estreñimiento';
        return 'Cambio de pañal';
      case 'sleep':
        if (event.endTimestamp) {
          const duration = Math.round((event.endTimestamp - event.timestamp) / 60000);
          return `Durmió ${Math.floor(duration / 60)}h ${duration % 60}m`;
        }
        return 'Durmiendo...';
      case 'bath':
        return 'Baño registrado';
      default:
        return 'Evento desconocido';
    }
  };

  const filteredEvents = useMemo(() => {
    let result = events;
    
    if (filterType === 'custom') {
      const start = startOfDay(new Date(customStart));
      const end = endOfDay(new Date(customEnd));
      result = result.filter(e => {
        const eventDate = new Date(e.timestamp);
        return isAfter(eventDate, start) && isBefore(eventDate, end);
      });
    }

    if (eventTypeFilter !== 'all') {
      result = result.filter(e => e.type === eventTypeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => {
        const typeMatch = e.type.toLowerCase().includes(query);
        const notesMatch = e.notes?.toLowerCase().includes(query);
        const descMatch = getEventDescription(e).toLowerCase().includes(query);
        
        // Translate type for better search matching
        let translatedType = '';
        if (e.type === 'feeding') translatedType = 'alimentacion alimentación';
        if (e.type === 'hygiene') translatedType = 'higiene';
        if (e.type === 'sleep') translatedType = 'sueño sueno';
        if (e.type === 'burp') translatedType = 'eructo';
        if (e.type === 'bath') translatedType = 'baño bano';
        
        const translatedTypeMatch = translatedType.includes(query);

        return typeMatch || notesMatch || descMatch || translatedTypeMatch;
      });
    }

    return result;
  }, [events, filterType, customStart, customEnd, eventTypeFilter, searchQuery]);

  const formatEventTime = (timestamp: number) => {
    return format(new Date(timestamp), "hh:mm a", { locale: es });
  };

  const formatEventDate = (timestamp: number) => {
    return format(new Date(timestamp), "dd MMM yyyy", { locale: es });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'feeding': return '🍼';
      case 'burp': return '💨';
      case 'hygiene': return '🧻';
      case 'sleep': return '💤';
      case 'bath': return '🛁';
      default: return '📝';
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte Boyita App", 14, 15);
    
    const tableData = filteredEvents.map(e => [
      formatEventDate(e.timestamp),
      formatEventTime(e.timestamp),
      e.type,
      getEventDescription(e),
      e.notes || ''
    ]);

    autoTable(doc, {
      head: [['Fecha', 'Hora', 'Tipo', 'Detalle', 'Notas']],
      body: tableData,
      startY: 20,
    });

    doc.save('boyita-reporte.pdf');
    setShowExport(false);
  };

  const exportCSV = () => {
    const data = filteredEvents.map(e => ({
      Fecha: formatEventDate(e.timestamp),
      Hora: formatEventTime(e.timestamp),
      Tipo: e.type,
      Detalle: getEventDescription(e),
      Notas: e.notes || ''
    }));
    
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "boyita-reporte.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExport(false);
  };

  const handleEdit = (event: BabyEvent) => {
    setEditingEvent(event);
  };

  const handleSaveEdit = (id: string, data: Partial<BabyEvent>) => {
    updateEvent(id, data);
    setEditingEvent(null);
  };

  // Group events by date
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const date = formatEventDate(event.timestamp);
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, BabyEvent[]>);

  return (
    <div className="p-4 space-y-6 max-w-md md:max-w-4xl mx-auto pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Historial</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setFilterType(filterType === 'all' ? 'custom' : 'all')}
            className={cn(
              "p-2 rounded-full transition-colors focus:ring-0 outline-none",
              filterType === 'custom' 
                ? "bg-theme-base text-white" 
                : "bg-theme-light dark:bg-gray-800 text-theme-text dark:text-theme-base hover:bg-theme-base hover:text-white dark:hover:bg-theme-base dark:hover:text-white"
            )}
          >
            <Calendar className="w-5 h-5" strokeWidth={2.4} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowExport(!showExport)}
              className="p-2 bg-theme-light dark:bg-gray-800 text-theme-text dark:text-theme-base rounded-full hover:bg-theme-base hover:text-white dark:hover:bg-theme-base dark:hover:text-white transition-colors focus:ring-0 outline-none"
            >
              <Download className="w-5 h-5" strokeWidth={2.4} />
            </button>
            
            {showExport && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-150/50 dark:border-gray-700/80 overflow-hidden z-30 animate-in fade-in slide-in-from-top-2">
                <button onClick={exportPDF} className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-205 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 transition-colors">
                  <FileText className="w-4 h-4 mr-2 text-red-500" /> Exportar PDF
                </button>
                <button onClick={exportCSV} className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-205 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" /> Exportar Excel (CSV)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          placeholder="Buscar en registros y observaciones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700/85 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-450 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-theme-base focus:border-theme-base sm:text-sm transition-colors"
        />
      </div>

      <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl overflow-x-auto whitespace-nowrap scrollbar-hide border border-gray-200/10">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'feeding', label: 'Alimentación' },
          { id: 'hygiene', label: 'Higiene' },
          { id: 'sleep', label: 'Sueño' },
          { id: 'burp', label: 'Eructos' },
          { id: 'bath', label: 'Baños' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setEventTypeFilter(f.id as any)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-0 select-none",
              eventTypeFilter === f.id 
                ? "bg-white dark:bg-gray-700 text-theme-dark dark:text-white shadow-sm" 
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filterType === 'custom' && (
        <div className="flex space-x-3 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Desde</label>
            <input 
              type="date" 
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-theme-base outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Hasta</label>
            <input 
              type="date" 
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-theme-base outline-none"
            />
          </div>
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-450">
          <p>No hay registros aún.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([date, dayEvents]: [string, BabyEvent[]]) => (
            <div key={date} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-505 dark:text-gray-400 uppercase tracking-wider sticky top-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-xs py-2 z-10">
                {date}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dayEvents.map((event) => (
                  <div key={event.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start group transition-all hover:shadow-md h-full">
                    <div className="w-10 h-10 rounded-full bg-theme-light dark:bg-theme-dark/25 flex items-center justify-center text-xl shrink-0">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-gray-800 dark:text-gray-150 capitalize">{event.type === 'hygiene' ? 'Higiene' : event.type === 'feeding' ? 'Alimentación' : event.type === 'sleep' ? 'Sueño' : event.type === 'bath' ? 'Baño' : 'Eructo'}</p>
                        <span className="text-xs text-gray-450 dark:text-gray-500 font-medium">{formatEventTime(event.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{getEventDescription(event)}</p>
                      
                      {event.details?.photoUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 w-24 h-24">
                          <img src={event.details.photoUrl} alt="Foto del evento" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {event.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">"{event.notes}"</p>}
                    </div>
                    <div className="ml-2 flex flex-col space-y-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(event)}
                        className="p-1.5 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors focus:outline-none focus:ring-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteEvent(event.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus:ring-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingEvent && (
        <EditEventModal 
          event={editingEvent} 
          onClose={() => setEditingEvent(null)} 
          onSave={handleSaveEdit} 
        />
      )}
    </div>
  );
}

function EditEventModal({ event, onClose, onSave }: { event: BabyEvent, onClose: () => void, onSave: (id: string, data: Partial<BabyEvent>) => void }) {
  const [type, setType] = useState<BabyEvent['type']>(event.type);
  const [timestamp, setTimestamp] = useState(format(new Date(event.timestamp), "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState(event.notes || '');
  
  // Details state
  const [amount, setAmount] = useState(event.details?.amount?.toString() || '');
  const [hygieneType, setHygieneType] = useState<'pee' | 'poo' | 'constipation'>(event.details?.hygieneType || 'pee');
  const [level, setLevel] = useState<'poco' | 'medio' | 'lleno'>(event.details?.level || 'medio');
  const [texture, setTexture] = useState<'liquido' | 'viscoso' | 'pastoso' | 'duro' | 'diarrea'>(event.details?.texture || 'pastoso');
  const [endTimestamp, setEndTimestamp] = useState(event.endTimestamp ? format(new Date(event.endTimestamp), "yyyy-MM-dd'T'HH:mm") : '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(event.details?.photoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const data: Partial<BabyEvent> = {
      type,
      timestamp: new Date(timestamp).getTime(),
      notes,
    };

    if (type === 'feeding') {
      data.details = { amount: Number(amount) };
    } else if (type === 'hygiene') {
      data.details = { 
        hygieneType, 
        level: (hygieneType === 'pee' || hygieneType === 'constipation') ? level : undefined,
        texture: hygieneType === 'poo' ? texture : undefined,
        photoUrl: hygieneType === 'poo' ? photoUrl : undefined
      };
    } else if (type === 'sleep') {
      data.endTimestamp = endTimestamp ? new Date(endTimestamp).getTime() : undefined;
    }

    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      onSave(event.id, data);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700/60 pb-3">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Editar Registro</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-305 mb-1">Tipo de Evento</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as any)}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-955 dark:text-white rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-colors"
            >
              <option value="feeding">Alimentación</option>
              <option value="hygiene">Higiene</option>
              <option value="sleep">Sueño</option>
              <option value="burp">Eructo</option>
              <option value="bath">Baño</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-305 mb-1">Fecha y Hora</label>
            <input 
              type="datetime-local" 
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-955 dark:text-white rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-colors"
            />
          </div>

          {type === 'feeding' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-305 mb-1">Onzas Consumidas</label>
              <input 
                type="number" 
                step="0.5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-955 dark:text-white rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-colors"
              />
            </div>
          )}

          {type === 'hygiene' && (
            <div className="space-y-3">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setHygieneType('pee')}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-medium border transition-colors focus:ring-0", hygieneType === 'pee' ? "bg-theme-base border-theme-dark/40 text-white" : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300")}
                >Pipí</button>
                <button
                  type="button"
                  onClick={() => setHygieneType('poo')}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-medium border transition-colors focus:ring-0", hygieneType === 'poo' ? "bg-theme-base border-theme-dark/40 text-white" : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300")}
                >Popó</button>
                <button
                  type="button"
                  onClick={() => setHygieneType('constipation')}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-medium border transition-colors focus:ring-0", hygieneType === 'constipation' ? "bg-red-500 border-red-600 text-white" : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300")}
                >Estreñimiento</button>
              </div>
              
              {(hygieneType === 'pee' || hygieneType === 'constipation') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-305 mb-1">Nivel</label>
                  <select value={level} onChange={(e) => setLevel(e.target.value as any)} className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-955 dark:text-white rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-colors">
                    <option value="poco">Poco</option>
                    <option value="medio">Medio</option>
                    <option value="lleno">Lleno</option>
                  </select>
                </div>
              )}

              {hygieneType === 'poo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-305 mb-1">Textura</label>
                    <select value={texture} onChange={(e) => setTexture(e.target.value as any)} className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-955 dark:text-white rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-colors">
                      <option value="liquido">Líquido</option>
                      <option value="viscoso">Viscoso</option>
                      <option value="pastoso">Pastoso</option>
                      <option value="duro">Duro</option>
                      <option value="diarrea">Diarrea</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-305 mb-2">Foto (Opcional)</label>
                    {photoUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-32 bg-gray-50 dark:bg-gray-700">
                        <img src={photoUrl} alt="Popó" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setPhotoUrl(null)}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all flex flex-col items-center justify-center space-y-2 focus:ring-0 outline-none"
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
                      className="hidden" 
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {type === 'sleep' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-350 mb-1">Fin del Sueño</label>
              <input 
                type="datetime-local" 
                value={endTimestamp}
                onChange={(e) => setEndTimestamp(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-955 dark:text-white rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-350 mb-1">Observaciones</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-955 dark:text-white rounded-xl focus:ring-2 focus:ring-theme-base outline-none resize-none transition-colors"
              rows={2}
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={showSaveSuccess}
            className={cn(
              "w-full py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-300 focus:outline-none focus:ring-0",
              showSaveSuccess 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 scale-95" 
                : "bg-theme-dark dark:bg-theme-base text-white dark:text-theme-dark disabled:opacity-50"
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
