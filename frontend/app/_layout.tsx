import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useFonts, Righteous_400Regular } from '@expo-google-fonts/righteous';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ArchiveCacheProvider } from '../contexts/ArchiveCacheContext';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../utils/fcm';
import { useRouter } from 'expo-router';

// 스플래시 스크린을 자동으로 숨기지 않도록 설정
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  
  // 폰트 로드
  const [fontsLoaded] = useFonts({
    'Righteous': Righteous_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // FCM 초기화
  useEffect(() => {
    // FCM 토큰 등록
    registerForPushNotificationsAsync();

    // 알림 리스너 설정
    const listeners = setupNotificationListeners(
      // 포그라운드 알림 수신 시
      (notification) => {
        console.log('Notification received:', notification);
        // 필요시 로컬 알림 표시 또는 상태 업데이트
      },
      // 알림 탭 시
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.resourcePath) {
          // 알림 데이터의 resourcePath로 이동
          router.push(data.resourcePath as any);
        }
      },
    );

    return () => {
      listeners.remove();
    };
  }, [router]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ArchiveCacheProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false, title: '회원가입' }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="profile-edit" options={{ headerShown: false, title: '프로필 편집' }} />
          <Stack.Screen name="archive-detail/[id]" options={{ headerShown: false, title: '아카이브 상세' }} />
          <Stack.Screen name="archive-edit/[id]" options={{ headerShown: false, title: '아카이브 수정' }} />
          <Stack.Screen name="interest" options={{ headerShown: false, title: '관심 아카이브' }} />
          <Stack.Screen name="my-archive" options={{ headerShown: false, title: '내 아카이브' }} />
          <Stack.Screen name="alarm" options={{ headerShown: false, title: '알림' }} />
          <Stack.Screen name="settings" options={{ headerShown: false, title: '설정' }} />
          <Stack.Screen name="notification-settings" options={{ headerShown: false, title: '알림 설정' }} />
          <Stack.Screen name="support-create" options={{ headerShown: false, title: '문의하기' }} />
          <Stack.Screen name="support-history" options={{ headerShown: false, title: '문의 내역' }} />
          <Stack.Screen name="support-detail/[id]" options={{ headerShown: false, title: '문의 상세' }} />
          <Stack.Screen name="app-version" options={{ headerShown: false, title: '앱 버전 정보' }} />
          <Stack.Screen name="member-withdrawal" options={{ headerShown: false, title: '회원 탈퇴' }} />
          <Stack.Screen name="create" options={{ headerShown: false, title: '아카이브 등록' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ArchiveCacheProvider>
  );
}
