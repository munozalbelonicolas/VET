// ============================================================
// Veterinaria La Plata — Native System Notification Service
// ============================================================
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are presented when the app is in the FOREGROUND
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Initializes notification permissions and sets up high-priority Android channel
 */
export const initNotifications = async (): Promise<boolean> => {
  try {
    // 1. Setup Android Channel for High Priority / Sound / Heads-up Banner
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

    // 2. Request System Permissions (iOS & Android 13+)
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted!');
      return false;
    }

    return true;
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
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: data || {},
      },
      trigger: null, // trigger immediately
    });
    return notificationId;
  } catch (error) {
    console.error('Error triggering system notification:', error);
    throw error;
  }
};
