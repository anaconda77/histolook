import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function CreateScreen() {
  return (
    <View className="flex-1 bg-white items-center justify-center">
      <StatusBar style="dark" />
      <Text className="text-xl font-bold" style={{ color: '#2F2F2F' }}>아카이브 업로드</Text>
      <Text className="text-gray-500 mt-2">준비 중입니다</Text>
    </View>
  );
}

