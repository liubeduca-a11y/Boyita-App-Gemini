import React, { useState } from 'react';
import { MedicalRecord, PendingQuestion } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Stethoscope, Scale, Ruler, CheckCircle2, Circle, Plus, HelpCircle } from 'lucide-react';

export function MedicalView() {
  const [records, setRecords] = useState<MedicalRecord[]>([
    {
      id: '1',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      weight: 5.2,
      height: 58,
      doctorNotes: 'Todo excelente. Continuar con lactancia a demanda. Siguiente vacuna a los 4 meses.',
    }
  ]);
  
  const [questions, setQuestions] = useState<PendingQuestion[]>([
    { id: '1', text: '¿Es normal que regurgite después de cada toma?', isAnswered: false },
    { id: '2', text: '¿Cuándo empezamos con la alimentación complementaria?', isAnswered: false },
  ]);

  const [newQuestion, setNewQuestion] = useState('');
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [newRecord, setNewRecord] = useState({ weight: '', height: '', notes: '' });

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setQuestions([...questions, { id: Date.now().toString(), text: newQuestion, isAnswered: false }]);
    setNewQuestion('');
  };

  const toggleQuestion = (id: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, isAnswered: !q.isAnswered } : q));
  };

  const handleAddRecord = () => {
    if (!newRecord.weight || !newRecord.height) return;
    
    const record: MedicalRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      weight: parseFloat(newRecord.weight),
      height: parseFloat(newRecord.height),
      doctorNotes: newRecord.notes,
    };

    setRecords([record, ...records]);
    setNewRecord({ weight: '', height: '', notes: '' });
    setIsAddingRecord(false);
  };

  return (
    <div className="space-y-8">
      {/* Pending Questions Section */}
      <div className="bg-theme-base/10 dark:bg-theme-base/5 rounded-2xl p-6 border border-theme-base/20 dark:border-theme-base/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-theme-base/20 dark:bg-theme-base/10 rounded-lg text-theme-dark dark:text-theme-base">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-theme-dark dark:text-theme-base">Preguntas para la próxima cita</h2>
        </div>

        <div className="space-y-3 mb-4">
          {questions.map(q => (
            <div 
              key={q.id} 
              className={`flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border transition-colors cursor-pointer ${
                q.isAnswered ? 'border-theme-base/30 dark:border-theme-base/20 bg-theme-base/5 dark:bg-theme-base/5 opacity-75' : 'border-gray-200 dark:border-gray-700 hover:border-theme-base dark:hover:border-theme-dark'
              }`}
              onClick={() => toggleQuestion(q.id)}
            >
              <button className="mt-0.5 shrink-0 text-theme-dark dark:text-theme-base">
                {q.isAnswered ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </button>
              <span className={`text-sm ${q.isAnswered ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                {q.text}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddQuestion} className="flex gap-2">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Escribe una duda para el doctor..."
            className="flex-1 px-4 py-2 rounded-xl border border-theme-base/30 dark:border-theme-base/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-theme-dark dark:focus:ring-theme-base focus:border-transparent text-sm"
          />
          <button 
            type="submit"
            disabled={!newQuestion.trim()}
            className="px-4 py-2 bg-theme-dark dark:bg-theme-base text-white dark:text-theme-text rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Añadir
          </button>
        </form>
      </div>

      {/* Medical Records */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Registro de Consultas</h2>
          {!isAddingRecord && (
            <button 
              onClick={() => setIsAddingRecord(true)}
              className="flex items-center gap-2 text-sm font-medium text-theme-dark dark:text-theme-base hover:opacity-80 bg-theme-base/10 dark:bg-theme-base/5 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Consulta
            </button>
          )}
        </div>

        {isAddingRecord && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-4">Datos de la Consulta</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Peso (kg)</label>
                <div className="relative">
                  <Scale className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    value={newRecord.weight}
                    onChange={(e) => setNewRecord({ ...newRecord, weight: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-theme-dark dark:focus:ring-theme-base focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Ej. 6.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Talla (cm)</label>
                <div className="relative">
                  <Ruler className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.1"
                    value={newRecord.height}
                    onChange={(e) => setNewRecord({ ...newRecord, height: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-theme-dark dark:focus:ring-theme-base focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Ej. 62"
                  />
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notas del Médico</label>
              <textarea
                value={newRecord.notes}
                onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-theme-dark dark:focus:ring-theme-base focus:border-transparent resize-none h-24 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Indicaciones, vacunas, observaciones..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsAddingRecord(false)}
                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddRecord}
                className="px-4 py-2 text-sm font-medium bg-theme-dark dark:bg-theme-base text-white dark:text-theme-text rounded-lg hover:opacity-90 transition-colors shadow-sm"
              >
                Guardar Consulta
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {records.map(record => (
            <div key={record.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-full text-gray-400 dark:text-gray-500">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Consulta Pediátrica</p>
                    <time className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(record.date), "d 'de' MMMM, yyyy", { locale: es })}
                    </time>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 flex items-center gap-3">
                  <Scale className="w-5 h-5 text-theme-dark dark:text-theme-base" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Peso</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{record.weight} kg</p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 flex items-center gap-3">
                  <Ruler className="w-5 h-5 text-theme-dark dark:text-theme-base" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Talla</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{record.height} cm</p>
                  </div>
                </div>
              </div>

              {record.doctorNotes && (
                <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                  <p className="font-medium text-gray-800 dark:text-gray-100 mb-1 text-xs uppercase tracking-wider">Notas del médico</p>
                  <p className="whitespace-pre-wrap">{record.doctorNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
