import React, { useState, useRef } from 'react';
import { useStore, ThemeColor } from '../store';
import { Camera, Save, Palette, User, Calendar } from 'lucide-react';
import { cn } from '../components/Layout';
import { differenceInMonths, differenceInDays } from 'date-fns';

const THEMES: { id: ThemeColor; name: string; color: string }[] = [
  { id: 'blue', name: 'Azul Pastel', color: '#AEC6CF' },
  { id: 'pink', name: 'Rosa Pastel', color: '#FFB7B2' },
  { id: 'mint', name: 'Verde Menta', color: '#B2E2F2' },
  { id: 'yellow', name: 'Amarillo Crema', color: '#FFFFCC' },
  { id: 'lavender', name: 'Lavanda', color: '#E6E6FA' },
];

export function Settings() {
  const { profile, updateProfile, theme, setTheme } = useStore();
  const [name, setName] = useState(profile.name);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSaveProfile = () => {
    updateProfile({ name, birthDate, photoUrl });
    alert('Perfil guardado correctamente');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pb-8">
      <h2 className="text-2xl font-bold text-gray-800">Ajustes</h2>

      {/* Perfil del Bebé */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-theme-light rounded-xl text-theme-dark">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Perfil del Bebé</h3>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-theme-light overflow-hidden shadow-inner">
              {photoUrl ? (
                <img src={photoUrl} alt="Bebé" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">👶</div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-theme-base text-white rounded-full shadow-md hover:bg-theme-dark transition-colors"
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
            <p className="mt-3 text-sm font-medium text-theme-dark bg-theme-light px-3 py-1 rounded-full">
              Edad: {calculateAge()}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-all"
              placeholder="Nombre del bebé"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
            <div className="relative">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-base outline-none transition-all"
              />
              <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>
          <button
            onClick={handleSaveProfile}
            className="w-full py-3 mt-2 bg-theme-dark text-white rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-opacity-90 transition-all"
          >
            <Save className="w-5 h-5" />
            <span>Guardar Perfil</span>
          </button>
        </div>
      </div>

      {/* Sistema de Temas */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-theme-light rounded-xl text-theme-dark">
            <Palette className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Apariencia</h3>
        </div>

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
                  theme === t.id ? "border-gray-800 shadow-md" : "border-transparent"
                )}
                style={{ backgroundColor: t.color }}
              />
              <span className={cn(
                "text-[10px] font-medium text-center leading-tight",
                theme === t.id ? "text-gray-900" : "text-gray-500"
              )}>
                {t.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
