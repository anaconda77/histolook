import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { alarmAPI, AlarmItem } from "@/services/alarm.api";

export default function AlarmScreen() {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 알림 리스트 조회
  const fetchAlarms = async (isRefresh = false) => {
    const accessToken = await AsyncStorage.getItem("accessToken");
    
    if (!accessToken) {
      Alert.alert("알림", "로그인이 필요한 서비스입니다.");
      router.back();
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await alarmAPI.getAlarms(accessToken);
      setAlarms(response.alarms);
    } catch (error: any) {
      console.error("알림 조회 실패:", error);
      
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
    }
  };

  useEffect(() => {
    fetchAlarms();
  }, []);

  // 알림 클릭 처리
  const handleAlarmPress = (alarm: AlarmItem) => {
    if (alarm.resourcePath) {
      router.push(alarm.resourcePath as any);
    }
  };

  // 알림 아이템 렌더링
  const renderAlarmItem = ({ item }: { item: AlarmItem }) => {
    return (
      <TouchableOpacity
        onPress={() => handleAlarmPress(item)}
        className="flex-row px-4 py-4 border-b border-gray-100"
        activeOpacity={0.7}
      >
        {/* 아바타 이미지 */}
        <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-3">
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Text className="text-gray-400 text-xs">👤</Text>
            </View>
          )}
        </View>

        {/* 알림 내용 */}
        <View className="flex-1 mr-3">
          <Text className="text-sm text-gray-800 mb-1">{item.content}</Text>
        </View>

        {/* 타임스탬프 */}
        <View className="items-end justify-center">
          <Text className="text-xs text-gray-500">{item.publishedAt}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 빈 상태 렌더링
  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-gray-500 text-base mt-4">
          알림이 없습니다
        </Text>
      </View>
    );
  };

  // 새로고침
  const handleRefresh = () => {
    fetchAlarms(true);
  };

  if (loading) {
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
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold ml-2">알림</Text>
        </View>
      </View>

      {/* 알림 리스트 */}
      <FlatList
        data={alarms}
        renderItem={renderAlarmItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
        }}
        ListEmptyComponent={renderEmptyState}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}
