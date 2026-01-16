import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { View, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Home, PlusCircle, User } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    // index와 profile의 순서를 파악
    const indexRoute = state.routes.find((r: any) => r.name === 'index');
    const profileRoute = state.routes.find((r: any) => r.name === 'profile');
    const indexFocused = state.index === state.routes.indexOf(indexRoute);
    const profileFocused = state.index === state.routes.indexOf(profileRoute);

    return (
      <View
        style={{
          flexDirection: 'row',
          height: 50 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          backgroundColor: 'white',
        }}
      >
        {/* 홈 버튼 */}
        <TouchableOpacity
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            navigation.navigate('index');
          }}
        >
          <Home
            size={28}
            color={indexFocused ? '#000' : '#666'}
            fill={indexFocused ? '#000' : 'transparent'}
          />
        </TouchableOpacity>

        {/* Create 버튼 */}
        <TouchableOpacity
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          onPress={async () => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.push('/create');
          }}
        >
          <PlusCircle size={32} color="#666" strokeWidth={2} />
        </TouchableOpacity>

        {/* 프로필 버튼 */}
        <TouchableOpacity
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            navigation.navigate('profile');
          }}
        >
          <User
            size={28}
            color={profileFocused ? '#000' : '#666'}
            fill={profileFocused ? '#000' : 'transparent'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
