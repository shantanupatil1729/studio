
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth as firebaseAuthService, db as firebaseDbService } from '@/lib/firebase'; // Renamed imports
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initialLoadComplete: boolean;
  signOut: () => Promise<void>;
  fetchUserProfile: (firebaseUser: FirebaseUser) => Promise<UserProfile | null>;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const fetchUserProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile | null> => {
    if (!firebaseDbService) {
      console.warn("FetchUserProfile: Firestore DB service is not available.");
      return null;
    }
    if (!firebaseUser) return null;
    const userDocRef = doc(firebaseDbService, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data() as UserProfile;
    } else {
      // Create a basic profile if it doesn't exist
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        coreTasksSet: false,
        reminderTimes: ["09:00", "12:00", "15:00", "18:00", "21:00"],
      };
      await setDoc(userDocRef, newProfile);
      return newProfile;
    }
  };
  
  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    if (!firebaseDbService) {
      console.warn("UpdateUserProfile: Firestore DB service is not available.");
      return;
    }
    if (user) { // user from AuthProvider state
      const userDocRef = doc(firebaseDbService, 'users', user.uid);
      await setDoc(userDocRef, profileData, { merge: true });
      setUserProfile(prev => prev ? { ...prev, ...profileData } : null);
    }
  };

  useEffect(() => {
    if (!firebaseAuthService) {
      console.warn("AuthProvider: Firebase Auth service is not available. Authentication will be disabled.");
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      setInitialLoadComplete(true);
      return; 
    }

    const unsubscribe = onAuthStateChanged(firebaseAuthService, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const profile = await fetchUserProfile(firebaseUser);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
      setInitialLoadComplete(true);
    });

    return () => unsubscribe();
  }, []); // firebaseAuthService is module-level, doesn't need to be a dependency if its reference doesn't change

  const signOut = async () => {
    if (firebaseAuthService) {
      await firebaseSignOut(firebaseAuthService);
    } else {
      console.warn("SignOut: Firebase Auth service is not available.");
    }
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, initialLoadComplete, signOut, fetchUserProfile, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

