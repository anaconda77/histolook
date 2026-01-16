import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { fcmAPI } from '@/services/fcm.api';
import * as Device from 'expo-device';

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * FCM 토큰 요청 및 등록
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  try {
    // 디바이스가 실제 기기인지 확인
    if (!Device.isDevice) {
      console.warn('Must use physical device for Push Notifications');
      return null;
    }

    // 알림 권한 요청
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    // Expo Push Token 가져오기
    const expoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    token = expoPushToken.data;
    console.log('Expo Push Token:', token);

    // 플랫폼별 설정
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // 토큰을 서버에 등록
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken && token) {
      try {
        const deviceId = await AsyncStorage.getItem('deviceId') || undefined;
        await fcmAPI.registerToken(
          token,
          Platform.OS === 'ios' ? 'ios' : 'android',
          deviceId,
          accessToken,
        );
        console.log('FCM token registered successfully');
      } catch (error) {
        console.error('Failed to register FCM token:', error);
      }
    }

    // 토큰을 로컬에 저장
    await AsyncStorage.setItem('fcmToken', token);

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * 알림 수신 리스너 설정
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void,
) {
  // 포그라운드 알림 수신 리스너
  const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received in foreground:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // 알림 탭 리스너
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification tapped:', response);
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  return {
    foregroundSubscription,
    responseSubscription,
    remove: () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    },
  };
}

/**
 * FCM 토큰 삭제
 */
export async function deleteFcmToken(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem('fcmToken');
    const accessToken = await AsyncStorage.getItem('accessToken');

    if (token && accessToken) {
      await fcmAPI.deleteToken(token, accessToken);
      await AsyncStorage.removeItem('fcmToken');
      console.log('FCM token deleted successfully');
    }
  } catch (error) {
    console.error('Failed to delete FCM token:', error);
  }
}
