import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EventType = 'feeding' | 'burp' | 'hygiene' | 'sleep';

export interface BabyEvent {
  id: string;
  type: EventType;
  timestamp: number;
  endTimestamp?: number;
  details?: {
    amount?: number; // oz for feeding
    hygieneType?: 'pee' | 'poo';
    level?: 'poco' | 'mucho' | 'lleno';
    texture?: 'liquido' | 'pastoso' | 'duro';
  };
  notes?: string;
}

export type ThemeColor = 'blue' | 'pink' | 'mint' | 'yellow' | 'lavender';

export interface BabyProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  photoUrl?: string;
}

interface AppState {
  events: BabyEvent[];
  activeFeeding: { startTime: number } | null;
  activeSleep: { startTime: number } | null;
  profile: BabyProfile;
  theme: ThemeColor;
  
  // Actions
  addEvent: (event: Omit<BabyEvent, 'id'>) => void;
  updateEvent: (id: string, event: Partial<BabyEvent>) => void;
  deleteEvent: (id: string) => void;
  
  startFeeding: () => void;
  stopFeeding: (amount: number, notes?: string) => void;
  
  startSleep: () => void;
  stopSleep: (notes?: string) => void;
  
  updateProfile: (profile: Partial<BabyProfile>) => void;
  setTheme: (theme: ThemeColor) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      events: [],
      activeFeeding: null,
      activeSleep: null,
      profile: {
        name: 'Mi Bebé',
        birthDate: new Date().toISOString().split('T')[0],
      },
      theme: 'blue',

      addEvent: (event) => set((state) => ({
        events: [{ ...event, id: crypto.randomUUID() }, ...state.events]
      })),

      updateEvent: (id, updatedEvent) => set((state) => ({
        events: state.events.map(e => e.id === id ? { ...e, ...updatedEvent } : e)
      })),

      deleteEvent: (id) => set((state) => ({
        events: state.events.filter(e => e.id !== id)
      })),

      startFeeding: () => set({ activeFeeding: { startTime: Date.now() } }),
      
      stopFeeding: (amount, notes) => {
        const { activeFeeding, addEvent } = get();
        if (activeFeeding) {
          addEvent({
            type: 'feeding',
            timestamp: activeFeeding.startTime,
            endTimestamp: Date.now(),
            details: { amount },
            notes
          });
          set({ activeFeeding: null });
        }
      },

      startSleep: () => set({ activeSleep: { startTime: Date.now() } }),
      
      stopSleep: (notes) => {
        const { activeSleep, addEvent } = get();
        if (activeSleep) {
          addEvent({
            type: 'sleep',
            timestamp: activeSleep.startTime,
            endTimestamp: Date.now(),
            notes
          });
          set({ activeSleep: null });
        }
      },

      updateProfile: (profile) => set((state) => ({
        profile: { ...state.profile, ...profile }
      })),

      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'boyita-storage',
    }
  )
);
