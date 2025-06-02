import { db } from '@/lib/firebase';
import type { CoreTask, PlannedTask, TaskLog, UserProfile, UserPreferences } from '@/lib/types';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';

// --- User Profile ---
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, data);
};

// --- Core Tasks ---
// Core tasks are stored as a map within the user's profile document or a subcollection
// For simplicity, let's assume they are part of the user's profile document in a field `coreTasks`
// e.g., coreTasks: { task1: {name: "Work"}, task2: {name: "Learn"}, task3: {name: "Exercise"}}

export const getCoreTasks = async (userId: string): Promise<CoreTask[]> => {
  const userProfile = await getUserProfile(userId);
  if (userProfile && userProfile.coreTasks) {
    // Assuming coreTasks is stored as an object like { 'task1': {name: '...'}, ... }
    return Object.entries(userProfile.coreTasks).map(([id, taskData]) => ({
      id,
      ...(taskData as Omit<CoreTask, 'id'>),
    }));
  }
  // A slightly different approach if stored in a subcollection 'coreTasks'
  const tasksColRef = collection(db, `users/${userId}/coreTasks`);
  const snapshot = await getDocs(tasksColRef);
  if (!snapshot.empty) {
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoreTask));
  }
  return [];
};

export const setCoreTasks = async (userId: string, tasks: CoreTask[]): Promise<void> => {
  // This example assumes tasks are few (e.g., 3) and can be stored in a subcollection or as a map.
  // Using a subcollection for clarity.
  const batch = writeBatch(db);
  const tasksColRef = collection(db, `users/${userId}/coreTasks`);
  
  // Clear existing tasks first if any (optional, depends on desired behavior)
  const existingTasksSnapshot = await getDocs(tasksColRef);
  existingTasksSnapshot.docs.forEach(d => batch.delete(d.ref));

  tasks.forEach(task => {
    const taskRef = doc(tasksColRef, task.id); // Use predefined IDs like 'task1', 'task2'
    batch.set(taskRef, { name: task.name, color: task.color || null });
  });
  await batch.commit();
  await updateUserProfile(userId, { coreTasksSet: true });
};


// --- Planned Tasks (Calendar Events) ---
export const addPlannedTask = async (userId: string, task: Omit<PlannedTask, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, `users/${userId}/plannedTasks`), task);
  return docRef.id;
};

export const getPlannedTasksForDateRange = async (userId: string, startDate: string, endDate: string): Promise<PlannedTask[]> => {
  const q = query(
    collection(db, `users/${userId}/plannedTasks`),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlannedTask));
};

export const updatePlannedTask = async (userId: string, taskId: string, data: Partial<PlannedTask>): Promise<void> => {
  await updateDoc(doc(db, `users/${userId}/plannedTasks`, taskId), data);
};

export const deletePlannedTask = async (userId: string, taskId: string): Promise<void> => {
  await deleteDoc(doc(db, `users/${userId}/plannedTasks`, taskId));
};

// --- Task Logs (Time & Energy Logging) ---
export const addTaskLog = async (userId: string, log: Omit<TaskLog, 'id' | 'timestamp'>): Promise<string> => {
  const logWithTimestamp = { ...log, timestamp: Timestamp.now() };
  const docRef = await addDoc(collection(db, `users/${userId}/taskLogs`), logWithTimestamp);
  return docRef.id;
};

export const getTaskLogsForPeriod = async (userId: string, startDate: Date, endDate: Date): Promise<TaskLog[]> => {
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);
  const q = query(
    collection(db, `users/${userId}/taskLogs`),
    where('timestamp', '>=', startTimestamp),
    where('timestamp', '<=', endTimestamp)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskLog));
};


// --- User Preferences ---
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  const userProfile = await getUserProfile(userId);
  if (userProfile && userProfile.reminderTimes) {
    return { reminderTimes: userProfile.reminderTimes };
  }
  // Fallback to default if not set on profile, though profile creation should handle this.
  return { reminderTimes: ["09:00", "12:00", "15:00", "18:00", "21:00"] };
};

export const updateUserPreferences = async (userId: string, preferences: Partial<UserPreferences>): Promise<void> => {
  // Preferences are part of UserProfile in this model
  await updateUserProfile(userId, preferences);
};
