import { View, Text, TouchableOpacity, Image, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { GoogleLoginButton } from '@/components/google-login-button';
import { authAPI } from '@/services/auth.api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '@/utils/fcm';

// WebBrowser 세션 완료 후 처리
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);

  // Deep Link 처리 (OAuth 콜백)
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('Deep link received:', url);

      // 카카오 콜백 처리
      if (url.includes('histolook://kakao/callback')) {
        const params = new URL(url).searchParams;
        const authUserId = params.get('authUserId');
        const error = params.get('error');

        if (error) {
          Alert.alert('로그인 실패', error);
          return;
        }

        if (authUserId) {
          // AuthUser가 생성되었으므로 회원가입 페이지로 이동
          router.push({ pathname: '/signup', params: { authUserId } });
        }
      }

      // 구글 콜백 처리
      if (url.includes('histolook://google/callback')) {
        const params = new URL(url).searchParams;
        const authUserId = params.get('authUserId');
        const error = params.get('error');

        if (error) {
          Alert.alert('로그인 실패', error);
          return;
        }

        if (authUserId) {
          // AuthUser가 생성되었으므로 회원가입 페이지로 이동
          router.push({ pathname: '/signup', params: { authUserId } });
        }
      }
    };

    // Deep Link 리스너 등록
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // 앱이 닫혀있다가 Deep Link로 열린 경우
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    try {
      // 카카오 OAuth 로그인 페이지로 이동
      const authUrl = authAPI.getKakaoAuthUrl();
      
      // WebBrowser로 OAuth 인증 세션 시작
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'histolook://kakao/callback'
      );

      console.log('Kakao auth result:', result);
      
      if (result.type === 'success' && result.url) {
        // URL 파싱
        const url = new URL(result.url);
        const accessToken = url.searchParams.get('accessToken');
        const refreshToken = url.searchParams.get('refreshToken');
        const authUserId = url.searchParams.get('authUserId');
        const isRegistered = url.searchParams.get('isRegistered');
        const error = url.searchParams.get('error');

        if (error) {
          Alert.alert('로그인 실패', decodeURIComponent(error));
          return;
        }

        if (isRegistered === 'true' && accessToken && refreshToken) {
          // 기존 회원 - 토큰 및 사용자 정보 저장 후 홈으로 이동
          try {
            const memberId = url.searchParams.get('memberId');
            const nickname = url.searchParams.get('nickname');
            const role = url.searchParams.get('role');

            await AsyncStorage.setItem('accessToken', accessToken);
            await AsyncStorage.setItem('refreshToken', refreshToken);
            
            if (memberId) {
              await AsyncStorage.setItem('memberId', memberId);
            }
            if (nickname) {
              await AsyncStorage.setItem('nickname', decodeURIComponent(nickname));
            }
            if (role) {
              await AsyncStorage.setItem('role', role);
            }
            
            // FCM 토큰 등록 (로그인 성공 후)
            try {
              await registerForPushNotificationsAsync();
            } catch (error) {
              console.error('FCM 토큰 등록 실패:', error);
              // 토큰 등록 실패해도 로그인은 계속 진행
            }
            
            // 홈 화면으로 이동
            router.replace('/(tabs)');
          } catch (error) {
            console.error('토큰 저장 실패:', error);
            Alert.alert('오류', '로그인에 실패했습니다.');
          }
        } else if (authUserId) {
          // 신규 회원 - 회원가입 페이지로 이동
          router.push(`/signup?authUserId=${authUserId}`);
        }
      } else if (result.type === 'cancel') {
        Alert.alert('알림', '로그인이 취소되었습니다.');
      }
    } catch (error) {
      console.error('카카오 로그인 실패:', error);
      Alert.alert('오류', '카카오 로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // 구글 OAuth 로그인 페이지로 이동
      const authUrl = authAPI.getGoogleAuthUrl();
      
      // WebBrowser로 OAuth 인증 세션 시작
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'histolook://google/callback'
      );

      console.log('Google auth result:', result);
      
      if (result.type === 'success' && result.url) {
        // URL 파싱
        const url = new URL(result.url);
        const accessToken = url.searchParams.get('accessToken');
        const refreshToken = url.searchParams.get('refreshToken');
        const authUserId = url.searchParams.get('authUserId');
        const isRegistered = url.searchParams.get('isRegistered');
        const error = url.searchParams.get('error');

        if (error) {
          Alert.alert('로그인 실패', decodeURIComponent(error));
          return;
        }

        if (isRegistered === 'true' && accessToken && refreshToken) {
          // 기존 회원 - 토큰 및 사용자 정보 저장 후 홈으로 이동
          try {
            const memberId = url.searchParams.get('memberId');
            const nickname = url.searchParams.get('nickname');
            const role = url.searchParams.get('role');

            await AsyncStorage.setItem('accessToken', accessToken);
            await AsyncStorage.setItem('refreshToken', refreshToken);
            
            if (memberId) {
              await AsyncStorage.setItem('memberId', memberId);
            }
            if (nickname) {
              await AsyncStorage.setItem('nickname', decodeURIComponent(nickname));
            }
            if (role) {
              await AsyncStorage.setItem('role', role);
            }
            
            // FCM 토큰 등록 (로그인 성공 후)
            try {
              await registerForPushNotificationsAsync();
            } catch (error) {
              console.error('FCM 토큰 등록 실패:', error);
              // 토큰 등록 실패해도 로그인은 계속 진행
            }
            
            // 홈 화면으로 이동
            router.replace('/(tabs)');
          } catch (error) {
            console.error('토큰 저장 실패:', error);
            Alert.alert('오류', '로그인에 실패했습니다.');
          }
        } else if (authUserId) {
          // 신규 회원 - 회원가입 페이지로 이동
          router.push(`/signup?authUserId=${authUserId}`);
        }
      } else if (result.type === 'cancel') {
        Alert.alert('알림', '로그인이 취소되었습니다.');
      }
    } catch (error) {
      console.error('구글 로그인 실패:', error);
      Alert.alert('오류', '구글 로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipLogin = () => {
    // 로그인 없이 메인 화면으로 이동
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      {/* 로고 영역 */}
      <View className="items-center mb-20">
        {/* 상단 그래픽 요소 */}
        <View className="mb-12 w-full items-center">
          <View className="w-full max-w-xs items-start">
            <View 
              className="h-11 bg-[#6BBF7D] rounded-full mb-3" 
              style={{ width: 340, marginLeft: -20 }} 
            />
            <View 
              className="h-11 bg-[#D97B66] rounded-full" 
              style={{ width: 170 }} 
            />
          </View>
        </View>

        {/* 로고 텍스트 */}
        <Text className="text-[52px] font-bold" style={{ lineHeight: 58, color: '#2F2F2F', fontFamily: 'Righteous' }}>
          Histo
        </Text>
        <Text className="text-[52px] font-bold mb-4" style={{ lineHeight: 58, color: '#2F2F2F', fontFamily: 'Righteous' }}>
          Look
        </Text>
        
        {/* 서브 타이틀 */}
        <Text className="text-base text-gray-600">
          우리들의 Fashion Archive
        </Text>
      </View>

      {/* 로그인 버튼 영역 */}
      <View className="gap-3">
        <Text className="text-center text-sm font-semibold mb-3" style={{ color: '#2F2F2F' }}>
          회원가입 또는 로그인
        </Text>

        {/* 카카오 로그인 버튼 */}
        <TouchableOpacity
          className="rounded-xl overflow-hidden"
          onPress={handleKakaoLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Image
            source={require('@/assets/images/kakao-login.png')}
            className="w-full"
            style={{ height: 56 }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* 구글 로그인 버튼 */}
        <GoogleLoginButton
          onPress={handleGoogleLogin}
          disabled={isLoading}
        />

        {/* 로그인 없이 이용하기 */}
        <TouchableOpacity
          className="mt-4 py-3"
          onPress={handleSkipLogin}
          activeOpacity={0.7}
        >
          <Text className="text-center text-sm text-gray-600 underline">
            로그인 없이 이용하기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

