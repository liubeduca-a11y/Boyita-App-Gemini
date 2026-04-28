import React, { useState, useMemo, useRef } from 'react';
import { MedicalRecord, PendingQuestion } from '../types';
import { format, differenceInMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Stethoscope, Scale, Ruler, CheckCircle2, Circle, Plus, HelpCircle, Search, Check, Camera, X, Edit3, Trash2, Info } from 'lucide-react';
import { useStore } from '../store';
import { cn } from './Layout';
import { compressImage } from '../utils/image';
import { getWeightStatus, getHeightStatus, GrowthStatus } from '../utils/growthCharts';

export function MedicalView() {
  const { 
    profile,
    medicalRecords, 
    pendingQuestions, 
    addMedicalRecord, 
    updateMedicalRecord,
    deleteMedicalRecord,
    addPendingQuestion, 
    togglePendingQuestion 
  } = useStore();

  const [newQuestion, setNewQuestion] = useState('');
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState({ weight: '', height: '', notes: '', prescriptionUrl: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredQuestions = useMemo(() => {
    // First, filter out questions answered > 24 hours ago
    const activeQuestions = pendingQuestions.filter(q => {
      if (q.isAnswered && q.answeredAt) {
        const answeredDate = new Date(q.answeredAt).getTime();
        const now = Date.now();
        // 24 hours in ms: 24 * 60 * 60 * 1000 = 86400000
        if (now - answeredDate > 86400000) return false;
      }
      return true;
    });

    if (!searchTerm) return activeQuestions;
    const lowerSearch = searchTerm.toLowerCase();
    return activeQuestions.filter(q => q.text.toLowerCase().includes(lowerSearch));
  }, [pendingQuestions, searchTerm]);

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return medicalRecords;
    const lowerSearch = searchTerm.toLowerCase();
    return medicalRecords.filter(r => 
      r.doctorNotes.toLowerCase().includes(lowerSearch)
    );
  }, [medicalRecords, searchTerm]);

  const [showQuestionSuccess, setShowQuestionSuccess] = useState(false);

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    addPendingQuestion({ text: newQuestion, isAnswered: false });
    
    setShowQuestionSuccess(true);
    setTimeout(() => {
      setShowQuestionSuccess(false);
      setNewQuestion('');
    }, 1000);
  };

  const toggleQuestion = (id: string) => {
    togglePendingQuestion(id);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setNewRecord({ ...newRecord, prescriptionUrl: compressedBase64 });
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Ocurrió un error al procesar la imagen.");
      }
    }
  };

  const handleEditRecord = (record: MedicalRecord) => {
    setNewRecord({
      weight: String(record.weight || ''),
      height: String(record.height || ''),
      notes: record.doctorNotes,
      prescriptionUrl: record.prescriptionUrl || '',
    });
    setEditingRecordId(record.id);
    setIsAddingRecord(true);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este registro médico?")) {
      deleteMedicalRecord(id);
    }
  };

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleAddRecord = () => {
    if (!newRecord.weight || !newRecord.height) return;
    
    if (editingRecordId) {
      updateMedicalRecord(editingRecordId, {
        weight: parseFloat(newRecord.weight),
        height: parseFloat(newRecord.height),
        doctorNotes: newRecord.notes,
        ...(newRecord.prescriptionUrl ? { prescriptionUrl: newRecord.prescriptionUrl } : {})
      });
    } else {
      addMedicalRecord({
        date: new Date().toISOString(),
        weight: parseFloat(newRecord.weight),
        height: parseFloat(newRecord.height),
        doctorNotes: newRecord.notes,
        ...(newRecord.prescriptionUrl ? { prescriptionUrl: newRecord.prescriptionUrl } : {})
      });
    }

    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      setNewRecord({ weight: '', height: '', notes: '', prescriptionUrl: '' });
      setIsAddingRecord(false);
      setEditingRecordId(null);
    }, 1000);
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
          placeholder="Buscar en consultas o preguntas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-theme-base focus:border-theme-base sm:text-sm transition-colors text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Pending Questions Section */}
      <div className="bg-theme-base/10 dark:bg-theme-base/5 rounded-2xl p-6 border border-theme-base/20 dark:border-theme-base/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-theme-base/20 dark:bg-theme-base/10 rounded-lg text-theme-dark dark:text-theme-base">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-theme-dark dark:text-theme-base">Preguntas para la próxima cita</h2>
        </div>

        <div className="space-y-3 mb-4">
          {filteredQuestions.length === 0 && searchTerm ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No se encontraron preguntas.</p>
          ) : (
            filteredQuestions.map(q => (
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
            ))
          )}
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
            disabled={!newQuestion.trim() || showQuestionSuccess}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2",
              showQuestionSuccess 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 scale-95" 
                : "bg-theme-dark dark:bg-theme-base text-white dark:text-theme-text hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {showQuestionSuccess ? <Check className="w-4 h-4" /> : null}
            <span>{showQuestionSuccess ? "¡Añadido!" : "Añadir"}</span>
          </button>
        </form>
      </div>

      {/* Medical Records */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Registro de Consultas</h2>
            <div className="group relative">
               <Info className="w-4 h-4 text-gray-400 cursor-help" />
               <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                 Las evaluaciones de peso y talla se basan en los estándares de crecimiento de la OMS (Organización Mundial de la Salud).
               </div>
            </div>
          </div>
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
            
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Receta o Documento Médico</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center bg-gray-50 dark:bg-gray-900/50">
                {newRecord.prescriptionUrl ? (
                  <div className="relative rounded-lg overflow-hidden h-32 w-full max-w-sm mx-auto">
                    <img src={newRecord.prescriptionUrl} alt="Receta" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setNewRecord({ ...newRecord, prescriptionUrl: '' })}
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center w-full h-24 text-gray-500 dark:text-gray-400 hover:text-theme-base transition-colors"
                    >
                      <Camera className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-sm font-medium">Escanear o tomar foto</span>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePhotoUpload} 
                      accept="image/*" 
                      capture="environment"
                      className="hidden" 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsAddingRecord(false);
                  setEditingRecordId(null);
                  setNewRecord({ weight: '', height: '', notes: '', prescriptionUrl: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddRecord}
                disabled={showSaveSuccess}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 shadow-sm flex items-center justify-center space-x-2",
                  showSaveSuccess 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 scale-95" 
                    : "bg-theme-dark dark:bg-theme-base text-white dark:text-theme-text hover:opacity-90 disabled:opacity-50"
                )}
              >
                {showSaveSuccess ? <Check className="w-4 h-4" /> : null}
                <span>{showSaveSuccess ? "¡Guardado!" : "Guardar Consulta"}</span>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No se encontraron consultas.' : 'Aún no hay consultas registradas.'}
            </div>
          ) : (
            filteredRecords.map(record => {
               let weightStatus: GrowthStatus = { status: 'gray', label: 'Sin datos', description: '' };
               let heightStatus: GrowthStatus = { status: 'gray', label: 'Sin datos', description: '' };
               
               try {
                 if (profile.gender && profile.birthDate && record.date) {
                   const bDate = new Date(profile.birthDate);
                   const rDate = new Date(record.date);
                   if (!isNaN(bDate.getTime()) && !isNaN(rDate.getTime())) {
                     const ageMonths = differenceInMonths(rDate, bDate);
                     if (!isNaN(ageMonths) && ageMonths >= 0) {
                        const weightNum = parseFloat(String(record.weight || '0'));
                        const heightNum = parseFloat(String(record.height || '0'));
                        
                        if (!isNaN(weightNum) && weightNum > 0) {
                          weightStatus = getWeightStatus(profile.gender as any, ageMonths, weightNum);
                        }
                        if (!isNaN(heightNum) && heightNum > 0) {
                          heightStatus = getHeightStatus(profile.gender as any, ageMonths, heightNum);
                        }
                     }
                   }
                 }
               } catch (err) {
                 console.error('Error calculating growth chart colors:', err);
               }
               
               const colorClasses = {
                 red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
                 yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
                 green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
                 gray: 'bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-transparent'
               };

               return (
                <div key={record.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-full text-gray-400 dark:text-gray-500">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Consulta Pediátrica</p>
                        <time className="text-xs text-gray-500 dark:text-gray-400">
                          {(() => {
                            if (!record.date) return 'Fecha desconocida';
                            try {
                              const d = new Date(record.date);
                              if (isNaN(d.getTime())) return 'Fecha inválida';
                              return format(d, "d 'de' MMMM, yyyy", { locale: es });
                            } catch (e) {
                              return 'Fecha inválida';
                            }
                          })()}
                        </time>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleEditRecord(record)}
                        className="p-2 text-gray-400 hover:text-theme-dark dark:hover:text-theme-base transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteRecord(record.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className={cn("rounded-xl p-3 flex flex-col gap-1 border", colorClasses[weightStatus.status] || colorClasses.gray)}>
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 opacity-70" />
                        <p className="text-[10px] opacity-70 uppercase tracking-wider font-bold">Peso</p>
                      </div>
                      <p className="font-bold text-lg">{record.weight || '--'} kg</p>
                      <p className="text-[10px] font-medium leading-tight">{weightStatus.label}</p>
                    </div>
                    <div className={cn("rounded-xl p-3 flex flex-col gap-1 border", colorClasses[heightStatus.status] || colorClasses.gray)}>
                      <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 opacity-70" />
                        <p className="text-[10px] opacity-70 uppercase tracking-wider font-bold">Talla</p>
                      </div>
                      <p className="font-bold text-lg">{record.height || '--'} cm</p>
                      <p className="text-[10px] font-medium leading-tight">{heightStatus.label}</p>
                    </div>
                  </div>

                  {/* Document/Prescription Section */}
                  {record.prescriptionUrl && (
                    <div className="mb-4">
                      <p className="font-medium text-gray-800 dark:text-gray-100 mb-2 text-xs uppercase tracking-wider">Receta Médica / Documento</p>
                      <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 cursor-zoom-in" onClick={() => window.open(record.prescriptionUrl, '_blank')}>
                        <img src={record.prescriptionUrl} alt="Receta Médica" className="w-full h-auto max-h-64 object-cover object-top hover:opacity-90 transition-opacity" />
                      </div>
                    </div>
                  )}

                  {record.doctorNotes && (
                    <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                      <p className="font-medium text-gray-800 dark:text-gray-100 mb-1 text-xs uppercase tracking-wider">Notas del médico</p>
                      <p className="whitespace-pre-wrap">{record.doctorNotes}</p>
                    </div>
                  )}
                </div>
              );
          })
        )}
        </div>
      </div>
    </div>
  );
}
