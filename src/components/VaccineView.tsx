import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Award, 
  Trophy, 
  HelpCircle, 
  Calendar, 
  FileText, 
  Check, 
  X, 
  Info, 
  RotateCcw, 
  Activity, 
  Syringe, 
  ClipboardList 
} from 'lucide-react';
import { useStore } from '../store';
import { cn } from './Layout';
import { format, differenceInMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import confetti from 'canvas-confetti';

interface VaccineBadge {
  id: string;
  name: string;
  dose: string;
  diseases: string;
  recommendedAgeNum: number; // in months
  recommendedAgeLabel: string;
  badgeTheme: {
    gradient: string;
    shadow: string;
    icon: string;
    name: string; // Lore name
    textColor: string;
    borderColor: string;
  };
}

const VACCINE_BADGES: VaccineBadge[] = [
  {
    id: 'bcg_unica',
    name: 'BCG',
    dose: 'Única',
    diseases: 'Tuberculosis meníngea y miliar',
    recommendedAgeNum: 0,
    recommendedAgeLabel: 'Al nacer',
    badgeTheme: {
      gradient: 'from-amber-400 via-yellow-500 to-amber-600',
      shadow: 'shadow-amber-500/30 hover:shadow-amber-500/50',
      icon: '🪵',
      name: 'Medalla Primordial',
      textColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-500/30'
    }
  },
  {
    id: 'hepb_unica',
    name: 'Hepatitis B',
    dose: 'Única (Nacimiento)',
    diseases: 'Infección por virus de Hepatitis B',
    recommendedAgeNum: 0,
    recommendedAgeLabel: 'Al nacer',
    badgeTheme: {
      gradient: 'from-blue-400 via-sky-500 to-blue-600',
      shadow: 'shadow-blue-500/30 hover:shadow-blue-500/50',
      icon: '💧',
      name: 'Medalla Torrente',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-500/30'
    }
  },
  {
    id: 'hexavalente_1',
    name: 'Hexavalente',
    dose: '1ª Dosis',
    diseases: 'Difteria, Tosferina, Tétanos, Poliomielitis, Hepatitis B y enfermedades graves por Haemophilus influenzae b (meningitis, neumonía)',
    recommendedAgeNum: 2,
    recommendedAgeLabel: '2 meses',
    badgeTheme: {
      gradient: 'from-purple-500 via-indigo-500 to-indigo-700',
      shadow: 'shadow-indigo-500/30 hover:shadow-indigo-500/50',
      icon: '⚡',
      name: 'Medalla Fuerza I',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-indigo-500/30'
    }
  },
  {
    id: 'rotavirus_1',
    name: 'Rotavirus',
    dose: '1ª Dosis',
    diseases: 'Diarrea severa y deshidratación por Rotavirus',
    recommendedAgeNum: 2,
    recommendedAgeLabel: '2 meses',
    badgeTheme: {
      gradient: 'from-emerald-400 via-teal-500 to-emerald-600',
      shadow: 'shadow-emerald-500/30 hover:shadow-emerald-500/50',
      icon: '🌀',
      name: 'Medalla Espiral I',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-500/30'
    }
  },
  {
    id: 'neumococo_1',
    name: 'Neumocócica conjugada',
    dose: '1ª Dosis',
    diseases: 'Infecciones invasivas como neumonía, meningitis u otitis media causadas por neumococo',
    recommendedAgeNum: 2,
    recommendedAgeLabel: '2 meses',
    badgeTheme: {
      gradient: 'from-sky-400 via-cyan-500 to-indigo-500',
      shadow: 'shadow-cyan-500/30 hover:shadow-cyan-500/50',
      icon: '🧱',
      name: 'Medalla Escudo I',
      textColor: 'text-cyan-600 dark:text-cyan-400',
      borderColor: 'border-cyan-500/30'
    }
  },
  {
    id: 'hexavalente_2',
    name: 'Hexavalente',
    dose: '2ª Dosis',
    diseases: 'Difteria, Tosferina, Tétanos, Poliomielitis, Hepatitis B y Haemophilus influenzae b',
    recommendedAgeNum: 4,
    recommendedAgeLabel: '4 meses',
    badgeTheme: {
      gradient: 'from-purple-500 via-indigo-500 to-indigo-700',
      shadow: 'shadow-indigo-500/30 hover:shadow-indigo-500/50',
      icon: '⚡⚡',
      name: 'Medalla Fuerza II',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-indigo-500/30'
    }
  },
  {
    id: 'rotavirus_2',
    name: 'Rotavirus',
    dose: '2ª Dosis',
    diseases: 'Diarrea severa por Rotavirus',
    recommendedAgeNum: 4,
    recommendedAgeLabel: '4 meses',
    badgeTheme: {
      gradient: 'from-emerald-400 via-teal-500 to-emerald-600',
      shadow: 'shadow-emerald-500/30 hover:shadow-emerald-500/50',
      icon: '🌀🌀',
      name: 'Medalla Espiral II',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-500/30'
    }
  },
  {
    id: 'neumococo_2',
    name: 'Neumocócica conjugada',
    dose: '2ª Dosis',
    diseases: 'Infecciones por neumococo (neumonía, meningitis)',
    recommendedAgeNum: 4,
    recommendedAgeLabel: '4 meses',
    badgeTheme: {
      gradient: 'from-sky-400 via-cyan-500 to-indigo-500',
      shadow: 'shadow-cyan-500/30 hover:shadow-cyan-500/50',
      icon: '🧱🧱',
      name: 'Medalla Escudo II',
      textColor: 'text-cyan-600 dark:text-cyan-400',
      borderColor: 'border-cyan-500/30'
    }
  },
  {
    id: 'hexavalente_3',
    name: 'Hexavalente',
    dose: '3ª Dosis',
    diseases: 'Difteria, Tosferina, Tétanos, Poliomielitis, Hepatitis B y Haemophilus influenzae b',
    recommendedAgeNum: 6,
    recommendedAgeLabel: '6 meses',
    badgeTheme: {
      gradient: 'from-purple-500 via-indigo-500 to-indigo-700',
      shadow: 'shadow-indigo-500/30 hover:shadow-indigo-500/50',
      icon: '⚡⚡⚡',
      name: 'Medalla Fuerza III',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-indigo-500/30'
    }
  },
  {
    id: 'influenza_1',
    name: 'Influenza',
    dose: '1ª Dosis',
    diseases: 'Neumonía estacional severa por el virus de la Influenza A o B',
    recommendedAgeNum: 6,
    recommendedAgeLabel: '6 meses',
    badgeTheme: {
      gradient: 'from-teal-300 via-cyan-400 to-emerald-500',
      shadow: 'shadow-teal-500/30 hover:shadow-teal-500/50',
      icon: '❄️',
      name: 'Medalla Ventisca I',
      textColor: 'text-teal-600 dark:text-teal-400',
      borderColor: 'border-teal-500/30'
    }
  },
  {
    id: 'influenza_2',
    name: 'Influenza',
    dose: '2ª Dosis',
    diseases: 'Influenza estacional (4 semanas después de la 1ª dosis)',
    recommendedAgeNum: 7,
    recommendedAgeLabel: '7 meses',
    badgeTheme: {
      gradient: 'from-teal-300 via-cyan-400 to-emerald-500',
      shadow: 'shadow-teal-500/30 hover:shadow-teal-500/50',
      icon: '❄️❄️',
      name: 'Medalla Ventisca II',
      textColor: 'text-teal-600 dark:text-teal-400',
      borderColor: 'border-teal-500/30'
    }
  },
  {
    id: 'neumococo_refuerzo',
    name: 'Neumocócica conjugada',
    dose: 'Refuerzo',
    diseases: 'Protección madura contra infecciones por neumococo',
    recommendedAgeNum: 12,
    recommendedAgeLabel: '12 meses (1 año)',
    badgeTheme: {
      gradient: 'from-sky-500 via-blue-500 to-indigo-600',
      shadow: 'shadow-sky-500/30 hover:shadow-sky-500/50',
      icon: '🏰',
      name: 'Baluarte Inquebrantable',
      textColor: 'text-sky-600 dark:text-sky-400',
      borderColor: 'border-sky-500/30'
    }
  },
  {
    id: 'srp_1',
    name: 'SRP (Triple viral)',
    dose: '1ª Dosis',
    diseases: 'Sarampión, Rubéola y Parotiditis (Paperas)',
    recommendedAgeNum: 12,
    recommendedAgeLabel: '12 meses (1 año)',
    badgeTheme: {
      gradient: 'from-pink-500 via-purple-500 to-orange-400',
      shadow: 'shadow-purple-500/30 hover:shadow-purple-500/50',
      icon: '🌈',
      name: 'Medalla Prisma I',
      textColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-500/30'
    }
  },
  {
    id: 'influenza_anual_1',
    name: 'Influenza',
    dose: 'Dosis Anual (1 año)',
    diseases: 'Complicaciones invernales por Influenza virus',
    recommendedAgeNum: 12,
    recommendedAgeLabel: '12 meses (1 año)',
    badgeTheme: {
      gradient: 'from-teal-400 via-emerald-450 to-emerald-550',
      shadow: 'shadow-teal-500/35 hover:shadow-teal-500/50',
      icon: '❄️🛡️',
      name: 'Refugio Invernal I',
      textColor: 'text-teal-600 dark:text-teal-400',
      borderColor: 'border-teal-500/30'
    }
  },
  {
    id: 'hexavalente_refuerzo',
    name: 'Hexavalente',
    dose: 'Refuerzo',
    diseases: 'Refuerzo definitivo de Difteria, Tosferina, Tétanos, Poliomielitis, Hepatitis B y Haemophilus b',
    recommendedAgeNum: 18,
    recommendedAgeLabel: '18 meses (1.5 años)',
    badgeTheme: {
      gradient: 'from-violet-600 via-indigo-600 to-purple-800',
      shadow: 'shadow-indigo-600/35 hover:shadow-indigo-600/50',
      icon: '🏆',
      name: 'Emblema Legendario',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-indigo-500/30'
    }
  },
  {
    id: 'srp_2',
    name: 'SRP (Triple viral)',
    dose: '2ª Dosis',
    diseases: 'Inmunización robusta contra Sarampión, Rubéola y Parotiditis',
    recommendedAgeNum: 18,
    recommendedAgeLabel: '18 meses (o 6 años)',
    badgeTheme: {
      gradient: 'from-pink-500 via-purple-500 to-orange-450',
      shadow: 'shadow-purple-500/35 hover:shadow-purple-500/50',
      icon: '🌈🌈',
      name: 'Medalla Prisma II',
      textColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-500/30'
    }
  },
  {
    id: 'influenza_anual_2',
    name: 'Influenza',
    dose: 'Dosis Anual (2 años)',
    diseases: 'Complicaciones invernales por Influenza virus',
    recommendedAgeNum: 24,
    recommendedAgeLabel: '2 años',
    badgeTheme: {
      gradient: 'from-teal-400 via-emerald-450 to-emerald-550',
      shadow: 'shadow-teal-500/35 hover:shadow-teal-500/50',
      icon: '❄️🛡️',
      name: 'Refugio Invernal II',
      textColor: 'text-teal-600 dark:text-teal-400',
      borderColor: 'border-teal-500/30'
    }
  },
  {
    id: 'influenza_anual_3',
    name: 'Influenza',
    dose: 'Dosis Anual (3 años)',
    diseases: 'Complicaciones invernales por Influenza virus',
    recommendedAgeNum: 36,
    recommendedAgeLabel: '3 años',
    badgeTheme: {
      gradient: 'from-teal-400 via-emerald-450 to-emerald-550',
      shadow: 'shadow-teal-500/35 hover:shadow-teal-500/50',
      icon: '❄️🛡️',
      name: 'Refugio Invernal III',
      textColor: 'text-teal-600 dark:text-teal-400',
      borderColor: 'border-teal-500/30'
    }
  },
  {
    id: 'dpt_refuerzo',
    name: 'DPT',
    dose: 'Dosis de Refuerzo',
    diseases: 'Difteria, Tosferina y Tétanos en edad escolar',
    recommendedAgeNum: 48,
    recommendedAgeLabel: '4 años',
    badgeTheme: {
      gradient: 'from-rose-500 via-red-500 to-red-700',
      shadow: 'shadow-red-500/30 hover:shadow-red-500/50',
      icon: '⚔️',
      name: 'Medalla Coraza',
      textColor: 'text-rose-600 dark:text-rose-450',
      borderColor: 'border-rose-500/30'
    }
  },
  {
    id: 'influenza_anual_4',
    name: 'Influenza',
    dose: 'Dosis Anual (4 años)',
    diseases: 'Complicaciones invernales por Influenza virus',
    recommendedAgeNum: 48,
    recommendedAgeLabel: '4 años',
    badgeTheme: {
      gradient: 'from-teal-400 via-emerald-450 to-emerald-550',
      shadow: 'shadow-teal-500/35 hover:shadow-teal-500/50',
      icon: '❄️🛡️',
      name: 'Refugio Invernal IV',
      textColor: 'text-teal-600 dark:text-teal-400',
      borderColor: 'border-teal-500/30'
    }
  },
  {
    id: 'covid_1',
    name: 'COVID-19',
    dose: '1ª Dosis (A partir de los 5 años)',
    diseases: 'Formas graves de infección por virus SARS-CoV-2',
    recommendedAgeNum: 60,
    recommendedAgeLabel: '5 años',
    badgeTheme: {
      gradient: 'from-fuchsia-450 via-purple-500 to-indigo-750',
      shadow: 'shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50',
      icon: '🧪',
      name: 'Medalla Vanguardia I',
      textColor: 'text-fuchsia-600 dark:text-fuchsia-400',
      borderColor: 'border-fuchsia-500/30'
    }
  },
  {
    id: 'covid_2',
    name: 'COVID-19',
    dose: '2ª Dosis (A partir de los 5 años)',
    diseases: 'Formas graves de infección por virus SARS-CoV-2',
    recommendedAgeNum: 60,
    recommendedAgeLabel: '5 años',
    badgeTheme: {
      gradient: 'from-fuchsia-450 via-purple-500 to-indigo-750',
      shadow: 'shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50',
      icon: '🧪🧪',
      name: 'Medalla Vanguardia II',
      textColor: 'text-fuchsia-600 dark:text-fuchsia-400',
      borderColor: 'border-fuchsia-500/30'
    }
  },
  {
    id: 'covid_3',
    name: 'COVID-19',
    dose: '3ª Dosis (A partir de los 5 años)',
    diseases: 'Formas graves de infección por virus SARS-CoV-2',
    recommendedAgeNum: 60,
    recommendedAgeLabel: '5 años',
    badgeTheme: {
      gradient: 'from-fuchsia-450 via-purple-500 to-indigo-750',
      shadow: 'shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50',
      icon: '🧪🧪🧪',
      name: 'Medalla Vanguardia III',
      textColor: 'text-fuchsia-600 dark:text-fuchsia-400',
      borderColor: 'border-fuchsia-500/30'
    }
  }
];

export function VaccineView() {
  const { profile, appliedVaccines, applyVaccine, unapplyVaccine } = useStore();
  const [selectedBadge, setSelectedBadge] = useState<VaccineBadge | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'completed' | 'pending' | 'due'>('all');
  
  // Modal State
  const [inputDate, setInputDate] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [inputReactions, setInputReactions] = useState('');

  // Calculate Baby's Age in Months
  const ageInMonths = useMemo(() => {
    if (!profile.birthDate) return 0;
    try {
      const bDate = new Date(profile.birthDate);
      return Math.max(0, differenceInMonths(new Date(), bDate));
    } catch {
      return 0;
    }
  }, [profile.birthDate]);

  // Statistics
  const medallasTotales = VACCINE_BADGES.length;
  const medallasConseguidas = useMemo(() => {
    return VACCINE_BADGES.filter(b => appliedVaccines?.[b.id]?.applied).length;
  }, [appliedVaccines]);

  const porcentajeConseguido = Math.round((medallasConseguidas / medallasTotales) * 100);

  // Status Titles Based on Collection
  const getTrainerRank = (percent: number) => {
    if (percent === 100) return { title: 'Campeón Inmune de la Liga', desc: '¡Has conseguido todas las medallas del esquema oportuno!' };
    if (percent >= 80) return { title: 'Entrenador de Élite', desc: 'Tu bebé tiene un escudo inmunológico casi impenetrable' };
    if (percent >= 50) return { title: 'Líder en Entrenamiento', desc: 'Más de la mitad del medallero está brillando en tu estuche' };
    if (percent >= 25) return { title: 'Entrenador Promesa', desc: 'Sigues el esquema con constancia y dedicación' };
    if (percent > 0) return { title: 'Iniciando el Viaje', desc: 'Las primeras medallas brillan con fuerza para cuidar a tu bebé' };
    return { title: 'Aspirante de la Liga', desc: 'Registra la primera vacuna para comenzar a llenar tu Medallero' };
  };

  const rank = getTrainerRank(porcentajeConseguido);

  const filteredBadges = useMemo(() => {
    return VACCINE_BADGES.filter(badge => {
      const record = appliedVaccines?.[badge.id];
      const isApplied = !!record?.applied;

      switch (filterMode) {
        case 'completed':
          return isApplied;
        case 'pending':
          return !isApplied;
        case 'due':
          // recommended age matches or is past baby's current age, and not applied yet
          return !isApplied && badge.recommendedAgeNum <= ageInMonths;
        default:
          return true; // 'all'
      }
    });
  }, [appliedVaccines, filterMode, ageInMonths]);

  const handleOpenBadge = (badge: VaccineBadge) => {
    setSelectedBadge(badge);
    const existing = appliedVaccines?.[badge.id];
    if (existing) {
      setInputDate(existing.appliedAt ? existing.appliedAt.split('T')[0] : new Date().toISOString().split('T')[0]);
      setInputNotes(existing.notes || '');
      setInputReactions(existing.reactions || '');
    } else {
      // Default to today or recommended vaccine date if profile is set
      setInputDate(new Date().toISOString().split('T')[0]);
      setInputNotes('');
      setInputReactions('');
    }
  };

  const handleToggleApply = async () => {
    if (!selectedBadge) return;
    const isCurrentlyApplied = !!appliedVaccines?.[selectedBadge.id]?.applied;

    if (isCurrentlyApplied) {
      // Confirm unapply
      if (window.confirm(`¿Quieres re-bloquear la ${selectedBadge.name} en el medallero? Se borrará su historial de aplicación.`)) {
        await unapplyVaccine(selectedBadge.id);
        setSelectedBadge(null);
      }
    } else {
      // Save application
      await applyVaccine(selectedBadge.id, inputDate, inputNotes, inputReactions);
      
      // Blast confetti from corners
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']
      });

      setSelectedBadge(null);
    }
  };

  return (
    <div className="space-y-6" id="vaccine-badge-case-section">
      {/* Intro official card */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-2/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest bg-indigo-500/20 border border-indigo-400/30 text-indigo-200">
                LIGA DE LA SALUD • IMSS
              </span>
              <span className="text-sm">🏥</span>
            </div>
            <h2 className="text-2xl font-serif font-black tracking-tight text-indigo-50">
              Estuche de Medallas de {profile.name}
            </h2>
            <p className="text-indigo-200 text-xs md:text-sm max-w-md font-medium leading-relaxed">
              {rank.desc}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-4 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/5">
            <div className="relative w-16 h-16 rounded-full border-4 border-amber-400/40 flex items-center justify-center bg-indigo-950 font-serif font-bold text-lg text-amber-300">
              {porcentajeConseguido}%
              {/* Radial glow */}
              <div className="absolute inset-0 rounded-full bg-amber-400/5 animate-pulse" />
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-indigo-300 uppercase font-black tracking-wider-md">RANGO ACTUAL</p>
              <h4 className="text-sm font-bold text-amber-300 flex items-center gap-1.5 leading-none">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                {rank.title}
              </h4>
              <p className="text-xs text-indigo-200">{medallasConseguidas} de {medallasTotales} medallas ganadas</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 space-y-1.5 relative z-10">
          <div className="flex justify-between text-[11px] text-indigo-200 font-semibold uppercase">
            <span>Progreso del Esquema de Vacunación</span>
            <span>{medallasConseguidas}/{medallasTotales} Dosis</span>
          </div>
          <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${porcentajeConseguido}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 shadow-glow" 
            />
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5 bg-gray-100 dark:bg-gray-800/60 p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
        <button
          onClick={() => setFilterMode('all')}
          className={cn(
            "flex-1 min-w-[80px] py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5",
            filterMode === 'all'
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-bold active:scale-95"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          )}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Esquema Completo</span>
        </button>
        <button
          onClick={() => setFilterMode('completed')}
          className={cn(
            "flex-1 min-w-[80px] py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5",
            filterMode === 'completed'
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-bold active:scale-95"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          )}
        >
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>Ganadas ({medallasConseguidas})</span>
        </button>
        <button
          onClick={() => setFilterMode('pending')}
          className={cn(
            "flex-1 min-w-[80px] py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5",
            filterMode === 'pending'
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-bold active:scale-95"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          )}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Pendientes</span>
        </button>
        <button
          onClick={() => setFilterMode('due')}
          className={cn(
            "flex-1 min-w-[80px] py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5",
            filterMode === 'due'
              ? "bg-rose-500 text-white shadow-sm font-bold active:scale-95"
              : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          )}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>¡Por Edad ya toca!</span>
        </button>
      </div>

      {/* Grid of Badges */}
      <motion.div 
        layout
        className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-4 p-5 bg-gray-50 dark:bg-gray-900/40 rounded-3xl border border-gray-150 dark:border-gray-800/80 min-h-[250px]"
      >
        <AnimatePresence mode="popLayout">
          {filteredBadges.map((badge) => {
            const isApplied = !!appliedVaccines?.[badge.id]?.applied;
            const record = appliedVaccines?.[badge.id];
            const isUrgent = !isApplied && badge.recommendedAgeNum <= ageInMonths;

            return (
              <motion.div
                layout
                key={badge.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleOpenBadge(badge)}
                className={cn(
                  "relative flex flex-col items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-gray-800 border text-center transition-all duration-300 cursor-pointer shadow-sm group select-none",
                  isApplied
                    ? "border-emerald-500/20 dark:border-emerald-500/30 hover:border-emerald-500/40 hover:-translate-y-1 bg-gradient-to-b from-white to-green-50/10 dark:from-gray-800 dark:to-green-950/5"
                    : isUrgent
                      ? "border-rose-450 dark:border-rose-800/60 hover:-translate-y-1 bg-rose-50/20 dark:bg-rose-950/5 animate-pulse-slow shadow-rose-500/5"
                      : "border-gray-250 dark:border-gray-700/85 hover:border-gray-350 dark:hover:border-gray-600"
                )}
              >
                {/* Age Badge Top corner */}
                <span className={cn(
                  "absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none select-none",
                  isApplied
                    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                    : isUrgent
                      ? "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                )}>
                  {badge.recommendedAgeLabel}
                </span>

                {/* Star visual or trophy visual for completed badge */}
                {isApplied && (
                  <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}

                {/* Gym badge circle / case view */}
                <div className="mt-4 mb-3 flex items-center justify-center">
                  {isApplied ? (
                    /* Bright, beautiful pokemon style active badge */
                    <div className={cn(
                      "w-16 h-16 rounded-full bg-gradient-to-tr flex items-center justify-center text-4xl shadow-md border-4 border-white/90 dark:border-gray-800/90 relative overflow-hidden transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-6",
                      badge.badgeTheme.gradient,
                      badge.badgeTheme.shadow
                    )}>
                      {badge.badgeTheme.icon}
                      {/* Metallic shine reflection effect */}
                      <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/30 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>
                  ) : (
                    /* Locked, sunken metal case slot */
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 border-dashed border-gray-300 dark:border-gray-600/70 bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 relative overflow-hidden",
                      isUrgent && "border-rose-300 dark:border-rose-950 bg-rose-50/10 dark:bg-rose-950/20 text-rose-300 dark:text-rose-950"
                    )}>
                      {badge.badgeTheme.icon}
                      {/* Lock overlay icon */}
                      <div className="absolute inset-0 bg-gray-400/10 backdrop-grayscale flex items-center justify-center rounded-full opacity-100 group-hover:opacity-70 transition-opacity">
                        <span className="text-xs">🔒</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Name / info */}
                <div className="space-y-0.5">
                  <h4 className={cn(
                    "text-xs font-black tracking-tight uppercase leading-none",
                    isApplied ? "text-gray-800 dark:text-gray-150" : "text-gray-400 dark:text-gray-600"
                  )}>
                    {badge.name}
                  </h4>
                  <p className={cn(
                    "text-[10px] font-bold truncate max-w-full leading-tight",
                    isApplied ? badge.badgeTheme.textColor : "text-gray-400 dark:text-gray-500"
                  )}>
                    {badge.dose}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium italic mt-0.5 max-w-[120px] truncate">
                    {isApplied ? badge.badgeTheme.name : "Bloqueada"}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredBadges.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center space-y-4">
            <span className="text-5xl text-gray-400">🏅</span>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-700 dark:text-gray-200">No hay medallas en este estante</h4>
              <p className="text-xs max-w-xs text-gray-500 leading-relaxed mx-auto">
                {filterMode === 'completed' && "Aún no has registrado ninguna medalla aplicada. Haz clic en una medalla del estante de 'Esquema Completo' para registrarla."}
                {filterMode === 'pending' && "¡Increíble! Has ganado todas las medallas del medallero. ¡Esquema completo alcanzado!"}
                {filterMode === 'due' && "¡Buen trabajo! Tu bebé está completamente al día con sus vacunas según su edad actual de meses."}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Details / apply dialog sheet */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-150 dark:border-gray-700 relative max-h-[92vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedBadge(null)} 
                className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Vaccine Badge Header */}
              <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-5 mb-5 mt-2">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center text-4xl border-3 border-white dark:border-gray-800 shadow-md transform -rotate-6 scale-105",
                  appliedVaccines?.[selectedBadge.id]?.applied
                    ? selectedBadge.badgeTheme.gradient
                    : "bg-slate-100 dark:bg-slate-700 text-slate-350 dark:text-slate-500"
                )}>
                  {selectedBadge.badgeTheme.icon}
                </div>

                <div className="space-y-0.5">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white",
                    appliedVaccines?.[selectedBadge.id]?.applied
                      ? "bg-emerald-500"
                      : "bg-slate-400 dark:bg-slate-600"
                  )}>
                    {appliedVaccines?.[selectedBadge.id]?.applied ? "GANADA!" : "PENDIENTE"}
                  </span>
                  <h3 className="text-xl font-serif font-black text-gray-900 dark:text-white leading-tight">
                    Medalla {selectedBadge.name}
                  </h3>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {selectedBadge.dose} ({selectedBadge.badgeTheme.name})
                  </p>
                </div>
              </div>

              {/* Vaccine info body */}
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Activity className="w-4 h-4 text-theme-dark dark:text-theme-base shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Inmunidad que otorga</p>
                      <p className="text-xs mt-1 font-medium leading-relaxed">{selectedBadge.diseases}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 border-t border-gray-150 dark:border-gray-800 pt-2.5">
                    <Calendar className="w-4 h-4 text-theme-dark dark:text-theme-base shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Edad de vacunación ideal</p>
                      <p className="text-xs mt-1 font-semibold">{selectedBadge.recommendedAgeLabel}</p>
                    </div>
                  </div>
                </div>

                {/* Form to check as applied or details of application */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Fecha de Aplicación</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="date"
                        value={inputDate}
                        onChange={(e) => setInputDate(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Reacciones o Fiebre (Opcional)</label>
                      <input 
                        type="text"
                        value={inputReactions}
                        placeholder="Ej. Fiebre leve 1 día, somnolencia"
                        onChange={(e) => setInputReactions(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Notas, Lote o Clínica (Opcional)</label>
                      <textarea 
                        value={inputNotes}
                        rows={2}
                        placeholder="Ej. Clínica San Jose, Lote X34, pediatra Dr. Gomez"
                        onChange={(e) => setInputNotes(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons controls */}
                <div className="flex gap-3 border-t border-gray-100 dark:border-gray-700 pt-5 mt-5">
                  <button
                    onClick={() => setSelectedBadge(null)}
                    className="flex-1 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl transition-all"
                  >
                    Salir
                  </button>

                  <button
                    onClick={handleToggleApply}
                    className={cn(
                      "flex-2 py-3 px-4 rounded-xl text-sm font-serif font-bold text-white shadow-md flex items-center justify-center gap-1.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0",
                      appliedVaccines?.[selectedBadge.id]?.applied
                        ? "bg-gradient-to-r from-amber-500 to-red-650 hover:opacity-90 shadow-red-500/10"
                        : "bg-gradient-to-r from-emerald-500 to-teal-650 hover:opacity-95 shadow-emerald-500/10"
                    )}
                  >
                    {appliedVaccines?.[selectedBadge.id]?.applied ? (
                      <>
                        <RotateCcw className="w-4 h-4 shrink-0" />
                        <span>Re-bloquear Medalla</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>¡Ganar Medalla!</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
