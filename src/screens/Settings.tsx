import React, { useState, useRef, useEffect } from 'react';
import { useStore, ThemeColor, ColorMode, MedicalHistory, MedicalCondition, ScreeningHistory, ScreeningTest } from '../store';
import { Camera, Save, Palette, User, Calendar, Cloud, LogOut, LogIn, RefreshCw, Moon, Sun, Monitor, AlertCircle, Accessibility, Dna, Scissors, Wind, PlusCircle, ChevronDown, ChevronUp, Droplet, Ear, Eye, HeartPulse, Bone, Check } from 'lucide-react';
import { cn } from '../components/Layout';
import { differenceInMonths, differenceInDays } from 'date-fns';
import { auth, loginWithGoogle, logout, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, getDocs, writeBatch, doc } from 'firebase/firestore';
import { compressImage } from '../utils/image';

const THEMES: { id: ThemeColor; name: string; color: string }[] = [
  { id: 'blue', name: 'Azul Pastel', color: '#AEC6CF' },
  { id: 'pink', name: 'Rosa Pastel', color: '#FFB7B2' },
  { id: 'mint', name: 'Verde Menta', color: '#B2E2F2' },
  { id: 'yellow', name: 'Amarillo Crema', color: '#FFFFCC' },
  { id: 'lavender', name: 'Lavanda', color: '#E6E6FA' },
  { id: 'peach', name: 'Durazno', color: '#FFDAB9' },
  { id: 'sage', name: 'Salvia', color: '#B2AC88' },
  { id: 'sky', name: 'Cielo', color: '#87CEEB' },
  { id: 'lilac', name: 'Lila', color: '#C8A2C8' },
  { id: 'coral', name: 'Coral', color: '#F08080' },
];

