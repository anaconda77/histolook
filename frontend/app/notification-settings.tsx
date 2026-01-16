import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fcmAPI, NotificationSettings } from '@/services/fcm.api';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    notificationEnabled: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert(
          '알림',
          '로그인이 필요한 서비스입니다.',
          [
            {
              text: '확인',
              onPress: () => router.back()
            }
          ]
        );
        return;
      }

      const data = await fcmAPI.getNotificationSettings(accessToken);
      setSettings(data);
    } catch (error: any) {
      console.error('알림 설정 조회 실패:', error);
      if (error.response?.status === 401) {
        Alert.alert(
          '알림',
          '로그인이 필요한 서비스입니다.',
          [
            {
              text: '확인',
              onPress: () => router.back()
            }
          ]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    const newValue = !settings[key];
    
    // 낙관적 업데이트
    setSettings((prev) => ({ ...prev, [key]: newValue }));
    setIsSaving(true);

    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert('알림', '로그인이 필요한 서비스입니다.');
        // 롤백
        setSettings((prev) => ({ ...prev, [key]: !newValue }));
        return;
      }

      await fcmAPI.updateNotificationSettings({ [key]: newValue }, accessToken);
    } catch (error: any) {
      console.error('알림 설정 업데이트 실패:', error);
      // 롤백
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
      Alert.alert('오류', '알림 설정 업데이트에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2F2F2F" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* 헤더 */}
      <View className="px-4 pb-6" style={{ paddingTop: 68 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={28} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold ml-2">알림 설정</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Menu List */}
        <View className="px-4 pt-8">
          {/* 알림 수신 */}
          <View className="py-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text style={{ color: '#2F2F2F', fontSize: 18, fontWeight: '600' }}>알림 수신</Text>
              <Switch
                value={settings.notificationEnabled}
                onValueChange={() => handleToggle('notificationEnabled')}
                trackColor={{ false: '#D1D5DB', true: '#2F2F2F' }}
                thumbColor="#FFFFFF"
                disabled={isSaving}
              />
            </View>
            <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>
              아카이브 등록, 감정 등에 관한 알림을 수신합니다.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
