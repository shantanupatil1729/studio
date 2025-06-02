import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  coreTasksSet?: boolean;
  reminderTimes?: string[]; // e.g., ["09:00", "12:00", "15:00", "18:00", "21:00"]
}

export interface CoreTask {
  id: string; // Typically task1, task2, task3
  name: string;
  color?: string; // Optional: for UI color coding
}

export interface PlannedTask {
  id?: string; // Firestore document ID
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  coreTaskId: string; // Reference to CoreTask id
  title?: string; // Optional specific title for this block
  description?: string; // Optional
}

export interface TaskLog {
  id?: string; // Firestore document ID
  timestamp: Timestamp;
  coreTaskId: string; // Reference to CoreTask id
  focusLevel: 1 | 2 | 3 | 4 | 5; // 1 (low) to 5 (high)
  energyInput?: string; // Qualitative description
  energyCategory?: 'positive' | 'negative' | 'neutral'; // AI categorized
  durationMinutes?: number; // Optional: if logging after completion
}

export interface UserPreferences {
  reminderTimes: string[]; // e.g., ["09:00", "12:00", "15:00", "18:00", "21:00"]
  // Add other preferences here, e.g., theme
}