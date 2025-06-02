
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
// import { getAnalytics, Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let appInstance: FirebaseApp | null = null;
let authService: Auth | null = null;
let dbService: Firestore | null = null;

const placeholders = [
    "YOUR_API_KEY_HERE",
    "YOUR_AUTH_DOMAIN_HERE",
    "YOUR_PROJECT_ID_HERE",
    "YOUR_STORAGE_BUCKET_HERE",
    "YOUR_MESSAGING_SENDER_ID_HERE",
    "YOUR_APP_ID_HERE",
    "YOUR_MEASUREMENT_ID_HERE",
    "", // Also treat empty string as placeholder/missing
    undefined // Explicitly check for undefined
];

const isPlaceholderOrMissing = (value: string | undefined): boolean => {
  return !value || placeholders.includes(value);
};

if (
  !isPlaceholderOrMissing(firebaseConfig.apiKey) &&
  !isPlaceholderOrMissing(firebaseConfig.projectId)
) {
  try {
    if (!getApps().length) {
      appInstance = initializeApp(firebaseConfig);
    } else {
      appInstance = getApp();
    }
    authService = getAuth(appInstance);
    dbService = getFirestore(appInstance);
    console.info("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // appInstance, authService, dbService will remain null
  }
} else {
  console.warn(
    "Firebase API keys (apiKey or projectId) are missing, placeholders, or invalid. Firebase services will be disabled. " +
    "Please provide valid Firebase credentials in your .env file to enable backend features."
  );
}

export const app: FirebaseApp | null = appInstance;
export const auth: Auth | null = authService;
export const db: Firestore | null = dbService;
// const analytics =

