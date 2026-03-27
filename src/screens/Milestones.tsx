import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Trophy, AlertTriangle, Check, Camera, X, Download, Phone, Smile, Footprints, Ear, MessageCircle, Hand, Users, Brain, BookOpen, Lock, Activity, Heart, Eye, Bell, Accessibility, Component, Layers, Palette, Hash, Edit3, Stethoscope } from 'lucide-react';
import { cn } from '../components/Layout';
import confetti from 'canvas-confetti';
import { differenceInMonths } from 'date-fns';

const AGE_GROUPS = [
  { id: '1m', label: '1 MES', icon: Smile, months: 1 },
  { id: '3m', label: '3 MESES', icon: Bell, months: 3 },
  { id: '6m', label: '6 MESES', icon: Accessibility, months: 6 },
  { id: '1y', label: '1 AÑO', icon: Footprints, months: 12 },
  { id: '1.5y', label: '1 AÑO Y 6 MESES', icon: Component, months: 18 },
  { id: '2y', label: '2 AÑOS', icon: Layers, months: 24 },
  { id: '3y', label: '3 AÑOS', icon: Palette, months: 36 },
  { id: '4y', label: '4 AÑOS', icon: Hash, months: 48 },
  { id: '5y', label: '5 AÑOS', icon: BookOpen, months: 60 },
  { id: '6y', label: '6 AÑOS', icon: Users, months: 72 },
  { id: '7y', label: '7 AÑOS', icon: Trophy, months: 84 },
  { id: '8y', label: '8 AÑOS', icon: Edit3, months: 96 },
];

