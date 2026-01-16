import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();

  const handleNotificationSettings = () => {
    router.push('/notification-settings');
  };

  const handleInquiry = () => {
    router.push('/support-create');
  };

  const handleInquiryHistory = () => {
    router.push('/support-history');
  };

  const handleAppVersion = () => {
    router.push('/app-version');
  };

  const handleWithdrawal = () => {
    router.push('/member-withdrawal');
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* 헤더 */}
      <View className="px-4 pb-6" style={{ paddingTop: 68 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={28} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold ml-2">설정</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Menu List */}
        <View className="px-4 pt-8">
          {/* 알림 설정 */}
          <TouchableOpacity 
            className="flex-row items-center justify-between py-5 border-b border-gray-100"
            onPress={handleNotificationSettings}
          >
            <Text style={{ color: '#2F2F2F', fontSize: 16 }}>알림 설정</Text>
            <ChevronRight size={22} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 문의하기 */}
          <TouchableOpacity 
            className="flex-row items-center justify-between py-5 border-b border-gray-100"
            onPress={handleInquiry}
          >
            <Text style={{ color: '#2F2F2F', fontSize: 16 }}>문의하기</Text>
            <ChevronRight size={22} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 문의 내역 */}
          <TouchableOpacity 
            className="flex-row items-center justify-between py-5 border-b border-gray-100"
            onPress={handleInquiryHistory}
          >
            <Text style={{ color: '#2F2F2F', fontSize: 16 }}>문의 내역</Text>
            <ChevronRight size={22} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 앱 버전 정보 */}
          <TouchableOpacity 
            className="flex-row items-center justify-between py-5 border-b border-gray-100"
            onPress={handleAppVersion}
          >
            <Text style={{ color: '#2F2F2F', fontSize: 16 }}>앱 버전 정보</Text>
            <ChevronRight size={22} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 회원 탈퇴 */}
          <TouchableOpacity 
            className="flex-row items-center justify-between py-5 border-b border-gray-100"
            onPress={handleWithdrawal}
          >
            <Text style={{ color: '#EF4444', fontSize: 16 }}>회원 탈퇴</Text>
            <ChevronRight size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
