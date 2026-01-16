import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supportAPI, SupportPostDetail } from '@/services/support.api';

export default function SupportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [support, setSupport] = useState<SupportPostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isContentExpanded, setIsContentExpanded] = useState(true);
  const [isReplyExpanded, setIsReplyExpanded] = useState(true);

  useEffect(() => {
    loadSupportDetail();
  }, []);

  const loadSupportDetail = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert(
          '알림',
          '로그인이 필요한 서비스입니다.',
          [
            {
              text: '확인',
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }

      const data = await supportAPI.getSupportDetail(id as string, accessToken);
      setSupport(data);
    } catch (error: any) {
      console.error('문의 상세 조회 실패:', error);
      if (error.response?.status === 401) {
        Alert.alert(
          '알림',
          '로그인이 필요한 서비스입니다.',
          [
            {
              text: '확인',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          '오류',
          '페이지 로드하는데 실패했습니다.',
          [
            {
              text: '확인',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2F2F2F" />
      </View>
    );
  }

  if (!support) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text style={{ color: '#9CA3AF', fontSize: 16 }}>문의 내역을 찾을 수 없습니다.</Text>
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
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* 제목 섹션 */}
        <View className="px-4 mb-8">
          <Text style={{ color: '#2F2F2F', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
            {support.supportType}
          </Text>
          
          <TouchableOpacity
            onPress={() => setIsContentExpanded(!isContentExpanded)}
            className="border border-gray-200 rounded-lg px-4 py-4"
            style={{ backgroundColor: '#FAFAFA' }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text style={{ color: '#2F2F2F', fontSize: 14, marginBottom: 4 }}>
                  {support.title}
                </Text>
                <View className="flex-row items-center mt-2">
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: support.status === '답변 완료' ? '#E5F7ED' : '#FEF3E2',
                    }}
                  >
                    <Text
                      style={{
                        color: support.status === '답변 완료' ? '#059669' : '#D97706',
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {support.status}
                    </Text>
                  </View>
                </View>
              </View>
              {isContentExpanded ? (
                <ChevronUp size={20} color="#6B7280" />
              ) : (
                <ChevronDown size={20} color="#6B7280" />
              )}
            </View>
          </TouchableOpacity>

          {isContentExpanded && (
            <View className="mt-4 px-4 py-4 bg-gray-50 rounded-lg">
              <Text style={{ color: '#2F2F2F', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                문의 내용
              </Text>
              <Text style={{ color: '#4B5563', fontSize: 14, lineHeight: 20 }}>
                {support.content}
              </Text>
            </View>
          )}
        </View>

        {/* 답변 섹션 */}
        {support.reply && (
          <View className="px-4 mb-8">
            <TouchableOpacity
              onPress={() => setIsReplyExpanded(!isReplyExpanded)}
              className="border border-gray-200 rounded-lg px-4 py-4"
              style={{ backgroundColor: '#FAFAFA' }}
            >
              <View className="flex-row items-center justify-between">
                <Text style={{ color: '#2F2F2F', fontSize: 14 }}>답변</Text>
                {isReplyExpanded ? (
                  <ChevronUp size={20} color="#6B7280" />
                ) : (
                  <ChevronDown size={20} color="#6B7280" />
                )}
              </View>
            </TouchableOpacity>

            {isReplyExpanded && (
              <View className="mt-4 px-4 py-4 bg-gray-50 rounded-lg">
                <Text style={{ color: '#4B5563', fontSize: 14, lineHeight: 20 }}>
                  {support.reply}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