const CATEGORIES = [
  { id: 'motor', label: 'El Sendero del Movimiento', color: 'bg-green-500', text: 'text-green-500', border: 'border-green-500', lightBg: 'bg-green-100 dark:bg-green-900/30' },
  { id: 'language', label: 'La Ruta de la Comunicación', color: 'bg-pink-500', text: 'text-pink-500', border: 'border-pink-500', lightBg: 'bg-pink-100 dark:bg-pink-900/30' },
  { id: 'social', label: 'El Camino del Corazón', color: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', lightBg: 'bg-orange-100 dark:bg-orange-900/30' },
  { id: 'knowledge', label: 'La Cúspide Intelectual', color: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500', lightBg: 'bg-purple-100 dark:bg-purple-900/30' },
];

const MILESTONES = [
  { id: '1m-motor', ageGroup: '1m', category: 'motor', title: 'Gira la cabeza', icon: Eye, question: '¿Puede voltear su cabeza para los lados cuando está boca abajo?' },
  { id: '1m-language', ageGroup: '1m', category: 'language', title: 'Llora/Hace ruido', icon: MessageCircle, question: '¿Llora o hace ruido al estar incómodo(a) o querer comer?' },
  { id: '1m-social', ageGroup: '1m', category: 'social', title: 'Se tranquiliza', icon: Heart, question: '¿Se tranquiliza al hablarle o levantarlo(a)?' },

  { id: '3m-motor', ageGroup: '3m', category: 'motor', title: 'Sostiene cabeza', icon: Activity, question: '¿Logra sostener su cabeza?' },
  { id: '3m-language', ageGroup: '3m', category: 'language', title: 'Sonríe/Balbucea', icon: Smile, question: '¿Hace sonidos con la boca o sonrie?' },
  { id: '3m-social', ageGroup: '3m', category: 'social', title: 'Responde al juego', icon: Users, question: '¿Responde cuando juegan juntos?' },

  { id: '6m-motor', ageGroup: '6m', category: 'motor', title: 'Se sienta', icon: Hand, question: '¿Se mantiene sentado(a) aunque sea apoyándose con sus manos?' },
  { id: '6m-language', ageGroup: '6m', category: 'language', title: 'Imita sonidos', icon: Ear, question: '¿Imita sonidos como: le, be, ps, gu?' },
  { id: '6m-social', ageGroup: '6m', category: 'social', title: 'Juega a taparse', icon: Eye, question: '¿Se ríe cuando juegas a taparse y destaparse la cara?' },

  { id: '1y-motor', ageGroup: '1y', category: 'motor', title: 'Camina apoyado', icon: Footprints, question: '¿Puede caminar agarrado(a) de muebles?' },
  { id: '1y-language', ageGroup: '1y', category: 'language', title: 'Reacciona al NO', icon: AlertTriangle, question: '¿Cuando está entretenido(a) y se le dice NO reacciona?' },
  { id: '1y-social', ageGroup: '1y', category: 'social', title: 'Come solo', icon: Hand, question: '¿Empieza a comer por sí solo(a)?' },

  { id: '1.5y-motor', ageGroup: '1.5y', category: 'motor', title: 'Camina solo', icon: Footprints, question: '¿Camina solo(a)?' },
  { id: '1.5y-language', ageGroup: '1.5y', category: 'language', title: 'Dice 4 palabras', icon: MessageCircle, question: '¿Dice cuatro palabras, además de mamá y papá?' },
  { id: '1.5y-social', ageGroup: '1.5y', category: 'social', title: 'Imita tareas', icon: Users, question: '¿Imita tareas sencillas de casa, como: barrer o limpiar?' },

  { id: '2y-motor', ageGroup: '2y', category: 'motor', title: 'Sube muebles', icon: Activity, question: '¿Puede subirse solo (a) a las sillas, sillones y camas?' },
  { id: '2y-language', ageGroup: '2y', category: 'language', title: 'Obedece órdenes', icon: Ear, question: '¿Obedece órdenes sencillas, como “¡dame la pelota!"?' },
  { id: '2y-social', ageGroup: '2y', category: 'social', title: 'Intenta ser indep.', icon: Hand, question: '¿Hace intentos por ser independiente? (Lavarse las manos o vestirse)' },

  { id: '3y-motor', ageGroup: '3y', category: 'motor', title: 'Dibuja círculo', icon: Hand, question: '¿Puede dibujar un círculo o una cruz?' },
  { id: '3y-language', ageGroup: '3y', category: 'language', title: 'Pregunta "por qué"', icon: MessageCircle, question: '¿Frecuentemente pregunta " por qué”?' },
  { id: '3y-social', ageGroup: '3y', category: 'social', title: 'Juega con otros', icon: Users, question: '¿Juega con otros niños y niñas?' },
  { id: '3y-knowledge', ageGroup: '3y', category: 'knowledge', title: 'Conoce 4 colores', icon: Brain, question: '¿Conoce los nombres de al menos cuatro colores?' },

  { id: '4y-motor', ageGroup: '4y', category: 'motor', title: 'Dibuja persona', icon: Hand, question: '¿Puede dibujar una persona con una o más partes de su cuerpo?' },
  { id: '4y-language', ageGroup: '4y', category: 'language', title: 'Pide "más"', icon: MessageCircle, question: '¿Pide “más” cuando algo le gusta mucho?' },
  { id: '4y-social', ageGroup: '4y', category: 'social', title: 'Va solo al baño', icon: Activity, question: '¿Puede ir solo al baño?' },
  { id: '4y-knowledge', ageGroup: '4y', category: 'knowledge', title: 'Cuenta hasta 10', icon: Brain, question: '¿Puede contar hasta el número 10?' },

  { id: '5y-motor', ageGroup: '5y', category: 'motor', title: 'Brinca hacia atrás', icon: Footprints, question: '¿Puede brincar hacia atrás con los pies juntos?' },
  { id: '5y-language', ageGroup: '5y', category: 'language', title: 'Comunica emociones', icon: Heart, question: '¿Comunica sus emociones cuando esta: “feliz, triste o enojado”?' },
  { id: '5y-social', ageGroup: '5y', category: 'social', title: 'Le gusta la escuela', icon: Users, question: '¿Le gusta ir a la escuela?' },
  { id: '5y-knowledge', ageGroup: '5y', category: 'knowledge', title: 'Escribe números/letras', icon: BookOpen, question: '¿Puede escribir dos números o letras?' },

  { id: '6y-social', ageGroup: '6y', category: 'social', title: 'Sigue reglas', icon: Users, question: '¿Puede seguir las reglas de juegos sencillos?' },
  { id: '6y-knowledge', ageGroup: '6y', category: 'knowledge', title: 'Lee 10 palabras', icon: BookOpen, question: '¿Lee por lo menos 10 palabras en voz alta?' },

  { id: '7y-social', ageGroup: '7y', category: 'social', title: 'Mantiene puntaje', icon: Activity, question: '¿Se integra en juegos que requieren mantener puntaje?' },
  { id: '7y-knowledge', ageGroup: '7y', category: 'knowledge', title: 'Orden alfabético', icon: BookOpen, question: '¿Enlista palabras en orden alfabético?' },

  { id: '8y-social', ageGroup: '8y', category: 'social', title: 'Se disculpa', icon: Heart, question: '¿Se disculpa después de lastimar los sentimientos de otras personas?' },
  { id: '8y-knowledge', ageGroup: '8y', category: 'knowledge', title: 'Escribe oraciones', icon: BookOpen, question: '¿Escribe oraciones sencillas de 3 o 4 palabras?' },
];

const ALARMS_0_5 = [
  { id: 'a1', text: 'No responde a sonidos fuertes o cuando se le habla por su nombre.' },
  { id: 'a2', text: 'Presenta rigidez o flacidez.' },
  { id: 'a3', text: 'Cuando le hablan no ve a los ojos o no muestra expresiones en la cara.' },
  { id: 'a4', text: 'Tiene problemas para comer: se atraganta, se pone morado, le cuesta trabajo aceptar diversos alimentos.' },
  { id: 'a5', text: 'Presenta retraso en el lenguaje o se regresa a etapas del desarrollo que ya había superado de acuerdo a su edad.' },
];

const ALARMS_6_8 = [
  { id: 'a6', text: 'La(o) notas aislado (a), no acepta convivir con otras personas, se niega a ir a la escuela, presenta miedo, es demasiado ansioso (a), o dependiente de la persona que lo cuida.' },
  { id: 'a7', text: 'Frecuentemente es impulsivo(a), agresivo(a), se burla o es insensible con los demas.' },
  { id: 'a8', text: 'Le cuesta trabajo cepillarse los dientes, lavarse y secarse las manos o vestirse sin ayuda.' },
  { id: 'a9', text: 'Le cuesta trabajo prestar atención o es más inquieto(a) que otros niños(as) de la misma edad.' },
  { id: 'a10', text: 'Tiene un temor anormal a sonidos, objetos o situaciones cotidianas.' },
  { id: 'a11', text: 'Ha dejado de hacer cosas que ya hacía por su cuenta, como no orinar en la cama.' },
];

export function Milestones() {
  const { completedMilestones, completeMilestone, removeMilestone, activeAlarms, toggleAlarm, profile } = useStore();
  const [selectedMilestone, setSelectedMilestone] = useState<typeof MILESTONES[0] | null>(null);
  const [showAlarms, setShowAlarms] = useState(false);
  const [activeTab, setActiveTab] = useState<'path' | 'trophies'>('path');

  useEffect(() => {
    if (profile.birthDate) {
      const ageInMonths = differenceInMonths(new Date(), new Date(profile.birthDate));
      
      let targetAgeGroupId = AGE_GROUPS[0].id;
      for (let i = AGE_GROUPS.length - 1; i >= 0; i--) {
        if (ageInMonths >= AGE_GROUPS[i].months) {
          targetAgeGroupId = AGE_GROUPS[i].id;
          break;
        }
      }

      setTimeout(() => {
        const prefix = activeTab === 'path' ? 'age-group-' : 'trophy-group-';
        const element = document.getElementById(`${prefix}${targetAgeGroupId}`);
        const mainElement = document.querySelector('main');
        if (element && mainElement) {
          const headerOffset = 140; // Adjust for fixed header
          const elementPosition = element.getBoundingClientRect().top;
          const mainPosition = mainElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition - mainPosition + mainElement.scrollTop - headerOffset;
          
          mainElement.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [activeTab, profile.birthDate]);

  const handleUnlock = (id: string) => {
    completeMilestone(id);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleUndo = (id: string) => {
    removeMilestone(id);
  };

  const isAlarmActive = activeAlarms.length > 0;

  return (
    <div className="max-w-md md:max-w-4xl mx-auto pb-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="sticky top-0 z-40 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm pt-4 pb-4 px-4 space-y-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Camino de Logros</h2>
          <button 
            onClick={() => setShowAlarms(true)}
            className={cn(
              "p-2 sm:px-4 rounded-full transition-colors relative flex items-center space-x-2",
              isAlarmActive ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            )}
          >
            <Stethoscope className="w-6 h-6 sm:w-5 sm:h-5" />
            <span className="text-sm font-bold hidden sm:inline">Consejos / Alertas</span>
            {isAlarmActive && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>}
          </button>
        </div>

        <div className="flex space-x-2 bg-gray-200/50 dark:bg-gray-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('path')}
            className={cn("flex-1 py-2.5 text-sm font-bold rounded-xl transition-all", activeTab === 'path' ? "bg-theme-base text-theme-dark shadow-md" : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700")}
          >
            Ruta de Desarrollo
          </button>
          <button
            onClick={() => setActiveTab('trophies')}
            className={cn("flex-1 py-2.5 text-sm font-bold rounded-xl transition-all", activeTab === 'trophies' ? "bg-theme-base text-theme-dark shadow-md" : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700")}
          >
            Salón de la Fama
          </button>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'path' ? (
          <div className="space-y-16 relative pb-20">
          {/* Line connecting the path */}
          <div className="absolute left-1/2 top-0 bottom-0 w-3 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 -translate-x-1/2 rounded-full z-0"></div>

          {[...AGE_GROUPS].reverse().map((ageGroup) => {
            const groupMilestones = MILESTONES.filter(m => m.ageGroup === ageGroup.id);
            if (groupMilestones.length === 0) return null;

            return (
              <div key={ageGroup.id} id={`age-group-${ageGroup.id}`} className="relative z-10">
                <div className="flex justify-center mb-8">
                  <div className="bg-theme-dark text-white px-8 py-2.5 rounded-full font-bold shadow-lg border-4 border-white dark:border-gray-900 text-lg">
                    {ageGroup.label}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {CATEGORIES.map(cat => {
                    const milestone = groupMilestones.find(m => m.category === cat.id);
                    if (!milestone) return <div key={cat.id} className="hidden md:block"></div>;

                    const isCompleted = !!completedMilestones[milestone.id];
                    const Icon = milestone.icon || Trophy;

                    return (
                      <div key={milestone.id} className="flex flex-col items-center relative group">
                        <button
                          onClick={() => setSelectedMilestone(milestone)}
                          className={cn(
                            "w-24 h-24 rounded-full flex items-center justify-center shadow-md border-4 transition-all hover:scale-105 relative z-10",
                            isCompleted ? cat.color + " border-white dark:border-gray-900" : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          )}
                        >
                          <Icon className={cn("w-10 h-10", isCompleted ? "text-white" : "text-gray-400 dark:text-gray-500")} />
                          
                          {/* Status Badge */}
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center shadow-sm",
                            isCompleted ? "bg-green-500 text-white" : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                          )}>
                            {isCompleted ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </div>
                        </button>
                        <span className={cn(
                          "text-sm font-bold mt-4 text-center px-2 leading-tight", 
                          isCompleted ? "text-gray-800 dark:text-gray-200" : "text-gray-500 dark:text-gray-400"
                        )}>
                          {milestone.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...AGE_GROUPS].reverse().map(ageGroup => {
            const groupMilestones = MILESTONES.filter(m => m.ageGroup === ageGroup.id);
            if (groupMilestones.length === 0) return null;
            
            const completedCount = groupMilestones.filter(m => completedMilestones[m.id]).length;
            const totalCount = groupMilestones.length;
            const progress = (completedCount / totalCount) * 100;
            const isFullyCompleted = completedCount === totalCount;
            const isInProgress = completedCount > 0 && !isFullyCompleted;
            const isLocked = completedCount === 0;
            
            const Icon = ageGroup.icon || Trophy;
            
            const radius = 28;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (progress / 100) * circumference;

            return (
              <div key={ageGroup.id} id={`trophy-group-${ageGroup.id}`} className={cn(
                "p-5 rounded-3xl border-2 flex items-center space-x-4 transition-all",
                isFullyCompleted ? "bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-700/50" : 
                isInProgress ? "bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-700/50" : 
                "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700"
              )}>
                <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r={radius}
                      strokeWidth="4"
                      fill="none"
                      className={cn(
                        "stroke-current",
                        isFullyCompleted ? "text-green-200 dark:text-green-900/50" : 
                        isLocked ? "text-gray-200 dark:text-gray-700" : "text-yellow-200 dark:text-yellow-900/50"
                      )}
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r={radius}
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className={cn(
                        "stroke-current transition-all duration-1000 ease-out",
                        isFullyCompleted ? "text-green-500" : 
                        isLocked ? "text-gray-300 dark:text-gray-600" : "text-yellow-500"
                      )}
                    />
                  </svg>
                  <Icon className={cn(
                    "w-8 h-8 z-10",
                    isFullyCompleted ? "text-green-600 dark:text-green-400" : 
                    isLocked ? "text-gray-400 dark:text-gray-500" : "text-yellow-600 dark:text-yellow-400"
                  )} />
                  {isLocked && (
                    <div className="absolute bottom-0 right-0 bg-gray-200 dark:bg-gray-700 rounded-full p-1.5 border-2 border-white dark:border-gray-800 z-20">
                      <Lock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                  {isFullyCompleted && (
                    <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1.5 border-2 border-white dark:border-gray-800 z-20">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={cn(
                      "font-bold text-lg truncate", 
                      isFullyCompleted ? "text-green-800 dark:text-green-400" : 
                      isInProgress ? "text-yellow-800 dark:text-yellow-400" : "text-gray-600 dark:text-gray-300"
                    )}>
                      {ageGroup.label}
                    </h4>
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded-full",
                      isFullyCompleted ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" :
                      isInProgress ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" :
                      "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    )}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {groupMilestones.slice(0, 3).map(m => m.title).join(', ')}
                    {groupMilestones.length > 3 ? '...' : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Milestone Detail Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start mb-4 shrink-0">
              <div className="flex items-center space-x-3">
                <div className={cn("p-3 rounded-2xl", CATEGORIES.find(c => c.id === selectedMilestone.category)?.lightBg)}>
                  <Trophy className={cn("w-6 h-6", CATEGORIES.find(c => c.id === selectedMilestone.category)?.text)} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    Hito {selectedMilestone.category === 'motor' ? 'Motor' : selectedMilestone.category === 'language' ? 'Lenguaje' : selectedMilestone.category === 'social' ? 'Social' : 'Conocimiento'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{AGE_GROUPS.find(a => a.id === selectedMilestone.ageGroup)?.label}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMilestone(null)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-2 space-y-6">
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200 text-center">
                "{selectedMilestone.question}"
              </p>

              <div className="space-y-4">
                {!completedMilestones[selectedMilestone.id] ? (
                  <button
                    onClick={() => handleUnlock(selectedMilestone.id)}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold text-white shadow-md transition-transform active:scale-95",
                      CATEGORIES.find(c => c.id === selectedMilestone.category)?.color
                    )}
                  >
                    ¡Desbloquear Trofeo!
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-2xl flex items-center justify-center space-x-2 font-bold">
                        <Check className="w-5 h-5" />
                        <span>¡Trofeo Desbloqueado!</span>
                      </div>
                      <button 
                        onClick={() => handleUndo(selectedMilestone.id)}
                        className="text-xs text-gray-500 hover:text-red-500 underline text-center transition-colors"
                      >
                        Deshacer (marcar como no completado)
                      </button>
                    </div>
                    
                    {/* Evidence Upload */}
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-4 text-center">
                      {completedMilestones[selectedMilestone.id].evidenceUrl ? (
                        <div className="relative rounded-xl overflow-hidden h-40">
                          <img src={completedMilestones[selectedMilestone.id].evidenceUrl} alt="Evidencia" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => {
                              // Implement remove evidence
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button className="flex flex-col items-center justify-center w-full h-24 text-gray-500 dark:text-gray-400 hover:text-theme-base transition-colors">
                          <Camera className="w-8 h-8 mb-2" />
                          <span className="text-sm font-medium">Subir foto/video de recuerdo</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-2 mb-4 text-orange-600 dark:text-orange-400">
                    <AlertTriangle className="w-5 h-5" />
                    <h4 className="font-bold">Signos de Alarma ({['6y', '7y', '8y'].includes(selectedMilestone.ageGroup) ? 'A partir de los 6 años' : 'De 1 mes hasta los 5 años'})</h4>
                  </div>
                  <div className="space-y-2">
                    {(['6y', '7y', '8y'].includes(selectedMilestone.ageGroup) ? ALARMS_6_8 : ALARMS_0_5).map(alarm => (
                      <button
                        key={alarm.id}
                        onClick={() => toggleAlarm(alarm.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-xl border transition-all flex items-start space-x-3",
                          activeAlarms.includes(alarm.id) ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" : "bg-gray-50 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <div className={cn("w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5", activeAlarms.includes(alarm.id) ? "bg-red-500 border-red-500 text-white" : "border-gray-300 dark:border-gray-500")}>
                          {activeAlarms.includes(alarm.id) && <Check className="w-3 h-3" />}
                        </div>
                        <span className={cn("text-sm", activeAlarms.includes(alarm.id) ? "text-red-900 dark:text-red-200 font-medium" : "text-gray-700 dark:text-gray-300")}>{alarm.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Alarms Modal */}
      {showAlarms && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className={cn("p-3 rounded-2xl", isAlarmActive ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400")}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Signos de Alarma</h3>
              </div>
              <button onClick={() => setShowAlarms(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              <div>
                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3">De 1 mes hasta los 5 años:</h4>
                <div className="space-y-2">
                  {ALARMS_0_5.map(alarm => (
                    <button
                      key={alarm.id}
                      onClick={() => toggleAlarm(alarm.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all flex items-start space-x-3",
                        activeAlarms.includes(alarm.id) ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" : "bg-gray-50 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      <div className={cn("w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5", activeAlarms.includes(alarm.id) ? "bg-red-500 border-red-500 text-white" : "border-gray-300 dark:border-gray-500")}>
                        {activeAlarms.includes(alarm.id) && <Check className="w-3 h-3" />}
                      </div>
                      <span className={cn("text-sm", activeAlarms.includes(alarm.id) ? "text-red-900 dark:text-red-200 font-medium" : "text-gray-700 dark:text-gray-300")}>{alarm.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3">A partir de los 6 años:</h4>
                <div className="space-y-2">
                  {ALARMS_6_8.map(alarm => (
                    <button
                      key={alarm.id}
                      onClick={() => toggleAlarm(alarm.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all flex items-start space-x-3",
                        activeAlarms.includes(alarm.id) ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" : "bg-gray-50 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      <div className={cn("w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5", activeAlarms.includes(alarm.id) ? "bg-red-500 border-red-500 text-white" : "border-gray-300 dark:border-gray-500")}>
                        {activeAlarms.includes(alarm.id) && <Check className="w-3 h-3" />}
                      </div>
                      <span className={cn("text-sm", activeAlarms.includes(alarm.id) ? "text-red-900 dark:text-red-200 font-medium" : "text-gray-700 dark:text-gray-300")}>{alarm.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isAlarmActive && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 space-y-3">
                <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-xl text-sm font-medium flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>Has marcado signos de alarma. Te recomendamos contactar a tu pediatra para una evaluación.</p>
                </div>
                <div className="flex space-x-3">
                  <button className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors">
                    <Phone className="w-5 h-5" />
                    <span>Contactar Pediatra</span>
                  </button>
                  <button className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors">
                    <Download className="w-5 h-5" />
                    <span>Exportar Reporte</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
