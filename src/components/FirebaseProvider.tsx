import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, writeBatch, getDocs } from 'firebase/firestore';
import { useStore, BabyEvent } from '../store';
import { TimelineEntry, MedicalRecord, PendingQuestion } from '../types';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { setFamilyId, setEvents, setProfile, setActiveFeeding, setActiveSleep, setCompletedMilestones, setActiveAlarms, setTimelineEntries, setMedicalRecords, setPendingQuestions, profile } = useStore();
  const familyId = useStore(state => state.familyId);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user exists in DB
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef).catch(e => { console.error("Error on getDoc check users:", e); throw e; });
          
          let currentFamilyId = user.uid;

          if (!userSnap.exists()) {
            // Create new user and family
            await setDoc(userRef, {
              familyId: currentFamilyId,
              email: user.email || '',
              name: user.displayName || 'Usuario'
            }).catch(e => { console.error("Error on setDoc users:", e); throw e; });

            const state = useStore.getState();

            await setDoc(doc(db, 'families', currentFamilyId), {
              members: [user.uid],
              babyProfile: state.profile || null, // use current local profile
              activeFeeding: state.activeFeeding || null,
              activeSleep: state.activeSleep || null,
              completedMilestones: state.completedMilestones || [],
              activeAlarms: state.activeAlarms || []
            }).catch(e => { console.error("Error on setDoc families:", e); throw e; });

            // Migrate local events to Firestore
            if (state.events.length > 0) {
              const batch = writeBatch(db);
              state.events.forEach(event => {
                const eventRef = doc(db, `families/${currentFamilyId}/events/${event.id}`);
                const cleanEvent = JSON.parse(JSON.stringify({ ...event, authorId: user.uid }));
                batch.set(eventRef, cleanEvent);
              });
              await batch.commit().catch(e => { console.error("Error on writeBatch migrate events:", e); throw e; });
            }
          } else {
            currentFamilyId = userSnap.data().familyId;
            
            if (!currentFamilyId) {
              currentFamilyId = user.uid;
              await updateDoc(userRef, { familyId: currentFamilyId }).catch(e => { console.error("Error on updateDoc users currentFamilyId:", e); throw e; });
            }
            
            // Ensure family document exists even if user existed before
            const familyRef = doc(db, 'families', currentFamilyId);
            const familySnap = await getDoc(familyRef).catch(e => { console.error("Error on getDoc familyRef:", e); throw e; });
            if (!familySnap.exists()) {
              const state = useStore.getState();
              await setDoc(familyRef, {
                members: [user.uid],
                babyProfile: state.profile || null,
                activeFeeding: state.activeFeeding || null,
                activeSleep: state.activeSleep || null,
                completedMilestones: state.completedMilestones || [],
                activeAlarms: state.activeAlarms || []
              }).catch(e => { console.error("Error on setDoc new family for existing user:", e); throw e; });
            }
          }

          setFamilyId(currentFamilyId);
          setIsAuthReady(true);
        } catch (error) {
          console.error("Error setting up user data:", error);
          setIsAuthReady(true); // Still set ready to not block UI
        }
      } else {
        setFamilyId(null);
        setIsAuthReady(true);
      }
    });

    return () => unsubscribeAuth();
  }, [setFamilyId]);

  useEffect(() => {
    if (!isAuthReady || !familyId || !auth.currentUser) return;

    // Sync missing local events to Firestore (fixes independent records issue)
    const syncMissingEvents = async () => {
      try {
        const localEvents = useStore.getState().events;
        if (localEvents.length === 0) return;
        
        const q = query(collection(db, `families/${familyId}/events`));
        const snap = await getDocs(q);
        const firestoreIds = new Set(snap.docs.map(d => d.id));
        
        const missing = localEvents.filter(e => !firestoreIds.has(e.id));
        if (missing.length > 0) {
          const batch = writeBatch(db);
          missing.forEach(event => {
            const eventRef = doc(db, `families/${familyId}/events/${event.id}`);
            const cleanEvent = JSON.parse(JSON.stringify({ ...event, authorId: auth.currentUser!.uid }));
            batch.set(eventRef, cleanEvent);
          });
          await batch.commit();
        }
      } catch (error) {
        console.error("Error syncing missing events:", error);
      }
    };
    
    syncMissingEvents();

    // Listen to family document (profile, active states)
    const unsubFamily = onSnapshot(doc(db, 'families', familyId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.babyProfile) setProfile(data.babyProfile);
        if (data.activeFeeding !== undefined) setActiveFeeding(data.activeFeeding);
        if (data.activeSleep !== undefined) setActiveSleep(data.activeSleep);
        if (data.completedMilestones) setCompletedMilestones(data.completedMilestones);
        if (data.activeAlarms) setActiveAlarms(data.activeAlarms);
      }
    }, (error) => {
      console.error(`Error in family snapshot for familyId ${familyId}:`, error);
    });

    // Listen to events
    const q = query(collection(db, `families/${familyId}/events`));
    const unsubEvents = onSnapshot(q, (querySnapshot) => {
      const events: BabyEvent[] = [];
      querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as BabyEvent);
      });
      // Sort in memory to avoid needing a composite index immediately
      events.sort((a, b) => b.timestamp - a.timestamp);
      setEvents(events);
    }, (error) => {
      console.error(`Error in events snapshot for familyId ${familyId}:`, error);
    });

    // Listen to timeline entries
    const unsubTimeline = onSnapshot(collection(db, `families/${familyId}/timelineEntries`), (snap) => {
      const entries: TimelineEntry[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        let dateStr = data.date;
        if (dateStr && typeof dateStr.toDate === 'function') {
          dateStr = dateStr.toDate().toISOString();
        }
        let text = data.text;
        if (!text && (data.type || data.detail || data.notes)) {
           const typeStr = data.type ? `[${data.type.toUpperCase()}] ` : '';
           const detailStr = data.detail ? `${data.detail} ` : '';
           const notesStr = data.notes ? `\nNotas: ${data.notes}` : '';
           text = `${typeStr}${detailStr}${notesStr}`.trim();
        }
        entries.push({ id: doc.id, ...data, date: dateStr, text: text || '' } as TimelineEntry);
      });
      entries.sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (isNaN(timeA) && isNaN(timeB)) return 0;
        if (isNaN(timeA)) return 1;
        if (isNaN(timeB)) return -1;
        return timeB - timeA;
      });
      setTimelineEntries(entries);
    });

    // Listen to medical records
    const unsubMedical = onSnapshot(collection(db, `families/${familyId}/medicalRecords`), (snap) => {
      const records: MedicalRecord[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        let dateStr = data.date;
        if (dateStr && typeof dateStr.toDate === 'function') {
          dateStr = dateStr.toDate().toISOString();
        }
        records.push({ id: doc.id, ...data, date: dateStr } as MedicalRecord);
      });
      records.sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (isNaN(timeA) && isNaN(timeB)) return 0;
        if (isNaN(timeA)) return 1;
        if (isNaN(timeB)) return -1;
        return timeB - timeA;
      });
      setMedicalRecords(records);
    });

    // Listen to pending questions
    const unsubQuestions = onSnapshot(collection(db, `families/${familyId}/pendingQuestions`), (snap) => {
      const questions: PendingQuestion[] = [];
      snap.forEach(doc => questions.push({ id: doc.id, ...doc.data() } as PendingQuestion));
      setPendingQuestions(questions);
    });

    return () => {
      unsubFamily();
      unsubEvents();
      unsubTimeline();
      unsubMedical();
      unsubQuestions();
    };
  }, [isAuthReady, familyId, setProfile, setActiveFeeding, setActiveSleep, setEvents, setCompletedMilestones, setActiveAlarms, setTimelineEntries, setMedicalRecords, setPendingQuestions]);

  return <>{children}</>;
}
