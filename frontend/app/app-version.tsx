import { View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import Constants from 'expo-constants';

export default function AppVersionScreen() {
  const router = useRouter();

  // app.json에서 버전 정보 가져오기
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View className="px-4 pb-6" style={{ paddingTop: 68 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={28} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold ml-2">앱 버전 정보</Text>
        </View>
      </View>

      {/* 버전 정보 */}
      <View className="px-4 pt-8">
        <View className="py-5 border-b border-gray-100">
          <Text style={{ color: '#000000', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
            앱 버전
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 15 }}>
            v{appVersion}
          </Text>
        </View>
      </View>
    </View>
  );
}