export function Settings() {
  const { profile, updateProfile, theme, setTheme, colorMode, setColorMode, familyId } = useStore();
  const [name, setName] = useState(profile.name);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [gender, setGender] = useState<'boy' | 'girl' | undefined>(profile.gender);
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl);
  
  const [birthType, setBirthType] = useState(profile.birthType || '');
  const [birthLength, setBirthLength] = useState(profile.birthLength?.toString() || '');
  const [birthLengthUnit, setBirthLengthUnit] = useState<'cm' | 'in'>(profile.birthLengthUnit || 'cm');
  const [birthWeight, setBirthWeight] = useState(profile.birthWeight?.toString() || '');
  const [birthWeightUnit, setBirthWeightUnit] = useState<'kg' | 'lb'>(profile.birthWeightUnit || 'kg');
  const [pregnancyComplications, setPregnancyComplications] = useState(profile.pregnancyComplications || '');
  const [birthComplications, setBirthComplications] = useState(profile.birthComplications || '');
  
  const [medicalHistory, setMedicalHistory] = useState(profile.medicalHistory || {
    alergias: { name: '', diagnosisAge: '', diagnosisAgeUnit: 'meses', treatment: '' },
    discapacidad: { name: '', diagnosisAge: '', diagnosisAgeUnit: 'meses', treatment: '' },
    malformaciones: { name: '', diagnosisAge: '', diagnosisAgeUnit: 'meses', treatment: '' },
    cirugias: { name: '', diagnosisAge: '', diagnosisAgeUnit: 'meses', treatment: '' },
    tuberculosis: { name: '', diagnosisAge: '', diagnosisAgeUnit: 'meses', treatment: '' },
    otras: { name: '', diagnosisAge: '', diagnosisAgeUnit: 'meses', treatment: '' },
  });

  const [expandedCondition, setExpandedCondition] = useState<string | null>(null);

  const [screeningHistory, setScreeningHistory] = useState(profile.screeningHistory || {
    metabolico: { dueDate: '', applied: false, comments: '' },
    auditivo: { dueDate: '', applied: false, comments: '' },
    oftalmologico: { dueDate: '', applied: false, comments: '' },
    cardiaco: { dueDate: '', applied: false, comments: '' },
    cadera: { dueDate: '', applied: false, comments: '' },
  });
  const [expandedScreening, setExpandedScreening] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const calculateAge = () => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const now = new Date();
    const months = differenceInMonths(now, birth);
    const days = differenceInDays(now, birth) % 30;
    
    if (months === 0) return `${days} días`;
    if (days === 0) return `${months} meses`;
    return `${months} meses, ${days} días`;
  };

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleSaveProfile = () => {
    updateProfile({ 
      name, 
      birthDate, 
      gender,
      photoUrl,
      birthType: birthType as any,
      birthLength: birthLength ? Number(birthLength) : undefined,
      birthLengthUnit: birthLengthUnit as any,
      birthWeight: birthWeight ? Number(birthWeight) : undefined,
      birthWeightUnit: birthWeightUnit as any,
      pregnancyComplications: pregnancyComplications as any,
      birthComplications: birthComplications as any,
      medicalHistory: medicalHistory as MedicalHistory,
      screeningHistory
    });
    
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
    }, 1500);
  };

  const handleMedicalHistoryChange = (key: keyof MedicalHistory, field: keyof MedicalCondition, value: any) => {
    setMedicalHistory(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleScreeningChange = (key: keyof ScreeningHistory, field: keyof ScreeningTest, value: any) => {
    setScreeningHistory(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

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

  const handleForceSync = async () => {
    if (!user || !familyId) return;
    setIsSyncing(true);
    try {
      const localEvents = useStore.getState().events;
      const q = query(collection(db, `families/${familyId}/events`));
      const snap = await getDocs(q);
      const firestoreIds = new Set(snap.docs.map(d => d.id));
      
      const missing = localEvents.filter(e => !firestoreIds.has(e.id));
      
      if (missing.length > 0) {
        const batch = writeBatch(db);
        missing.forEach(event => {
          const eventRef = doc(db, `families/${familyId}/events/${event.id}`);
          const cleanEvent = JSON.parse(JSON.stringify({ ...event, authorId: user.uid }));
          batch.set(eventRef, cleanEvent);
        });
        await batch.commit();
        alert(`¡Éxito! Se sincronizaron ${missing.length} registros pendientes a la nube.`);
      } else {
        alert('Todo está al día. No hay registros pendientes por subir en este teléfono.');
      }
    } catch (error: any) {
      alert('Error al sincronizar: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-md md:max-w-4xl mx-auto pb-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Ajustes</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna Izquierda: Perfil del Bebé */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-theme-light dark:bg-theme-dark/20 rounded-xl text-theme-dark dark:text-theme-base">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Perfil del Bebé</h3>
            </div>

            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 border-4 border-theme-light dark:border-theme-dark/30 overflow-hidden shadow-inner">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Bebé" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">👶</div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-theme-base dark:bg-theme-dark text-white rounded-full shadow-md hover:bg-theme-dark dark:hover:bg-theme-base transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              {birthDate && (
                <p className="mt-3 text-sm font-medium text-theme-dark dark:text-theme-base bg-theme-light dark:bg-theme-dark/20 px-3 py-1 rounded-full">
                  Edad: {calculateAge()}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-300"
                  placeholder="Nombre del bebé"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sexo (Biológico)</label>
                <select
                  value={gender || ''}
                  onChange={(e) => setGender(e.target.value as 'boy' | 'girl' | undefined)}
                  className="w-full p-3 border border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-gray-900 dark:text-gray-50"
                >
                  <option value="">Seleccionar...</option>
                  <option value="girl">Niña</option>
                  <option value="boy">Niño</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Usado para las curvas de crecimiento de peso y talla de la OMS.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Nacimiento</label>
                <div className="relative">
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-gray-900 dark:text-gray-50"
                  />
                  <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de parto</label>
                <select
                  value={birthType}
                  onChange={(e) => setBirthType(e.target.value)}
                  className="w-full p-3 border border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-gray-900 dark:text-gray-50"
                >
                  <option value="">Seleccionar...</option>
                  <option value="natural">Natural</option>
                  <option value="cesarea">Cesárea</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Talla al nacer</label>
                  <div className="flex">
                    <input
                      type="number"
                      value={birthLength}
                      onChange={(e) => setBirthLength(e.target.value)}
                      className="w-full p-3 border border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-800 rounded-l-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-gray-900 dark:text-gray-50"
                      placeholder="0"
                    />
                    <select
                      value={birthLengthUnit}
                      onChange={(e) => setBirthLengthUnit(e.target.value as 'cm' | 'in')}
                      className="p-3 border-y border-r border-gray-200 dark:border-gray-500 bg-gray-50 dark:bg-gray-700 rounded-r-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-gray-900 dark:text-gray-50"
                    >
                      <option value="cm">cm</option>
                      <option value="in">in</option>
                    </select>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peso al nacer</label>
                  <div className="flex">
                    <input
                      type="number"
                      value={birthWeight}
                      onChange={(e) => setBirthWeight(e.target.value)}
                      className="w-full p-3 border border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-800 rounded-l-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-gray-900 dark:text-gray-50"
                      placeholder="0"
                    />
                    <select
                      value={birthWeightUnit}
                      onChange={(e) => setBirthWeightUnit(e.target.value as 'kg' | 'lb')}
                      className="p-3 border-y border-r border-gray-200 dark:border-gray-500 bg-gray-50 dark:bg-gray-700 rounded-r-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-gray-900 dark:text-gray-50"
                    >
                      <option value="kg">kg</option>
                      <option value="lb">lb</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Complicaciones (Embarazo)</label>
                  <select
                    value={pregnancyComplications}
                    onChange={(e) => setPregnancyComplications(e.target.value)}
                    className="w-full p-3 border border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-gray-900 dark:text-gray-50"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Complicaciones (Nacer)</label>
                  <select
                    value={birthComplications}
                    onChange={(e) => setBirthComplications(e.target.value)}
                    className="w-full p-3 border border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-gray-900 dark:text-gray-50"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Historial Médico</h4>
                <div className="space-y-3">
                  {[
                    { key: 'alergias', label: 'Alergias', icon: AlertCircle },
                    { key: 'discapacidad', label: 'Discapacidad', icon: Accessibility },
                    { key: 'malformaciones', label: 'Malformaciones congénitas', icon: Dna },
                    { key: 'cirugias', label: 'Cirugías', icon: Scissors },
                    { key: 'tuberculosis', label: 'Tuberculosis', icon: Wind },
                    { key: 'otras', label: 'Otras enfermedades', icon: PlusCircle }
                  ].map((cat) => {
                    const isExpanded = expandedCondition === cat.key;
                    const conditionData = medicalHistory[cat.key as keyof MedicalHistory];
                    const hasData = Boolean(conditionData.name || conditionData.diagnosisAge || conditionData.treatment);
                    const Icon = cat.icon;

                    return (
                      <div key={cat.key} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                        <button
                          onClick={() => setExpandedCondition(isExpanded ? null : cat.key)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={cn("p-2 rounded-lg", hasData ? "bg-theme-base/20 text-theme-dark dark:text-theme-base" : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400")}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-800 dark:text-gray-200">{cat.label}</span>
                            {hasData && <span className="w-2 h-2 rounded-full bg-theme-base"></span>}
                          </div>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </button>

                        {isExpanded && (
                          <div className="p-4 space-y-4 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">¿Cuál?</label>
                              <input
                                type="text"
                                value={conditionData.name}
                                onChange={(e) => handleMedicalHistoryChange(cat.key as keyof MedicalHistory, 'name', e.target.value)}
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-sm text-gray-900 dark:text-white"
                                placeholder="Especificar condición"
                              />
                            </div>
                            <div className="flex space-x-3">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Edad de diagnóstico</label>
                                <div className="flex">
                                  <input
                                    type="number"
                                    value={conditionData.diagnosisAge}
                                    onChange={(e) => handleMedicalHistoryChange(cat.key as keyof MedicalHistory, 'diagnosisAge', e.target.value)}
                                    className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-l-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-sm text-gray-900 dark:text-white"
                                    placeholder="0"
                                    min="0"
                                  />
                                  <select
                                    value={conditionData.diagnosisAgeUnit || 'meses'}
                                    onChange={(e) => handleMedicalHistoryChange(cat.key as keyof MedicalHistory, 'diagnosisAgeUnit', e.target.value)}
                                    className="p-3 border-y border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-r-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-sm text-gray-900 dark:text-white"
                                  >
                                    <option value="meses">meses</option>
                                    <option value="años">años</option>
                                  </select>
                                </div>
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tratamiento</label>
                                <input
                                  type="text"
                                  value={conditionData.treatment}
                                  onChange={(e) => handleMedicalHistoryChange(cat.key as keyof MedicalHistory, 'treatment', e.target.value)}
                                  className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-sm text-gray-900 dark:text-white"
                                  placeholder="Ej. Terapia"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Tamizaje</h4>
                <div className="space-y-3">
                  {[
                    { key: 'metabolico', label: 'Tamiz metabólico neonatal', icon: Droplet, recommendation: 'Entre el tercer y quinto día de vida' },
                    { key: 'auditivo', label: 'Tamiz auditivo', icon: Ear, recommendation: 'Primeros 3 meses de vida' },
                    { key: 'oftalmologico', label: 'Tamiz oftalmológica', icon: Eye, recommendation: 'Primer mes de vida' },
                    { key: 'cardiaco', label: 'Tamiz cardíaco', icon: HeartPulse, recommendation: 'Después de las primeras 24 horas y antes de los 3 días de vida' },
                    { key: 'cadera', label: 'Tamiz de cadera', icon: Bone, recommendation: 'Entre primer y cuarto mes de vida' }
                  ].map((cat) => {
                    const isExpanded = expandedScreening === cat.key;
                    const testData = screeningHistory[cat.key as keyof ScreeningHistory];
                    const hasData = Boolean(testData.dueDate || testData.applied || testData.comments);
                    const Icon = cat.icon;

                    return (
                      <div key={cat.key} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                        <button
                          onClick={() => setExpandedScreening(isExpanded ? null : cat.key)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3 text-left">
                            <div className={cn("p-2 rounded-lg shrink-0", hasData ? "bg-theme-base/20 text-theme-dark dark:text-theme-base" : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400")}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{cat.label}</span>
                            {hasData && <span className="w-2 h-2 rounded-full bg-theme-base shrink-0"></span>}
                          </div>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                        </button>

                        {isExpanded && (
                          <div className="p-4 space-y-4 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                              <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start">
                                <span className="font-semibold mr-1">Recomendación:</span> {cat.recommendation}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between space-x-4">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha programada</label>
                                <div className="relative">
                                  <input
                                    type="date"
                                    value={testData.dueDate}
                                    onChange={(e) => handleScreeningChange(cat.key as keyof ScreeningHistory, 'dueDate', e.target.value)}
                                    className="w-full p-3 pl-10 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-sm text-gray-900 dark:text-white"
                                  />
                                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 pt-5">
                                <input
                                  type="checkbox"
                                  id={`applied-${cat.key}`}
                                  checked={testData.applied}
                                  onChange={(e) => handleScreeningChange(cat.key as keyof ScreeningHistory, 'applied', e.target.checked)}
                                  className="w-5 h-5 text-theme-base rounded border-gray-300 focus:ring-theme-base dark:border-gray-600 dark:bg-gray-700"
                                />
                                <label htmlFor={`applied-${cat.key}`} className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                  Aplicado
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Comentarios</label>
                              <textarea
                                value={testData.comments}
                                onChange={(e) => handleScreeningChange(cat.key as keyof ScreeningHistory, 'comments', e.target.value)}
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-all text-sm text-gray-900 dark:text-white resize-none"
                                placeholder="Anotaciones del padre/madre..."
                                rows={2}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={showSaveSuccess}
                className={cn(
                  "w-full py-3 mt-2 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-300",
                  showSaveSuccess 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 scale-95" 
                    : "bg-theme-dark dark:bg-theme-base text-white hover:bg-opacity-90 disabled:opacity-50"
                )}
              >
                {showSaveSuccess ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                <span>{showSaveSuccess ? "¡Perfil Guardado!" : "Guardar Perfil"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Temas y Sincronización */}
        <div className="space-y-6">
          {/* Sistema de Temas */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-theme-light dark:bg-theme-dark/20 rounded-xl text-theme-dark dark:text-theme-base">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Apariencia</h3>
            </div>

            <div className="mb-6">
              <button
                onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all shadow-sm"
              >
                {colorMode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>{colorMode === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Color Principal</label>
              <div className="grid grid-cols-5 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "flex flex-col items-center space-y-2 group transition-all",
                      theme === t.id ? "scale-110" : "hover:scale-105 opacity-70 hover:opacity-100"
                    )}
                  >
                    <div 
                      className={cn(
                        "w-12 h-12 rounded-full shadow-sm border-2 transition-all",
                        theme === t.id ? "border-gray-800 dark:border-gray-200 shadow-md" : "border-transparent"
                      )}
                      style={{ backgroundColor: t.color }}
                    />
                    <span className={cn(
                      "text-[10px] font-medium text-center leading-tight",
                      theme === t.id ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sincronización en la Nube */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Sincronización Familiar</h3>
            </div>
            
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <img src={user.photoURL || ''} alt="User" className="w-10 h-10 rounded-full" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user.displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-1">ID: {familyId}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Tus datos se están sincronizando en la nube.
                </p>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={handleForceSync}
                    disabled={isSyncing}
                    className="w-full py-2.5 bg-theme-base text-white rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-theme-dark transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Forzar Sincronización'}</span>
                  </button>
                  <button
                    onClick={logout}
                    className="w-full py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Inicia sesión para guardar tus datos en la nube y compartirlos en tiempo real con tu pareja.
                </p>
                <button
                  onClick={loginWithGoogle}
                  className="w-full py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  <span>Continuar con Google</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
