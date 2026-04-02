import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, auth } from './firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

import { TimelineEntry, MedicalRecord, PendingQuestion } from './types';

export type EventType = 'feeding' | 'burp' | 'hygiene' | 'sleep' | 'bath';

export interface BabyEvent {
  id: string;
  type: EventType;
  timestamp: number;
  endTimestamp?: number;
  details?: {
    amount?: number; // oz for feeding
    hygieneType?: 'pee' | 'poo' | 'constipation';
    level?: 'poco' | 'medio' | 'lleno';
    texture?: 'liquido' | 'viscoso' | 'pastoso' | 'duro' | 'diarrea';
    photoUrl?: string; // base64 photo of the poop
  };
  notes?: string;
  authorId?: string;
}

export type ThemeColor = 'blue' | 'pink' | 'mint' | 'yellow' | 'lavender';
export type ColorMode = 'system' | 'light' | 'dark';

export interface MedicalCondition {
  name: string;
  diagnosisAge: string;
  diagnosisAgeUnit?: 'meses' | 'años' | '';
  treatment: string;
}

export interface MedicalHistory {
  alergias: MedicalCondition;
  discapacidad: MedicalCondition;
  malformaciones: MedicalCondition;
  cirugias: MedicalCondition;
  tuberculosis: MedicalCondition;
  otras: MedicalCondition;
}

export interface ScreeningTest {
  dueDate: string; // YYYY-MM-DD
  applied: boolean;
  comments: string;
}

export interface ScreeningHistory {
  metabolico: ScreeningTest;
  auditivo: ScreeningTest;
  oftalmologico: ScreeningTest;
  cardiaco: ScreeningTest;
  cadera: ScreeningTest;
}

export interface CompletedMilestone {
  id: string;
  timestamp: number;
  evidenceUrl?: string;
}

export interface BabyProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  photoUrl?: string;
  birthType?: 'cesarea' | 'natural' | '';
  birthLength?: number;
  birthLengthUnit?: 'cm' | 'in';
  birthWeight?: number;
  birthWeightUnit?: 'kg' | 'lb';
  pregnancyComplications?: 'si' | 'no' | '';
  birthComplications?: 'si' | 'no' | '';
  medicalHistory?: MedicalHistory;
  screeningHistory?: ScreeningHistory;
}

interface AppState {
  familyId: string | null;
  events: BabyEvent[];
  activeFeeding: { startTime: number } | null;
  activeSleep: { startTime: number } | null;
  profile: BabyProfile;
  theme: ThemeColor;
  colorMode: ColorMode;
  completedMilestones: Record<string, CompletedMilestone>;
  activeAlarms: string[];
  
  // Bitacora State
  timelineEntries: TimelineEntry[];
  medicalRecords: MedicalRecord[];
  pendingQuestions: PendingQuestion[];
  
  // Actions
  setFamilyId: (id: string | null) => void;
  setEvents: (events: BabyEvent[]) => void;
  setProfile: (profile: BabyProfile) => void;
  setCompletedMilestones: (milestones: Record<string, CompletedMilestone>) => void;
  setActiveAlarms: (alarms: string[]) => void;
  setTimelineEntries: (entries: TimelineEntry[]) => void;
  setMedicalRecords: (records: MedicalRecord[]) => void;
  setPendingQuestions: (questions: PendingQuestion[]) => void;
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
  setColorMode: (mode: ColorMode) => void;

  completeMilestone: (id: string, evidenceUrl?: string) => Promise<void>;
  removeMilestone: (id: string) => Promise<void>;
  removeMilestoneEvidence: (id: string) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  
  // Bitacora Actions
  addTimelineEntry: (entry: Omit<TimelineEntry, 'id'>) => Promise<void>;
  updateTimelineEntry: (id: string, entry: Partial<TimelineEntry>) => Promise<void>;
  deleteTimelineEntry: (id: string) => Promise<void>;
  addMedicalRecord: (record: Omit<MedicalRecord, 'id'>) => Promise<void>;
  addPendingQuestion: (question: Omit<PendingQuestion, 'id'>) => Promise<void>;
  togglePendingQuestion: (id: string) => Promise<void>;
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
      colorMode: 'system',
      completedMilestones: {},
      activeAlarms: [],
      timelineEntries: [],
      medicalRecords: [],
      pendingQuestions: [],

