import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, ChevronDown, MoreVertical } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { archiveAPI, MyArchiveItem } from "@/services/archive.api";

export default function MyArchiveScreen() {
  const [archives, setArchives] = useState<MyArchiveItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  // 내 아카이브 목록 조회
  const fetchArchives = async (pageNum: number, isRefresh = false) => {
    const accessToken = await AsyncStorage.getItem("accessToken");
    
    if (!accessToken) {
      Alert.alert("알림", "로그인이 필요한 서비스입니다.");
      router.back();
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

      const response = await archiveAPI.getMyArchives(pageNum, accessToken);

      if (isRefresh || pageNum === 1) {
        setArchives(response.archives);
      } else {
        setArchives((prev) => [...prev, ...response.archives]);
      }

      setPage(response.page);
      setHasNext(response.hasNext);
    } catch (error: any) {
      console.error("내 아카이브 조회 실패:", error);
      
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

  // 아카이브 삭제
  const handleDelete = async (archiveId: string) => {
    const accessToken = await AsyncStorage.getItem("accessToken");
    
    if (!accessToken) {
      Alert.alert("알림", "로그인이 필요한 서비스입니다.");
      return;
    }

    Alert.alert(
      "게시물 삭제",
      "정말로 이 게시물을 삭제하시겠습니까?",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await archiveAPI.deleteArchive(archiveId, accessToken);
              
              // 목록에서 제거
              setArchives((prev) => prev.filter((item) => item.archiveId !== archiveId));
              setMenuVisible(null);
              
              Alert.alert("성공", "게시물이 삭제되었습니다.");
            } catch (error: any) {
              console.error("아카이브 삭제 실패:", error);
              Alert.alert(
                "오류",
                error.response?.data?.message || "게시물 삭제에 실패했습니다."
              );
            }
          },
        },
      ]
    );
  };

  // 아카이브 수정
  const handleEdit = (archiveId: string) => {
    setMenuVisible(null);
    router.push(`/archive-edit/${archiveId}`);
  };

  // 아카이브 상세 페이지로 이동
  const handleArchivePress = (archiveId: string) => {
    router.push(`/archive-detail/${archiveId}`);
  };

  // 아카이브 아이템 렌더링
  const renderArchiveItem = ({ item }: { item: MyArchiveItem }) => {
    return (
      <TouchableOpacity
        onPress={() => handleArchivePress(item.archiveId)}
        className="flex-row px-4 py-4 border-b border-gray-100"
        activeOpacity={0.7}
      >
        {/* 썸네일 이미지 */}
        <View className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 mr-3">
          {item.imageUrls && item.imageUrls.length > 0 ? (
            <Image
              source={{ uri: item.imageUrls[0] }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Text className="text-gray-400 text-xs">이미지 없음</Text>
            </View>
          )}
        </View>

        {/* 중간 섹션 - 태그 및 스토리 */}
        <View className="flex-1 mr-3">
          {/* 태그들 */}
          <View className="flex-row flex-wrap mb-2" style={{ gap: 6 }}>
            <View className="px-2.5 py-1 rounded-full border border-gray-300 bg-white">
              <Text className="text-xs text-gray-700">{item.brand}</Text>
            </View>
            <View className="px-2.5 py-1 rounded-full border border-gray-300 bg-white">
              <Text className="text-xs text-gray-700">{item.timeline}</Text>
            </View>
            <View className="px-2.5 py-1 rounded-full border border-gray-300 bg-white">
              <Text className="text-xs text-gray-700">{item.category}</Text>
            </View>
          </View>

          {/* 스토리 텍스트 */}
          <Text 
            className="text-sm text-gray-800" 
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.story}
          </Text>
        </View>

        {/* 오른쪽 섹션 - 시간 및 메뉴 */}
        <View className="items-end justify-between" style={{ minHeight: 80 }}>
          <Text className="text-xs text-gray-500">{item.publishedAt}</Text>
          
          {/* 세로 점 메뉴 */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              setMenuVisible(item.archiveId);
            }}
            className="p-1"
            activeOpacity={0.6}
          >
            <MoreVertical size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 메뉴 모달 */}
        <Modal
          visible={menuVisible === item.archiveId}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(null)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/50 items-center justify-center"
            activeOpacity={1}
            onPress={() => setMenuVisible(null)}
          >
            <View className="bg-white rounded-2xl p-1 mx-8 w-64">
              <TouchableOpacity
                onPress={() => handleEdit(item.archiveId)}
                className="px-4 py-3"
                activeOpacity={0.7}
              >
                <Text className="text-base text-blue-600 text-center">게시물 수정</Text>
              </TouchableOpacity>
              
              <View className="h-px bg-gray-200" />
              
              <TouchableOpacity
                onPress={() => handleDelete(item.archiveId)}
                className="px-4 py-3"
                activeOpacity={0.7}
              >
                <Text className="text-base text-blue-600 text-center">게시물 삭제</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </TouchableOpacity>
    );
  };

  // 빈 상태 렌더링
  const renderEmptyState = () => {
    if (initialLoading) return null;

    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-gray-500 text-base mt-4">
          등록한 아카이브가 없습니다
        </Text>
        <Text className="text-gray-400 text-sm mt-2">
          첫 번째 아카이브를 등록해보세요
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
      <View className="px-4 pb-4 flex-row items-center justify-between border-b border-gray-100" style={{ paddingTop: 68 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold ml-2">내 아카이브</Text>
        </View>
        
        {/* 정렬 옵션 (최신순만) */}
        <TouchableOpacity className="flex-row items-center px-3 py-1.5">
          <Text className="text-sm text-gray-700 mr-1">최신순</Text>
          <ChevronDown size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 아카이브 리스트 */}
      <FlatList
        data={archives}
        renderItem={renderArchiveItem}
        keyExtractor={(item) => item.archiveId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
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
