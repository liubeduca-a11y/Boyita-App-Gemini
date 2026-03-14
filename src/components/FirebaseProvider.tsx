import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, writeBatch } from 'firebase/firestore';
import { useStore, BabyEvent } from '../store';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { setFamilyId, setEvents, setProfile, setActiveFeeding, setActiveSleep, profile } = useStore();
  const familyId = useStore(state => state.familyId);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user exists in DB
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          let currentFamilyId = user.uid;

          if (!userSnap.exists()) {
            // Create new user and family
            await setDoc(userRef, {
              familyId: currentFamilyId,
              email: user.email,
              name: user.displayName || 'Usuario'
            });

            const state = useStore.getState();

            await setDoc(doc(db, 'families', currentFamilyId), {
              members: [user.uid],
              babyProfile: state.profile, // use current local profile
              activeFeeding: state.activeFeeding || null,
              activeSleep: state.activeSleep || null,
            });

            // Migrate local events to Firestore
            if (state.events.length > 0) {
              const batch = writeBatch(db);
              state.events.forEach(event => {
                const eventRef = doc(db, `families/${currentFamilyId}/events/${event.id}`);
                batch.set(eventRef, { ...event, authorId: user.uid });
              });
              await batch.commit();
            }
          } else {
            currentFamilyId = userSnap.data().familyId;
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

    // Listen to family document (profile, active states)
    const unsubFamily = onSnapshot(doc(db, 'families', familyId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.babyProfile) setProfile(data.babyProfile);
        if (data.activeFeeding !== undefined) setActiveFeeding(data.activeFeeding);
        if (data.activeSleep !== undefined) setActiveSleep(data.activeSleep);
      }
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
    });

    return () => {
      unsubFamily();
      unsubEvents();
    };
  }, [isAuthReady, familyId, setProfile, setActiveFeeding, setActiveSleep, setEvents]);

  return <>{children}</>;
}
