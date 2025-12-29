import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '@/services/auth.api';

export default function Index() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Root Layout이 마운트될 때까지 대기
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    checkLoginStatus();
  }, [isReady]);

  const checkLoginStatus = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (accessToken) {
        // 토큰 검증
        const isValid = await authAPI.verifyToken(accessToken);
        
        if (isValid) {
          // 유효한 토큰 - 홈 화면으로
          router.replace('/(tabs)');
          return;
        }
        
        // 토큰이 만료되었으면 refresh 시도
        if (refreshToken) {
          try {
            const newTokens = await authAPI.refresh(refreshToken);
            await AsyncStorage.setItem('accessToken', newTokens.accessToken);
            await AsyncStorage.setItem('refreshToken', newTokens.refreshToken);
            
            // 새 토큰으로 홈 화면으로
            router.replace('/(tabs)');
            return;
          } catch (refreshError) {
            console.error('토큰 재발급 실패:', refreshError);
            // refresh도 실패하면 로그인 화면으로
            await AsyncStorage.clear();
          }
        }
      }
      
      // 토큰이 없거나 검증 실패 - 로그인 화면으로
      router.replace('/login');
    } catch (error) {
      console.error('로그인 상태 확인 실패:', error);
      router.replace('/login');
    }
  };

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <ActivityIndicator size="large" color="#2F2F2F" />
      <Text className="mt-4 text-lg text-gray-600">Loading...</Text>
    </View>
  );
}
