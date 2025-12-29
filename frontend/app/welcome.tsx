import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function WelcomeScreen() {
  const params = useLocalSearchParams();
  const nickname = (params.nickname as string) || '회원';

  const handleStart = () => {
    // 홈 화면으로 이동
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 py-8">
          {/* 환영 메시지 */}
          <View className="mb-8">
            <Text className="text-3xl font-bold mb-3" style={{ color: '#2F2F2F' }}>
              {nickname} 님,
            </Text>
            <Text className="text-3xl font-bold mb-6" style={{ color: '#2F2F2F' }}>
              회원가입을 축하합니다!
            </Text>
            
            <Text className="text-base text-gray-600">
              가치있는 아카이브를 마음껏 탐방해보세요.
            </Text>
          </View>

          {/* 앱 미리보기 이미지 영역 */}
          <View className="flex-1 items-center justify-center mb-8">
            <View className="flex-row gap-3" style={{ width: '100%', maxWidth: 500 }}>
              {/* 좌측: Archive Detail 화면 이미지 (작은 이미지) */}
              <View style={{ }}>
                <View className="bg-white rounded-2xl overflow-hidden" style={{ 
                  width: 130,
                  height: 300,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                  elevation: 5,
                }}>
                  <Image
                    source={require('@/assets/images/welcome-archive-detail.png')}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </View>
              </View>

              {/* 우측: Home 화면 이미지 (큰 이미지) */}
              <View style={{ flex: 1 }}>
                <View className="bg-white rounded-2xl overflow-hidden" style={{ 
                  width: 200,
                  height: 400,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                  elevation: 5,
                }}>
                  <Image
                    source={require('@/assets/images/welcome-home.png')}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* 하단 버튼 */}
          <View className="mt-auto">
            <TouchableOpacity
              className="rounded-2xl py-4 items-center"
              style={{ backgroundColor: '#2F2F2F' }}
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <Text className="text-white text-base font-semibold">시작하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

