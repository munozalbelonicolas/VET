// ============================================================
// Veterinaria La Plata — Notification Service
// Native system notifications + in-app notifications (Firestore)
// ============================================================
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AppNotification, NotificationType } from '../types';

// Configure how notifications are presented when the app is in the FOREGROUND
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Initializes notification permissions and sets up high-priority Android channel
 */
export const initNotifications = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Veterinaria La Plata',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4ECDC4',
        enableVibrate: true,
        showBadge: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error initializing system notifications:', error);
    return false;
  }
};

/**
 * Sends a native system notification immediately (plays sound & shows OS banner)
 */
export const sendSystemNotification = async ({
  title,
  body,
  data,
}: {
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<string> => {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: data || {},
    },
    trigger: null,
  });
  return notificationId;
};

// --- In-app notifications (Firestore) ---

const toDate = (value: any, fallback = new Date()): Date =>
  value?.toDate ? value.toDate() : value instanceof Date ? value : fallback;

const mapNotification = (id: string, data: any): AppNotification => ({
  id,
  ...data,
  createdAt: toDate(data?.createdAt),
});

export async function getNotificationsByUser(userId: string): Promise<AppNotification[]> {
  if (!userId) return [];
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapNotification(d.id, d.data()));
}

export async function createInAppNotification({
  userId,
  type,
  title,
  body,
  data,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  await addDoc(collection(db, 'notifications'), {
    userId,
    type,
    title,
    body,
    data: data || {},
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('read', '==', false));
  const snapshot = await getDocs(q);
  await Promise.all(snapshot.docs.map((d) => updateDoc(d.ref, { read: true })));
}
