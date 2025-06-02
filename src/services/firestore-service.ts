
import { db as firebaseDbService } from '@/lib/firebase'; // Renamed import
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

const DB_UNAVAILABLE_MSG = 'Firestore DB is not initialized. Operation skipped.';

// --- User Profile ---
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!firebaseDbService) {
    console.warn(DB_UNAVAILABLE_MSG, 'getUserProfile');
    return null;
  }
  const docRef = doc(firebaseDbService, 'users', userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
  if (!firebaseDbService) {
    console.warn(DB_UNAVAILABLE_MSG, 'updateUserProfile');
    return;
  }
  const docRef = doc(firebaseDbService, 'users', userId);
  await updateDoc(docRef, data);
};

// --- Core Tasks ---
export const getCoreTasks = async (userId: string): Promise<CoreTask[]> => {
  if (!firebaseDbService) {
    console.warn(DB_UNAVAILABLE_MSG, 'getCoreTasks');
    return [];
  }
  const userProfile = await getUserProfile(userId); // This now uses the guarded version
  if (userProfile?.coreTasks) { // Check if userProfile itself is null
    return Object.entries(userProfile.coreTasks).map(([id, taskData]) => ({
      id,
      ...(taskData as Omit<CoreTask, 'id'>),
    }));
  }
  const tasksColRef = collection(firebaseDbService, `users/${userId}/coreTasks`);
  const snapshot = await getDocs(tasksColRef);
  if (!snapshot.empty) {
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoreTask));
  }
  return [];
};

export const setCoreTasks = async (userId: string, tasks: CoreTask[]): Promise<void> => {
  if (!firebaseDbService) {
    console.warn(DB_UNAVAILABLE_MSG, 'setCoreTasks');
    return;
  }
  const batch = writeBatch(firebaseDbService);
  const tasksColRef = collection(firebaseDbService, `users/${userId}/coreTasks`);
  
  const existingTasksSnapshot = await getDocs(tasksColRef);
  existingTasksSnapshot.docs.forEach(d => batch.delete(d.ref));

  tasks.forEach(task => {
    const taskRef = doc(tasksColRef, task.id);
    batch.set(taskRef, { name: task.name, color: task.color || null });
  });
  await batch.commit();
  // updateUserProfile is already guarded for db availability
  await updateUserProfile(userId, { coreTasksSet: true });
};

// --- Planned Tasks (Calendar Events) ---
export const addPlannedTask = async (userId: string, task: Omit<PlannedTask, 'id'>): Promise<string | null> => {
  if (!firebaseDbService) {
    console.warn(DB_UNAVAILABLE_MSG, 'addPlannedTask');
    return null;
  }
  const docRef = await addDoc(collection(firebaseDbService, `users/${userId}/plannedTasks`), task);
  return docRef.id;
};

export const getPlannedTasksForDateRange = async (userId: string, startDate: string, endDate: string): Promise<PlannedTask[]> => {
  if (!firebaseDbService) {
    console.warn(DB_UNAVAILABLE_MSG, 'getPlannedTasksForDateRange');
    return [];
  }
  const q = query(
    collection(firebaseDbService, `users/${userId}/plannedTasks`),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlannedTask));
};

export const updatePlannedTask = async (userId: string, taskId: string, data: Partial<PlannedTask>): Promise<void> => {
  if (!firebaseDbService) {
    console.warn(DB_UNAVAILABLE_MSG, 'updatePlannedTask');
    return;
  }
  await updateDoc(doc(firebaseDbService, `users/${userId}/plannedTasks`, taskId), data);
};

export const deletePlannedTask = async (userId: string, taskId: string): Promise<void> => {
  if (!firebaseDbService) {
    console.warn(DB_UNAVAILABLE_MSG, 'deletePlannedTask');
    return;
  }
  await deleteDoc(doc(firebaseDbService, `users/${userId}/plannedTasks`, taskId));
};

// --- Task Logs (Time & Energy Logging) ---
export const addTaskLog = async (userId: string, log: Omit<TaskLog, 'id' | 'timestamp'>): Promise<string | null> => {
  if (!firebaseDbService) {
    console.warn(DB_UNAVAILABLE_MSG, 'addTaskLog');
    return null;
  }
  const logWithTimestamp = { ...log, timestamp: Timestamp.now() };
  const docRef = await addDoc(collection(firebaseDbService, `users/${userId}/taskLogs`), logWithTimestamp);
  return docRef.id;
};

export const getTaskLogsForPeriod = async (userId: string, startDate: Date, endDate: Date): Promise<TaskLog[]> => {
  if (!firebaseDbService) {
    console.warn(DB_UNAVAILABLE_MSG, 'getTaskLogsForPeriod');
    return [];
  }
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);
  const q = query(
    collection(firebaseDbService, `users/${userId}/taskLogs`),
    where('timestamp', '>=', startTimestamp),
    where('timestamp', '<=', endTimestamp)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskLog));
};

// --- User Preferences ---
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  if (!firebaseDbService) { // Though this relies on getUserProfile which is already guarded
    console.warn(DB_UNAVAILABLE_MSG, 'getUserPreferences');
    // Fallback default if profile can't be fetched due to DB issue
    return { reminderTimes: ["09:00", "12:00", "15:00", "18:00", "21:00"] };
  }
  const userProfile = await getUserProfile(userId);
  if (userProfile?.reminderTimes) { // Check if userProfile itself is null
    return { reminderTimes: userProfile.reminderTimes };
  }
  return { reminderTimes: ["09:00", "12:00", "15:00", "18:00", "21:00"] };
};

export const updateUserPreferences = async (userId: string, preferences: Partial<UserPreferences>): Promise<void> => {
  if (!firebaseDbService) { // Though this relies on updateUserProfile which is already guarded
    console.warn(DB_UNAVAILABLE_MSG, 'updateUserPreferences');
    return;
  }
  await updateUserProfile(userId, preferences);
};