      setFamilyId: (id) => set({ familyId: id }),
      setEvents: (events) => set({ events }),
      setProfile: (profile) => set({ profile }),
      setCompletedMilestones: (milestones) => set({ completedMilestones: milestones }),
      setActiveAlarms: (alarms) => set({ activeAlarms: alarms }),
      setTimelineEntries: (entries) => set({ timelineEntries: entries }),
      setMedicalRecords: (records) => set({ medicalRecords: records }),
      setPendingQuestions: (questions) => set({ pendingQuestions: questions }),
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
            const firestoreEvent = JSON.parse(JSON.stringify(newEvent));
            await setDoc(doc(db, `families/${familyId}/events/${newId}`), firestoreEvent);
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
            const firestoreUpdate = JSON.parse(JSON.stringify(updatedEvent));
            await updateDoc(doc(db, `families/${familyId}/events/${id}`), firestoreUpdate);
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
          set({ activeFeeding: null });
          addEvent({
            type: 'feeding',
            timestamp: activeFeeding.startTime,
            endTimestamp: Date.now(),
            details: { amount },
            notes
          });

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
          set({ activeSleep: null });
          addEvent({
            type: 'sleep',
            timestamp: activeSleep.startTime,
            endTimestamp: Date.now(),
            notes
          });

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
            const firestoreProfile = JSON.parse(JSON.stringify(newProfile));
            await updateDoc(doc(db, `families/${familyId}`), { babyProfile: firestoreProfile });
          } catch (error) {
            console.error("Error updating profile", error);
          }
        }
      },

      setTheme: (theme) => set({ theme }),
      setColorMode: (mode) => set({ colorMode: mode }),

      completeMilestone: async (id, evidenceUrl) => {
        const { familyId, completedMilestones } = get();
        const newMilestone: CompletedMilestone = {
          id,
          timestamp: Date.now(),
        };
        if (evidenceUrl) {
          newMilestone.evidenceUrl = evidenceUrl;
        }
        const newMilestones = { ...completedMilestones, [id]: newMilestone };
        set({ completedMilestones: newMilestones });

        if (familyId && auth.currentUser) {
          try {
            const firestoreMilestones = JSON.parse(JSON.stringify(newMilestones));
            await updateDoc(doc(db, `families/${familyId}`), { completedMilestones: firestoreMilestones });
          } catch (error) {
            console.error("Error updating milestones", error);
          }
        }
      },

      removeMilestone: async (id) => {
        const { familyId, completedMilestones } = get();
        if (!completedMilestones[id]) return;
        
        const newMilestones = { ...completedMilestones };
        delete newMilestones[id];
        
        set({ completedMilestones: newMilestones });

        if (familyId && auth.currentUser) {
          try {
            const firestoreMilestones = JSON.parse(JSON.stringify(newMilestones));
            await updateDoc(doc(db, `families/${familyId}`), { completedMilestones: firestoreMilestones });
          } catch (error) {
            console.error("Error updating milestones", error);
          }
        }
      },

      removeMilestoneEvidence: async (id) => {
        const { familyId, completedMilestones } = get();
        if (!completedMilestones[id]) return;
        
        const newMilestone = { ...completedMilestones[id] };
        delete newMilestone.evidenceUrl;
        
        const newMilestones = { ...completedMilestones, [id]: newMilestone };
        set({ completedMilestones: newMilestones });

        if (familyId && auth.currentUser) {
          try {
            const firestoreMilestones = JSON.parse(JSON.stringify(newMilestones));
            await updateDoc(doc(db, `families/${familyId}`), { completedMilestones: firestoreMilestones });
          } catch (error) {
            console.error("Error updating milestones", error);
          }
        }
      },

      toggleAlarm: async (id) => {
        const { familyId, activeAlarms } = get();
        let newAlarms = [...activeAlarms];
        if (newAlarms.includes(id)) {
          newAlarms = newAlarms.filter(a => a !== id);
        } else {
          newAlarms.push(id);
        }
        set({ activeAlarms: newAlarms });

        if (familyId && auth.currentUser) {
          try {
            await updateDoc(doc(db, `families/${familyId}`), { activeAlarms: newAlarms });
          } catch (error) {
            console.error("Error updating alarms", error);
          }
        }
      },

      addTimelineEntry: async (entry) => {
        const { familyId } = get();
        const newId = crypto.randomUUID();
        const newEntry = { ...entry, id: newId };
        
        set((state) => ({ timelineEntries: [newEntry, ...state.timelineEntries] }));

        if (familyId && auth.currentUser) {
          try {
            const firestoreEntry = JSON.parse(JSON.stringify(newEntry));
            await setDoc(doc(db, `families/${familyId}/timelineEntries/${newId}`), firestoreEntry);
          } catch (error) {
            console.error("Error adding timeline entry", error);
          }
        }
      },

      updateTimelineEntry: async (id, updatedEntry) => {
        const { familyId } = get();
        
        set((state) => ({
          timelineEntries: state.timelineEntries.map(e => e.id === id ? { ...e, ...updatedEntry } : e)
        }));

        if (familyId && auth.currentUser) {
          try {
            const firestoreUpdate = JSON.parse(JSON.stringify(updatedEntry));
            await updateDoc(doc(db, `families/${familyId}/timelineEntries/${id}`), firestoreUpdate);
          } catch (error) {
            console.error("Error updating timeline entry", error);
          }
        }
      },

      deleteTimelineEntry: async (id) => {
        const { familyId } = get();
        
        set((state) => ({
          timelineEntries: state.timelineEntries.filter(e => e.id !== id)
        }));

        if (familyId && auth.currentUser) {
          try {
            await deleteDoc(doc(db, `families/${familyId}/timelineEntries/${id}`));
          } catch (error) {
            console.error("Error deleting timeline entry", error);
          }
        }
      },

      addMedicalRecord: async (record) => {
        const { familyId } = get();
        const newId = crypto.randomUUID();
        const newRecord = { ...record, id: newId };
        
        set((state) => ({ medicalRecords: [newRecord, ...state.medicalRecords] }));

        if (familyId && auth.currentUser) {
          try {
            const firestoreRecord = JSON.parse(JSON.stringify(newRecord));
            await setDoc(doc(db, `families/${familyId}/medicalRecords/${newId}`), firestoreRecord);
          } catch (error) {
            console.error("Error adding medical record", error);
          }
        }
      },

      addPendingQuestion: async (question) => {
        const { familyId } = get();
        const newId = crypto.randomUUID();
        const newQuestion = { ...question, id: newId };
        
        set((state) => ({ pendingQuestions: [...state.pendingQuestions, newQuestion] }));

        if (familyId && auth.currentUser) {
          try {
            const firestoreQuestion = JSON.parse(JSON.stringify(newQuestion));
            await setDoc(doc(db, `families/${familyId}/pendingQuestions/${newId}`), firestoreQuestion);
          } catch (error) {
            console.error("Error adding pending question", error);
          }
        }
      },

      togglePendingQuestion: async (id) => {
        const { familyId, pendingQuestions } = get();
        const updatedQuestions = pendingQuestions.map(q => 
          q.id === id ? { ...q, isAnswered: !q.isAnswered } : q
        );
        
        set({ pendingQuestions: updatedQuestions });

        if (familyId && auth.currentUser) {
          try {
            const questionToUpdate = updatedQuestions.find(q => q.id === id);
            if (questionToUpdate) {
              await updateDoc(doc(db, `families/${familyId}/pendingQuestions/${id}`), {
                isAnswered: questionToUpdate.isAnswered
              });
            }
          } catch (error) {
            console.error("Error toggling pending question", error);
          }
        }
      },
    }),
    {
      name: 'boyita-storage',
    }
  )
);
