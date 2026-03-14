import React, { useState, useMemo } from 'react';
import { useStore, BabyEvent } from '../store';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, Edit2, Download, FileText, FileSpreadsheet, Check, X, Calendar } from 'lucide-react';
import { cn } from '../components/Layout';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

export function History() {
  const { events, deleteEvent, updateEvent } = useStore();
  const [showExport, setShowExport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const [filterType, setFilterType] = useState<'all' | 'custom'>('all');
  const [customStart, setCustomStart] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    
    const start = startOfDay(new Date(customStart));
    const end = endOfDay(new Date(customEnd));
    
    return events.filter(e => {
      const eventDate = new Date(e.timestamp);
      return isAfter(eventDate, start) && isBefore(eventDate, end);
    });
  }, [events, filterType, customStart, customEnd]);

  const formatEventTime = (timestamp: number) => {
    return format(new Date(timestamp), "HH:mm", { locale: es });
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
    setEditingId(event.id);
    setEditNotes(event.notes || '');
  };

  const handleSaveEdit = (id: string) => {
    updateEvent(id, { notes: editNotes });
    setEditingId(null);
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

                      {editingId === event.id ? (
                        <div className="mt-2 flex items-center space-x-2">
                          <input 
                            type="text" 
                            value={editNotes} 
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="flex-1 text-sm p-1 border border-gray-300 rounded focus:outline-none focus:border-theme-base"
                            placeholder="Observaciones..."
                            autoFocus
                          />
                          <button onClick={() => handleSaveEdit(event.id)} className="p-1 text-green-500 hover:bg-green-50 rounded">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        event.notes && <p className="text-xs text-gray-500 mt-1 italic">"{event.notes}"</p>
                      )}
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
    </div>
  );
}
