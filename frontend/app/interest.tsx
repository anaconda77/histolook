import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Heart, ChevronLeft, Tag } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { archiveAPI, InterestArchiveItem } from "@/services/archive.api";

const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SPACING = 12;
const ITEM_WIDTH = (SCREEN_WIDTH - ITEM_SPACING * 3) / 2;

export default function InterestScreen() {
  const [archives, setArchives] = useState<InterestArchiveItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // 애니메이션을 위한 ref (각 아카이브별 애니메이션 값 저장)
  const shakeAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  // 관심 아카이브 목록 조회
  const fetchArchives = async (pageNum: number, isRefresh = false) => {
    const accessToken = await AsyncStorage.getItem("accessToken");
    
    if (!accessToken) {
      Alert.alert(
        "알림",
        "로그인이 필요한 서비스입니다.",
        [
          {
            text: "확인",
            onPress: () => router.back()
          }
        ]
      );
      return;
    }

    if (loading || (!isRefresh && !hasNext && pageNum > 1)) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const response = await archiveAPI.getInterestArchives(pageNum, accessToken);

      if (isRefresh || pageNum === 1) {
        setArchives(response.archives);
      } else {
        setArchives((prev) => [...prev, ...response.archives]);
      }

      setPage(response.page);
      setHasNext(response.hasNext);
    } catch (error: any) {
      console.error("관심 아카이브 조회 실패:", error);
      
      if (error.response?.status === 401) {
        Alert.alert(
          "알림",
          "로그인이 필요한 서비스입니다.",
          [
            {
              text: "확인",
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert(
          "오류",
          "페이지 로드하는데 실패했습니다.",
          [
            {
              text: "확인",
              onPress: () => router.back()
            }
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives(1);
  }, []);

  // 흔들림 애니메이션 실행 (강한 모션)
  const triggerShakeAnimation = (archiveId: string, onComplete?: () => void) => {
    // 애니메이션 값이 없으면 생성
    if (!shakeAnimations[archiveId]) {
      shakeAnimations[archiveId] = new Animated.Value(0);
    }

    const animation = shakeAnimations[archiveId];

    // 강한 애니메이션 시퀀스: 좌우로 더 많이 흔들림 (-20deg ~ +20deg, 7번)
    Animated.sequence([
      Animated.timing(animation, {
        toValue: -20,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 20,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: -20,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 20,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: -15,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 15,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 애니메이션 완료 후 콜백 실행
      if (onComplete) {
        onComplete();
      }
    });
  };

  // 하트 토글 핸들러
  const handleHeartToggle = async (archiveId: string) => {
    const accessToken = await AsyncStorage.getItem("accessToken");
    
    if (!accessToken) {
      Alert.alert("알림", "로그인이 필요한 서비스입니다.");
      return;
    }

    try {
      // 애니메이션 먼저 실행
      triggerShakeAnimation(archiveId, async () => {
        // 애니메이션 완료 후 관심 아카이브 삭제
        try {
          await archiveAPI.deleteInterest(archiveId, accessToken);
          
          // 로컬 상태 업데이트 - 해당 아이템 제거
          setArchives((prev) => prev.filter((item) => item.archiveId !== archiveId));
        } catch (error: any) {
          console.error("관심 아카이브 삭제 실패:", error);
          Alert.alert(
            "오류",
            error.response?.data?.message || "관심 아카이브 삭제에 실패했습니다."
          );
        }
      });
    } catch (error: any) {
      console.error("애니메이션 실행 실패:", error);
      // 애니메이션 실패 시에도 삭제 시도
      try {
        await archiveAPI.deleteInterest(archiveId, accessToken);
        setArchives((prev) => prev.filter((item) => item.archiveId !== archiveId));
      } catch (deleteError: any) {
        console.error("관심 아카이브 삭제 실패:", deleteError);
        Alert.alert(
          "오류",
          deleteError.response?.data?.message || "관심 아카이브 삭제에 실패했습니다."
        );
      }
    }
  };

  // 아카이브 상세 페이지로 이동
  const handleArchivePress = (archiveId: string) => {
    router.push(`/archive-detail/${archiveId}`);
  };

  // 아카이브 아이템 렌더링
  const renderArchiveItem = ({ item, index }: { item: InterestArchiveItem; index: number }) => {
    const isLeftColumn = index % 2 === 0;

    return (
      <TouchableOpacity
        key={item.archiveId}
        onPress={() => handleArchivePress(item.archiveId)}
        className="mb-3"
        style={{
          width: ITEM_WIDTH,
          marginLeft: isLeftColumn ? ITEM_SPACING : ITEM_SPACING / 2,
          marginRight: isLeftColumn ? ITEM_SPACING / 2 : ITEM_SPACING,
        }}
      >
        {/* 이미지 */}
        <View
          className="bg-gray-200 rounded-lg overflow-hidden relative"
          style={{
            width: ITEM_WIDTH,
            height: ITEM_WIDTH * 1.4,
          }}
        >
          {item.imageUrls && item.imageUrls.length > 0 ? (
            <Image
              source={{ uri: item.imageUrls[0] }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Text className="text-gray-400 text-sm">이미지 없음</Text>
            </View>
          )}
          
          {/* Tag 아이콘 - 이미지 우측 하단 */}
          <Animated.View
            className="absolute bottom-2.5 right-2.5"
            style={{
              transform: [
                {
                  rotate: shakeAnimations[item.archiveId]
                    ? shakeAnimations[item.archiveId].interpolate({
                        inputRange: [-20, 20],
                        outputRange: ['-20deg', '20deg'],
                      })
                    : '0deg',
                },
              ],
            }}
          >
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleHeartToggle(item.archiveId);
              }}
              className="w-9 h-9 rounded-full items-center justify-center"
              activeOpacity={0.7}
              style={{
                backgroundColor: '#2F2F2F',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Tag size={18} color="#ffffff" fill="transparent" strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* 더보기 메뉴 (3개의 점) - 이미지 하단 우측 */}
        <View className="flex-row justify-end pt-2 pb-1 pr-1">
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              // 여기에 더보기 메뉴 기능을 추가할 수 있습니다
            }}
            className="p-1.5"
            activeOpacity={0.6}
          >
            <View className="flex-row items-center" style={{ gap: 2 }}>
              <View className="w-1 h-1 bg-gray-600 rounded-full" />
              <View className="w-1 h-1 bg-gray-600 rounded-full" />
              <View className="w-1 h-1 bg-gray-600 rounded-full" />
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // 빈 상태 렌더링
  const renderEmptyState = () => {
    if (initialLoading) return null;

    return (
      <View className="flex-1 items-center justify-center py-20">
        <Tag size={64} color="#D1D5DB" />
        <Text className="text-gray-500 text-base mt-4">
          관심 아카이브가 없습니다
        </Text>
        <Text className="text-gray-400 text-sm mt-2">
          마음에 드는 아카이브에 하트를 눌러보세요
        </Text>
      </View>
    );
  };

  // 리스트 푸터 (로딩 인디케이터)
  const renderFooter = () => {
    if (!loading || refreshing) return null;

    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  };

  // 다음 페이지 로드
  const handleLoadMore = () => {
    if (hasNext && !loading) {
      fetchArchives(page + 1);
    }
  };

  // 새로고침
  const handleRefresh = () => {
    fetchArchives(1, true);
  };

  if (initialLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* 헤더 */}
      <View className="px-4 pb-4 flex-row items-center border-b border-gray-100" style={{ paddingTop: 68 }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-2">관심 아카이브</Text>
      </View>

      {/* 아카이브 리스트 */}
      <FlatList
        data={archives}
        renderItem={renderArchiveItem}
        keyExtractor={(item) => item.archiveId}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 20,
          flexGrow: 1,
        }}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}
