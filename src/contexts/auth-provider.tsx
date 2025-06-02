
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useState, ReactNode, useCallback }  from 'react';
// Firebase imports are no longer strictly needed for the bypassed auth, but kept for context
// import { auth as firebaseAuthService, db as firebaseDbService } from '@/lib/firebase';
// import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
// import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

// Mock User Data for bypassing login
const mockUser: FirebaseUser = {
  uid: 'mock-user-uid',
  email: 'mock@example.com',
  displayName: 'Mock User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  // Mock methods for FirebaseUser interface
  getIdToken: async () => 'mock-id-token',
  getIdTokenResult: async () => ({
    token: 'mock-id-token',
    expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
    authTime: new Date().toISOString(),
    issuedAtTime: new Date().toISOString(),
    signInProvider: null,
    signInSecondFactor: null,
    claims: {},
  }),
  reload: async () => {},
  delete: async () => {},
  toJSON: () => ({ uid: 'mock-user-uid', email: 'mock@example.com' }),
  // Add other properties if your app uses them, with mock values
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
};

const mockUserProfile: UserProfile = {
  uid: 'mock-user-uid',
  email: 'mock@example.com',
  displayName: 'Mock User',
  photoURL: null,
  coreTasksSet: true, // Crucial for bypassing core tasks setup
  reminderTimes: ["09:00", "12:00", "15:00", "18:00", "21:00"],
};

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
  const [user, setUser] = useState<FirebaseUser | null>(mockUser); // Initialize with mock user
  const [userProfile, setUserProfile] = useState<UserProfile | null>(mockUserProfile); // Initialize with mock profile
  const [loading, setLoading] = useState(false); // Start as not loading
  const [initialLoadComplete, setInitialLoadComplete] = useState(true); // Start as load complete

  // fetchUserProfile and updateUserProfile become no-ops or work with mock data
  const fetchUserProfile = useCallback(async (_firebaseUser: FirebaseUser): Promise<UserProfile | null> => {
    console.warn("AuthProvider: fetchUserProfile called in mock mode. Returning mock profile.");
    return mockUserProfile;
  }, []);
  
  const updateUserProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    console.warn("AuthProvider: updateUserProfile called in mock mode. Updating mock profile state.");
    setUserProfile(prev => prev ? { ...prev, ...profileData } : null);
  }, []);

  // useEffect for onAuthStateChanged is removed as we are simulating auth state
  // useEffect(() => {
  //   if (!firebaseAuthService) {
  //     console.warn("AuthProvider: Firebase Auth service is not available. Authentication will be disabled.");
  //     setUser(null);
  //     setUserProfile(null);
  //     setLoading(false);
  //     setInitialLoadComplete(true);
  //     return; 
  //   }
  //   const unsubscribe = onAuthStateChanged(firebaseAuthService, async (firebaseUser) => {
  //     setLoading(true);
  //     if (firebaseUser) {
  //       setUser(firebaseUser);
  //       const profile = await fetchUserProfile(firebaseUser);
  //       setUserProfile(profile);
  //     } else {
  //       setUser(null);
  //       setUserProfile(null);
  //     }
  //     setLoading(false);
  //     setInitialLoadComplete(true);
  //   });
  //   return () => unsubscribe();
  // }, [fetchUserProfile]); // fetchUserProfile is stable due to useCallback

  const signOut = async () => {
    console.warn("AuthProvider: signOut called in mock mode. Clearing mock user state.");
    // To allow testing "logged out" state if needed, without actual Firebase call
    setUser(null);
    setUserProfile(null);
    // If you want to redirect to login on mock sign out:
    // router.push('/login'); // would need to import useRouter from 'next/navigation'
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
