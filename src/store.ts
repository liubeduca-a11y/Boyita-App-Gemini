import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, auth } from './firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

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
  authorId?: string;
}

export type ThemeColor = 'blue' | 'pink' | 'mint' | 'yellow' | 'lavender';

export interface BabyProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  photoUrl?: string;
}

interface AppState {
  familyId: string | null;
  events: BabyEvent[];
  activeFeeding: { startTime: number } | null;
  activeSleep: { startTime: number } | null;
  profile: BabyProfile;
  theme: ThemeColor;
  
  // Actions
  setFamilyId: (id: string | null) => void;
  setEvents: (events: BabyEvent[]) => void;
  setProfile: (profile: BabyProfile) => void;
  setActiveFeeding: (active: { startTime: number } | null) => void;
  setActiveSleep: (active: { startTime: number } | null) => void;

  addEvent: (event: Omit<BabyEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<BabyEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  
  startFeeding: () => Promise<void>;
  stopFeeding: (amount: number, notes?: string) => Promise<void>;
  
  startSleep: () => Promise<void>;
  stopSleep: (notes?: string) => Promise<void>;
  
  updateProfile: (profile: Partial<BabyProfile>) => Promise<void>;
  setTheme: (theme: ThemeColor) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      familyId: null,
      events: [],
      activeFeeding: null,
      activeSleep: null,
      profile: {
        name: 'Mi Bebé',
        birthDate: new Date().toISOString().split('T')[0],
      },
      theme: 'blue',

      setFamilyId: (id) => set({ familyId: id }),
      setEvents: (events) => set({ events }),
      setProfile: (profile) => set({ profile }),
      setActiveFeeding: (activeFeeding) => set({ activeFeeding }),
      setActiveSleep: (activeSleep) => set({ activeSleep }),

      addEvent: async (event) => {
        const { familyId } = get();
        const newId = crypto.randomUUID();
        const newEvent = { ...event, id: newId, authorId: auth.currentUser?.uid || 'local' };
        
        // Optimistic update
        set((state) => ({ events: [newEvent, ...state.events] }));

        if (familyId && auth.currentUser) {
          try {
            await setDoc(doc(db, `families/${familyId}/events/${newId}`), newEvent);
          } catch (error) {
            console.error("Error adding event to Firebase", error);
          }
        }
      },

      updateEvent: async (id, updatedEvent) => {
        const { familyId } = get();
        
        // Optimistic update
        set((state) => ({
          events: state.events.map(e => e.id === id ? { ...e, ...updatedEvent } : e)
        }));

        if (familyId && auth.currentUser) {
          try {
            await updateDoc(doc(db, `families/${familyId}/events/${id}`), updatedEvent);
          } catch (error) {
            console.error("Error updating event in Firebase", error);
          }
        }
      },

      deleteEvent: async (id) => {
        const { familyId } = get();
        
        // Optimistic update
        set((state) => ({
          events: state.events.filter(e => e.id !== id)
        }));

        if (familyId && auth.currentUser) {
          try {
            await deleteDoc(doc(db, `families/${familyId}/events/${id}`));
          } catch (error) {
            console.error("Error deleting event from Firebase", error);
          }
        }
      },

      startFeeding: async () => {
        const { familyId } = get();
        const activeFeeding = { startTime: Date.now() };
        set({ activeFeeding });

        if (familyId && auth.currentUser) {
          try {
            await updateDoc(doc(db, `families/${familyId}`), { activeFeeding });
          } catch (error) {
            console.error("Error starting feeding", error);
          }
        }
      },
      
      stopFeeding: async (amount, notes) => {
        const { activeFeeding, addEvent, familyId } = get();
        if (activeFeeding) {
          await addEvent({
            type: 'feeding',
            timestamp: activeFeeding.startTime,
            endTimestamp: Date.now(),
            details: { amount },
            notes
          });
          set({ activeFeeding: null });

          if (familyId && auth.currentUser) {
            try {
              await updateDoc(doc(db, `families/${familyId}`), { activeFeeding: null });
            } catch (error) {
              console.error("Error stopping feeding", error);
            }
          }
        }
      },

      startSleep: async () => {
        const { familyId } = get();
        const activeSleep = { startTime: Date.now() };
        set({ activeSleep });

        if (familyId && auth.currentUser) {
          try {
            await updateDoc(doc(db, `families/${familyId}`), { activeSleep });
          } catch (error) {
            console.error("Error starting sleep", error);
          }
        }
      },
      
      stopSleep: async (notes) => {
        const { activeSleep, addEvent, familyId } = get();
        if (activeSleep) {
          await addEvent({
            type: 'sleep',
            timestamp: activeSleep.startTime,
            endTimestamp: Date.now(),
            notes
          });
          set({ activeSleep: null });

          if (familyId && auth.currentUser) {
            try {
              await updateDoc(doc(db, `families/${familyId}`), { activeSleep: null });
            } catch (error) {
              console.error("Error stopping sleep", error);
            }
          }
        }
      },

      updateProfile: async (profile) => {
        const { familyId, profile: currentProfile } = get();
        const newProfile = { ...currentProfile, ...profile };
        set({ profile: newProfile });

        if (familyId && auth.currentUser) {
          try {
            await updateDoc(doc(db, `families/${familyId}`), { babyProfile: newProfile });
          } catch (error) {
            console.error("Error updating profile", error);
          }
        }
      },

      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'boyita-storage',
    }
  )
);
