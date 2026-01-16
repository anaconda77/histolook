import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { router, useFocusEffect, usePathname, useSegments } from 'expo-router';
import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memberAPI, type ProfileResponse } from '@/services/member.api';
import { authAPI } from '@/services/auth.api';
import { alarmAPI } from '@/services/alarm.api';
import { registerForPushNotificationsAsync, deleteFcmToken } from '@/utils/fcm';
import { ChevronRight, Bell } from 'lucide-react-native';

export default function ProfileScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [alarmCount, setAlarmCount] = useState(0);
  const pathname = usePathname();

  const segments = useSegments();
  useFocusEffect(
    useCallback(() => {
      const currentPath = pathname || '/(tabs)/profile';
      
      // 네비게이션 히스토리 업데이트 (로그 없이)
      (async () => {
        const historyStr = await AsyncStorage.getItem('navigationHistory');
        let history: string[] = historyStr ? JSON.parse(historyStr) : [];
        
        // 현재 경로가 마지막과 다르면 추가
        if (history.length === 0 || history[history.length - 1] !== currentPath) {
          history.push(currentPath);
          // 최대 10개까지만 유지
          if (history.length > 10) {
            history = history.slice(-10);
          }
          await AsyncStorage.setItem('navigationHistory', JSON.stringify(history));
        }
      })();
      
      // 프로필 화면이 포커스될 때 현재 경로를 저장 (아카이브 등록 화면으로 이동할 때 사용)
      AsyncStorage.setItem('previousRoute', currentPath);
      
      // 프로필 재로드 플래그 확인 (로그아웃/프로필 수정 시에만)
      (async () => {
        const shouldReload = await AsyncStorage.getItem('shouldReloadProfile');
        if (shouldReload === 'true') {
          await AsyncStorage.removeItem('shouldReloadProfile');
          checkLoginStatus();
        } else if (!isLoggedIn && !profile) {
          // 최초 진입 시에만 로그인 상태 확인
          checkLoginStatus();
        }
      })();
    }, [pathname, segments, router, isLoggedIn, profile])
  );

  const checkLoginStatus = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      // 로그인 상태를 먼저 체크: 토큰이 없으면 API 호출하지 않음
      if (!accessToken) {
        setIsLoggedIn(false);
        setProfile(null);
        setAlarmCount(0);
        setIsLoading(false);
        return;
      }
      
      // 토큰이 있을 때만 프로필 정보 가져오기
      try {
        const profileData = await memberAPI.getProfile(accessToken);
        setProfile(profileData);
        setIsLoggedIn(true);
        
        // 알림 개수 조회
        try {
          const alarmCountData = await alarmAPI.getAlarmCount(accessToken);
          setAlarmCount(alarmCountData.count);
        } catch (alarmError: any) {
          // 알림 개수 조회 실패는 무시 (에러 출력하지 않음)
          console.error('알림 개수 조회 실패:', alarmError);
          setAlarmCount(0);
        }
        
        // FCM 토큰 등록 (로그인 상태일 때만)
        try {
          await registerForPushNotificationsAsync();
        } catch (fcmError) {
          console.error('FCM 토큰 등록 실패:', fcmError);
          // 토큰 등록 실패해도 계속 진행
        }
      } catch (error: any) {
        // API 호출 실패 시 (토큰 만료 등) 로그아웃 상태로 처리
        // 401 에러는 로그아웃 상태에서 정상적인 응답이므로 에러 출력하지 않음
        if (error.response?.status !== 401) {
          console.error('프로필 로딩 실패:', error);
        }
        setIsLoggedIn(false);
        setProfile(null);
        setAlarmCount(0);
        // 만료된 토큰 제거
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      }
    } catch (error) {
      console.error('로그인 상태 확인 실패:', error);
      setIsLoggedIn(false);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          onPress: async () => {
            try {
              // 백엔드 로그아웃 API 호출
              const accessToken = await AsyncStorage.getItem('accessToken');
              if (accessToken) {
                try {
                  await authAPI.logout(accessToken);
                } catch (apiError) {
                  console.error('백엔드 로그아웃 API 호출 실패:', apiError);
                  // API 실패해도 로컬 토큰은 삭제
                }
              }
              
              // FCM 토큰 삭제
              try {
                await deleteFcmToken();
              } catch (fcmError) {
                console.error('FCM 토큰 삭제 실패:', fcmError);
                // 토큰 삭제 실패해도 로그아웃은 계속 진행
              }
              
              // 로컬 토큰 삭제
              await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
              await deleteFcmToken(); // FCM 토큰 삭제
              setIsLoggedIn(false);
              setProfile(null);
              setAlarmCount(0);
              
              // 프로필 재로드 플래그 설정
              await AsyncStorage.setItem('shouldReloadProfile', 'true');
            } catch (error) {
              console.error('로그아웃 실패:', error);
              Alert.alert('오류', '로그아웃에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const getRoleText = (role: 'USER' | 'ADMIN') => {
    return role === 'ADMIN' ? '관리자' : '일반 회원';
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2F2F2F" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="px-4 pb-4 border-b border-gray-100" style={{ paddingTop: 68 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-3xl font-bold" style={{ color: '#2F2F2F' }}>My Page</Text>
          <TouchableOpacity 
            className="relative"
            onPress={() => router.push('/alarm')}
          >
            <Bell size={24} color="#2F2F2F" />
            {alarmCount > 0 && (
              <View className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">{alarmCount > 99 ? '99+' : alarmCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Banner */}
      {isLoggedIn && profile ? (
        <View 
          className="bg-white mx-4 mt-4 px-5 py-4"
          style={{
            borderRadius: 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-row items-center flex-1">
              {profile.imageUrl ? (
                <Image
                  source={{ uri: profile.imageUrl }}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: '#2F2F2F' }}>
                  <Text className="text-white text-2xl font-bold">
                    {profile.nickname.charAt(0)}
                  </Text>
                </View>
              )}
              <View className="flex-1 ml-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-lg font-bold" style={{ color: '#2F2F2F' }}>
                    {profile.nickname}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {getRoleText(profile.role)}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity 
                    className="rounded-full px-4 py-1 items-center bg-white"
                    style={{ 
                      borderWidth: 1, 
                      borderColor: '#2F2F2F',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                    onPress={() => router.push('/my-archive')}
                  >
                    <Text className="text-xs font-bold" style={{ color: '#2F2F2F' }}>내 아카이브</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="rounded-full px-4 py-1 items-center bg-white"
                    style={{ 
                      borderWidth: 1, 
                      borderColor: '#2F2F2F',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                    onPress={() => router.push('/profile-edit')}
                  >
                    <Text className="text-xs font-bold" style={{ color: '#2F2F2F' }}>프로필 편집</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View 
          className="bg-white mx-4 mt-4 px-5 py-4"
          style={{
            borderRadius: 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-base" style={{ color: '#2F2F2F' }}>
              로그인이 필요합니다.
            </Text>
            <TouchableOpacity 
              className="rounded-full px-5 py-1 bg-white"
              style={{ 
                borderWidth: 1, 
                borderColor: '#2F2F2F',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
              onPress={handleLogin}
            >
              <Text className="text-xs font-bold" style={{ color: '#2F2F2F' }}>로그인</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Banner */}
      <View className="mx-4 mt-4 mb-4 bg-gray-200 rounded-lg h-36 items-center justify-center">
        <Text className="text-lg font-bold" style={{ color: '#2F2F2F' }}>배너</Text>
      </View>

      {/* Menu List */}
      <View className="px-4">
        <TouchableOpacity 
          className="flex-row items-center justify-between py-4 border-b border-gray-100"
          onPress={() => {/* TODO */}}
        >
          <Text style={{ color: '#2F2F2F', fontSize: 16, fontWeight: '500' }}>개인정보 처리방침</Text>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-row items-center justify-between py-4 border-b border-gray-100"
          onPress={() => {/* TODO */}}
        >
          <Text style={{ color: '#2F2F2F', fontSize: 16, fontWeight: '500' }}>서비스 이용약관</Text>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {isLoggedIn && (
          <TouchableOpacity 
            className="flex-row items-center justify-between py-4 border-b border-gray-100"
            onPress={handleLogout}
          >
            <Text style={{ color: '#2F2F2F', fontSize: 16, fontWeight: '500' }}>로그아웃</Text>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          className="flex-row items-center justify-between py-4 border-b border-gray-100"
          onPress={() => router.push('/settings')}
        >
          <Text style={{ color: '#2F2F2F', fontSize: 16, fontWeight: '500' }}>설정</Text>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

