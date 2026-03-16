import React, { useState, useMemo } from 'react';
import { useStore, BabyEvent } from '../store';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, Edit2, Download, FileText, FileSpreadsheet, Check, X, Calendar, Filter } from 'lucide-react';
import { cn } from '../components/Layout';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

export function History() {
  const { events, deleteEvent, updateEvent } = useStore();
  const [showExport, setShowExport] = useState(false);
  const [editingEvent, setEditingEvent] = useState<BabyEvent | null>(null);

  const [filterType, setFilterType] = useState<'all' | 'custom'>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'feeding' | 'hygiene' | 'sleep' | 'burp'>('all');
  const [customStart, setCustomStart] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

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

    return result;
  }, [events, filterType, customStart, customEnd, eventTypeFilter]);

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
      default: return '📝';
    }
  };

  const getEventDescription = (event: BabyEvent) => {
    switch (event.type) {
      case 'feeding':
        return `${event.details?.amount} oz consumidas`;
      case 'burp':
        return 'Eructo registrado';
      case 'hygiene':
        if (event.details?.hygieneType === 'pee') return `Pipí (${event.details.level || 'N/A'})`;
        if (event.details?.hygieneType === 'poo') return `Popó (${event.details.texture || 'N/A'})`;
        return 'Cambio de pañal';
      case 'sleep':
        if (event.endTimestamp) {
          const duration = Math.round((event.endTimestamp - event.timestamp) / 60000);
          return `Durmió ${Math.floor(duration / 60)}h ${duration % 60}m`;
        }
        return 'Durmiendo...';
      default:
        return 'Evento desconocido';
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

    (doc as any).autoTable({
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
    <div className="p-4 space-y-6 max-w-md mx-auto pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Historial</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setFilterType(filterType === 'all' ? 'custom' : 'all')}
            className={cn(
              "p-2 rounded-full transition-colors",
              filterType === 'custom' ? "bg-theme-base text-white" : "bg-theme-light text-theme-dark hover:bg-theme-base hover:text-white"
            )}
          >
            <Calendar className="w-5 h-5" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowExport(!showExport)}
              className="p-2 bg-theme-light text-theme-dark rounded-full hover:bg-theme-base hover:text-white transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
            
            {showExport && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30 animate-in fade-in slide-in-from-top-2">
                <button onClick={exportPDF} className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b">
                  <FileText className="w-4 h-4 mr-2 text-red-500" /> Exportar PDF
                </button>
                <button onClick={exportCSV} className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" /> Exportar Excel (CSV)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl overflow-x-auto whitespace-nowrap scrollbar-hide">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'feeding', label: 'Alimentación' },
          { id: 'hygiene', label: 'Higiene' },
          { id: 'sleep', label: 'Sueño' },
          { id: 'burp', label: 'Eructos' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setEventTypeFilter(f.id as any)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
              eventTypeFilter === f.id ? "bg-white text-theme-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filterType === 'custom' && (
        <div className="flex space-x-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input 
              type="date" 
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-theme-base outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input 
              type="date" 
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-theme-base outline-none"
            />
          </div>
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No hay registros aún.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([date, dayEvents]: [string, BabyEvent[]]) => (
            <div key={date} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 py-2 z-10">
                {date}
              </h3>
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <div key={event.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start group transition-all hover:shadow-md">
                    <div className="w-10 h-10 rounded-full bg-theme-light flex items-center justify-center text-xl shrink-0">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-gray-800 capitalize">{event.type === 'hygiene' ? 'Higiene' : event.type === 'feeding' ? 'Alimentación' : event.type === 'sleep' ? 'Sueño' : 'Eructo'}</p>
                        <span className="text-xs text-gray-400 font-medium">{formatEventTime(event.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{getEventDescription(event)}</p>
                      
                      {event.details?.photoUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 w-24 h-24">
                          <img src={event.details.photoUrl} alt="Foto del evento" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {event.notes && <p className="text-xs text-gray-500 mt-1 italic">"{event.notes}"</p>}
                    </div>
                    <div className="ml-2 flex flex-col space-y-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(event)}
                        className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteEvent(event.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
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
  const [hygieneType, setHygieneType] = useState<'pee' | 'poo'>(event.details?.hygieneType || 'pee');
  const [level, setLevel] = useState<'poco' | 'medio' | 'lleno'>(event.details?.level || 'medio');
  const [texture, setTexture] = useState<'liquido' | 'pastoso' | 'duro'>(event.details?.texture || 'pastoso');
  const [endTimestamp, setEndTimestamp] = useState(event.endTimestamp ? format(new Date(event.endTimestamp), "yyyy-MM-dd'T'HH:mm") : '');

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
        level: hygieneType === 'pee' ? level : undefined,
        texture: hygieneType === 'poo' ? texture : undefined,
        photoUrl: event.details?.photoUrl // keep existing photo
      };
    } else if (type === 'sleep') {
      data.endTimestamp = endTimestamp ? new Date(endTimestamp).getTime() : undefined;
    }

    onSave(event.id, data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Editar Registro</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as any)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-base outline-none"
            >
              <option value="feeding">Alimentación</option>
              <option value="hygiene">Higiene</option>
              <option value="sleep">Sueño</option>
              <option value="burp">Eructo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
            <input 
              type="datetime-local" 
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-base outline-none"
            />
          </div>

          {type === 'feeding' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Onzas Consumidas</label>
              <input 
                type="number" 
                step="0.5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-base outline-none"
              />
            </div>
          )}

          {type === 'hygiene' && (
            <div className="space-y-3">
              <div className="flex space-x-2">
                <button
                  onClick={() => setHygieneType('pee')}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-medium border", hygieneType === 'pee' ? "bg-theme-base border-theme-dark text-white" : "bg-gray-50 border-gray-200 text-gray-600")}
                >Pipí</button>
                <button
                  onClick={() => setHygieneType('poo')}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-medium border", hygieneType === 'poo' ? "bg-theme-base border-theme-dark text-white" : "bg-gray-50 border-gray-200 text-gray-600")}
                >Popó</button>
              </div>
              
              {hygieneType === 'pee' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
                  <select value={level} onChange={(e) => setLevel(e.target.value as any)} className="w-full p-3 border border-gray-200 rounded-xl outline-none">
                    <option value="poco">Poco</option>
                    <option value="medio">Medio</option>
                    <option value="lleno">Lleno</option>
                  </select>
                </div>
              )}

              {hygieneType === 'poo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Textura</label>
                  <select value={texture} onChange={(e) => setTexture(e.target.value as any)} className="w-full p-3 border border-gray-200 rounded-xl outline-none">
                    <option value="liquido">Líquido</option>
                    <option value="pastoso">Pastoso</option>
                    <option value="duro">Duro</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {type === 'sleep' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin del Sueño</label>
              <input 
                type="datetime-local" 
                value={endTimestamp}
                onChange={(e) => setEndTimestamp(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-base outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-base outline-none resize-none"
              rows={2}
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 bg-theme-dark text-white rounded-xl font-semibold flex items-center justify-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>
    </div>
  );
}
