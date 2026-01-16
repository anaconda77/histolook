import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Home, PlusCircle, User } from 'lucide-react-native';

export function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  // 현재 활성화된 탭 확인
  const isHomeActive = pathname === '/' || pathname.startsWith('/(tabs)');
  const isCreateActive = pathname.includes('/create');
  const isProfileActive = pathname.includes('/profile');
  
  // 현재 경로 결정 (segments를 사용하여 더 정확하게)
  const getCurrentRoute = () => {
    if (segments.length === 0) return '/(tabs)';
    if (segments[0] === 'tabs') {
      if (segments[1] === 'profile') return '/(tabs)/profile';
      if (segments[1] === 'create') return '/(tabs)/create';
      return '/(tabs)';
    }
    return pathname || '/(tabs)';
  };

  return (
    <View 
      className="flex-row items-center justify-around"
      style={{ 
        backgroundColor: 'white',
        height: 50 + insets.bottom,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
      }}
    >
      <TouchableOpacity 
        onPress={() => router.push('/(tabs)')}
        className="items-center justify-center"
      >
        <Home 
          size={28} 
          color={isHomeActive ? '#000' : '#666'} 
          fill={isHomeActive ? '#000' : 'transparent'} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={async () => {
          // 현재 경로를 저장하여 나중에 돌아올 수 있도록 함
          const currentPath = pathname || getCurrentRoute();
          await AsyncStorage.setItem('previousRoute', currentPath);
          // 독립 화면으로 이동 (탭이 아님)
          router.push('/create');
        }}
        className="items-center justify-center"
      >
        <PlusCircle 
          size={32} 
          color={isCreateActive ? '#000' : '#666'} 
          strokeWidth={2} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.push('/(tabs)/profile')}
        className="items-center justify-center"
      >
        <User 
          size={28} 
          color={isProfileActive ? '#000' : '#666'} 
          fill={isProfileActive ? '#000' : 'transparent'} 
        />
      </TouchableOpacity>
    </View>
  );
}

