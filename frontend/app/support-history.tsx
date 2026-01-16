import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supportAPI, SupportPostListItem, SupportPostDetail } from '@/services/support.api';
import { useCallback } from 'react';

export default function SupportHistoryScreen() {
  const router = useRouter();
  const [supports, setSupports] = useState<SupportPostListItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<Record<string, SupportPostDetail>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSupports();
    }, [])
  );

  const loadSupports = async () => {
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

      const data = await supportAPI.getSupportList(accessToken);
      setSupports(data);
    } catch (error: any) {
      console.error('문의 내역 조회 실패:', error);
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
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadSupports();
  };

  const handleItemPress = async (supportPostId: string) => {
    if (expandedId === supportPostId) {
      // 이미 열려있으면 닫기
      setExpandedId(null);
      return;
    }

    // 새로운 항목 열기
    setExpandedId(supportPostId);

    // 상세 정보가 이미 로드되어 있으면 스킵
    if (detailData[supportPostId]) {
      return;
    }

    // 상세 정보 로드
    setLoadingDetails((prev) => ({ ...prev, [supportPostId]: true }));
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert('알림', '로그인이 필요한 서비스입니다.');
        return;
      }

      const detail = await supportAPI.getSupportDetail(supportPostId, accessToken); 
      setDetailData((prev) => ({ ...prev, [supportPostId]: detail }));
    } catch (error: any) {
      console.error('문의 상세 조회 실패:', error);
      Alert.alert('오류', '문의 내역을 불러오는데 실패했습니다.');
      setExpandedId(null);
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [supportPostId]: false }));
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
          <Text className="text-2xl font-bold ml-2">문의 내역</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {supports.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text style={{ color: '#9CA3AF', fontSize: 16 }}>등록된 문의가 없습니다.</Text>
          </View>
        ) : (
          <View className="px-4">
            {supports.map((support) => {
              const isExpanded = expandedId === support.supportPostId;
              const detail = detailData[support.supportPostId];
              const isLoadingDetail = loadingDetails[support.supportPostId];

              return (
                <View key={support.supportPostId} className="mb-6">
                  {/* 문의 제목 헤더 */}
                  <Text style={{ color: '#000000', fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
                    {support.supportType}
                  </Text>

                  {/* 문의 카드 */}
                  <View
                    className="border rounded-2xl overflow-hidden"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <TouchableOpacity
                      onPress={() => handleItemPress(support.supportPostId)}
                      className="px-5 py-4"
                      style={{ backgroundColor: '#FFFFFF' }}
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 mr-3">
                          <Text style={{ color: '#000000', fontSize: 15, lineHeight: 22, marginBottom: 0 }}>
                            {support.title}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <View
                            className="px-3 py-1 rounded-full mr-2"
                            style={{
                              backgroundColor: support.status === '답변 완료' ? '#E8F5E9' : '#FFF3E0',
                            }}
                          >
                            <Text
                              style={{
                                color: support.status === '답변 완료' ? '#2E7D32' : '#EF6C00',
                                fontSize: 13,
                                fontWeight: '600',
                              }}
                            >
                              {support.status}
                            </Text>
                          </View>
                          {isExpanded ? (
                            <ChevronUp size={22} color="#9CA3AF" />
                          ) : (
                            <ChevronDown size={22} color="#9CA3AF" />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* 확장된 내용 */}
                    {isExpanded && (
                      <View style={{ backgroundColor: '#F5F5F5' }}>
                        {isLoadingDetail ? (
                          <View className="py-8 items-center">
                            <ActivityIndicator size="small" color="#2F2F2F" />
                          </View>
                        ) : detail ? (
                          <View className="px-5 py-4">
                            {/* 문의 내용 */}
                            <View className="mb-6">
                              <Text style={{ color: '#000000', fontSize: 15, fontWeight: '700', marginBottom: 12 }}>
                                문의 내용
                              </Text>
                              <Text style={{ color: '#424242', fontSize: 14, lineHeight: 22 }}>
                                {detail.content}
                              </Text>
                            </View>

                            {/* 답변 */}
                            {detail.reply ? (
                              <View>
                                <Text style={{ color: '#000000', fontSize: 15, fontWeight: '700', marginBottom: 12 }}>
                                  답변
                                </Text>
                                <Text style={{ color: '#424242', fontSize: 14, lineHeight: 22 }}>
                                  {detail.reply}
                                </Text>
                              </View>
                            ) : (
                              <View>
                                <Text style={{ color: '#000000', fontSize: 15, fontWeight: '700', marginBottom: 12 }}>
                                  답변
                                </Text>
                                <Text style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 22 }}>
                                  답변 대기 중입니다.
                                </Text>
                              </View>
                            )}
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
