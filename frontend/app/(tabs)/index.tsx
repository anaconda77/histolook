import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, usePathname, useFocusEffect, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Tag, Bell, ChevronDown, Heart, MoreHorizontal, Search, X } from 'lucide-react-native';
import { archiveAPI, ArchiveItem } from '@/services/archive.api';
import { alarmAPI } from '@/services/alarm.api';
import { registerForPushNotificationsAsync } from '@/utils/fcm';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 좌우 패딩 16 + 카드 간격 16
const ITEMS_PER_PAGE = 15; // 페이지당 표시할 아이템 수

export default function HomeScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [isLoadingArchives, setIsLoadingArchives] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false); // 에러 상태
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // 현재 사용자 ID
  const [alarmCount, setAlarmCount] = useState(0); // 알림 개수
  
  // 홈 화면이 포커스될 때 현재 경로를 저장 (아카이브 등록 화면으로 이동할 때 사용)
  const segments = useSegments();
  useFocusEffect(
    useCallback(() => {
      const canGoBack = router.canGoBack();
      const currentPath = pathname || '/(tabs)';
      
      // 네비게이션 히스토리 업데이트 (로그 없이)
      (async () => {
        const historyStr = await AsyncStorage.getItem('navigationHistory');
        let history: string[] = historyStr ? JSON.parse(historyStr) : [];
        
        // 현재 경로가 마지막과 다르면 추가
        if (history.length === 0 || history[history.length - 1] !== currentPath) {
          history.push(currentPath);
          // 최대 10개까지만 유지
          if (history.length > 10) {
            history = history.slice(-10);
          }
          await AsyncStorage.setItem('navigationHistory', JSON.stringify(history));
        }
      
      })();
      
      AsyncStorage.setItem('previousRoute', currentPath);
      
      // 홈화면 재로드 플래그 확인 (아카이브 등록/수정/삭제 시)
      (async () => {
        const shouldReload = await AsyncStorage.getItem('shouldReloadHome');
        if (shouldReload === 'true') {
          await AsyncStorage.removeItem('shouldReloadHome');
          loadArchives();
        }
      })();
      
      // 알림 개수 조회 및 FCM 토큰 등록
      (async () => {
        try {
          const accessToken = await AsyncStorage.getItem('accessToken');
          if (accessToken) {
            // 알림 개수 조회
            try {
              const alarmCountData = await alarmAPI.getAlarmCount(accessToken);
              setAlarmCount(alarmCountData.count);
            } catch (error) {
              console.error('알림 개수 조회 실패:', error);
              setAlarmCount(0);
            }
            
            // FCM 토큰 등록 (로그인 상태일 때만)
            try {
              await registerForPushNotificationsAsync();
            } catch (error) {
              console.error('FCM 토큰 등록 실패:', error);
              // 토큰 등록 실패해도 계속 진행
            }
          } else {
            setAlarmCount(0);
          }
        } catch (error) {
          console.error('알림 개수 조회 실패:', error);
          setAlarmCount(0);
        }
      })();
    }, [pathname, segments, router])
  );
  
  // 필터 모달 상태
  const [filterModalType, setFilterModalType] = useState<'brand' | 'timeline' | 'category' | null>(null);
  
  // 선택된 필터 (임시 상태)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTimelines, setSelectedTimelines] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // 임시 선택 상태 (모달 내에서만 사용)
  const [tempSelectedBrands, setTempSelectedBrands] = useState<string[]>([]);
  const [tempSelectedTimelines, setTempSelectedTimelines] = useState<string[]>([]);
  const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>([]);
  
  // 브랜드 검색
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  
  // API 데이터
  const [brands, setBrands] = useState<string[]>([]);
  const [timelines, setTimelines] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 페이지네이션
  const [currentBrandPage, setCurrentBrandPage] = useState(0);
  const [currentTimelinePage, setCurrentTimelinePage] = useState(0);
  const [currentCategoryPage, setCurrentCategoryPage] = useState(0);
  
  const brandFlatListRef = useRef<FlatList>(null);
  const timelineFlatListRef = useRef<FlatList>(null);
  const categoryFlatListRef = useRef<FlatList>(null);

  // 아카이브 리스트 로드
  const loadArchives = async () => {
    setIsLoadingArchives(true);
    setHasError(false);
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const memberId = await AsyncStorage.getItem('memberId');
      setCurrentUserId(memberId);
      
      const response = await archiveAPI.getArchives(
        {
          page: 1,
          brand: selectedBrands.length > 0 ? selectedBrands[0] : undefined,
          timeline: selectedTimelines.length > 0 ? selectedTimelines[0] : undefined,
          category: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
        },
        accessToken || undefined
      );
      setArchives(response.archives);
      setHasError(false);
    } catch (error) {
      console.error('아카이브 로드 실패:', error);
      setArchives([]);
      setHasError(true);
    } finally {
      setIsLoadingArchives(false);
    }
  };

  // 초기 로드 및 필터 변경 시에만 아카이브 로드
  useEffect(() => {
    loadArchives();
  }, [selectedBrands, selectedTimelines, selectedCategories]);

  // 당겨서 새로고침
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setHasError(false);
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await archiveAPI.getArchives(
        {
          page: 1,
          brand: selectedBrands.length > 0 ? selectedBrands[0] : undefined,
          timeline: selectedTimelines.length > 0 ? selectedTimelines[0] : undefined,
          category: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
        },
        accessToken || undefined
      );
      setArchives(response.archives);
      setHasError(false);
    } catch (error) {
      console.error('아카이브 새로고침 실패:', error);
      setHasError(true);
    } finally {
      setRefreshing(false);
    }
  }, [selectedBrands, selectedTimelines, selectedCategories]);

  // 관심 아카이브 토글
  const toggleInterest = async (archiveId: string) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (!accessToken) {
      Alert.alert('알림', '로그인이 필요한 서비스입니다.');
      return;
    }

    // 현재 상태 확인
    const targetArchive = archives.find((a) => a.archiveId === archiveId);
    if (!targetArchive) return;

    const wasInterest = targetArchive.isInterest;

    try {
      // 낙관적 업데이트: UI 먼저 업데이트
      setArchives(
        archives.map((archive) =>
          archive.archiveId === archiveId
            ? { ...archive, isInterest: !archive.isInterest }
            : archive
        )
      );

      // API 호출
      if (wasInterest) {
        await archiveAPI.deleteInterest(archiveId, accessToken);
      } else {
        await archiveAPI.addInterest(archiveId, accessToken);
      }
    } catch (error: any) {
      console.error('관심 아카이브 토글 실패:', error);
      
      // 실패 시 롤백
      setArchives(
        archives.map((archive) =>
          archive.archiveId === archiveId
            ? { ...archive, isInterest: wasInterest }
            : archive
        )
      );

      Alert.alert(
        '오류',
        error.response?.data?.message || '관심 아카이브 처리에 실패했습니다.'
      );
    }
  };

  // 아카이브 상세 페이지로 이동
  const navigateToDetail = (archiveId: string) => {
    router.push(`/archive-detail/${archiveId}`);
  };

  // 브랜드 목록 로드
  const loadBrands = async () => {
    setIsLoading(true);
    try {
      const result = await archiveAPI.getBrands();
      setBrands(result);
    } catch (error) {
      console.error('브랜드 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 타임라인 목록 로드
  const loadTimelines = async () => {
    setIsLoading(true);
    try {
      const result = await archiveAPI.getTimelines();
      setTimelines(result);
    } catch (error) {
      console.error('타임라인 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 카테고리 목록 로드
  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const result = await archiveAPI.getCategories();
      setCategories(result);
    } catch (error) {
      console.error('카테고리 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 필터 모달 열기
  const openFilterModal = async (type: 'brand' | 'timeline' | 'category') => {
    if (type === 'brand') {
      setTempSelectedBrands([...selectedBrands]);
      setBrandSearchQuery('');
      if (brands.length === 0) {
        await loadBrands();
      }
    } else if (type === 'timeline') {
      setTempSelectedTimelines([...selectedTimelines]);
      if (timelines.length === 0) {
        await loadTimelines();
      }
    } else if (type === 'category') {
      setTempSelectedCategories([...selectedCategories]);
      if (categories.length === 0) {
        await loadCategories();
      }
    }
    setFilterModalType(type);
  };

  // 필터 적용
  const applyFilter = () => {
    if (filterModalType === 'brand') {
      setSelectedBrands(tempSelectedBrands);
      // TODO: API 호출로 아카이브 리스트 재조회
      console.log('Apply brand filter:', tempSelectedBrands);
    } else if (filterModalType === 'timeline') {
      setSelectedTimelines(tempSelectedTimelines);
      // TODO: API 호출로 아카이브 리스트 재조회
      console.log('Apply timeline filter:', tempSelectedTimelines);
    } else if (filterModalType === 'category') {
      setSelectedCategories(tempSelectedCategories);
      // TODO: API 호출로 아카이브 리스트 재조회
      console.log('Apply category filter:', tempSelectedCategories);
    }
    setFilterModalType(null);
  };

  // 필터 토글
  const toggleFilter = (type: 'brand' | 'timeline' | 'category', value: string) => {
    if (type === 'brand') {
      setTempSelectedBrands((prev) =>
        prev.includes(value) ? prev.filter((b) => b !== value) : [...prev, value]
      );
    } else if (type === 'timeline') {
      setTempSelectedTimelines((prev) =>
        prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
      );
    } else if (type === 'category') {
      setTempSelectedCategories((prev) =>
        prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
      );
    }
  };

  // 브랜드 검색 필터링
  const filteredBrands = brandSearchQuery
    ? brands.filter((brand) =>
        brand.toLowerCase().includes(brandSearchQuery.toLowerCase())
      )
    : brands;

  // 페이지별로 아이템 나누기
  const getBrandPages = () => {
    const totalPages = Math.ceil(filteredBrands.length / ITEMS_PER_PAGE);
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      pages.push(filteredBrands.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE));
    }
    return pages;
  };

  const getTimelinePages = () => {
    const totalPages = Math.ceil(timelines.length / ITEMS_PER_PAGE);
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      pages.push(timelines.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE));
    }
    return pages;
  };

  const getCategoryPages = () => {
    const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      pages.push(categories.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE));
    }
    return pages;
  };

  const brandPages = getBrandPages();
  const timelinePages = getTimelinePages();
  const categoryPages = getCategoryPages();

  // 검색 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentBrandPage(0);
    if (brandFlatListRef.current && brandPages.length > 0) {
      try {
        brandFlatListRef.current.scrollToIndex({ index: 0, animated: false });
      } catch (error) {
        // FlatList가 아직 레이아웃되지 않은 경우 무시
      }
    }
  }, [brandSearchQuery]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* 헤더 */}
      <View className="px-4 pb-4 border-b border-gray-100" style={{ paddingTop: 68 }}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-3xl font-bold" style={{ color: '#2F2F2F', fontFamily: 'Righteous' }}>HistoLook</Text>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={() => router.push('/interest')}>
              <Tag size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="relative"
              onPress={() => router.push('/alarm')}
            >
              <Bell size={24} color="#000" />
              {alarmCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs font-bold">{alarmCount > 99 ? '99+' : alarmCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 필터 영역 */}
        <View className="flex-row items-center gap-2">
          {/* 필터 아이콘 (3줄 메뉴) - 버튼이 아님 */}
          <View className="w-10 h-10 items-center justify-center border border-gray-300 rounded-lg bg-white">
            <View className="w-4 items-center justify-center" style={{ gap: 2.5 }}>
              <View className="w-full bg-gray-800 rounded-full" style={{ height: 1.5 }} />
              <View className="w-full bg-gray-800 rounded-full" style={{ height: 1.5 }} />
              <View className="w-full bg-gray-800 rounded-full" style={{ height: 1.5 }} />
            </View>
          </View>

          {/* 브랜드 */}
          <TouchableOpacity
            className="flex-row items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg"
            onPress={() => openFilterModal('brand')}
          >
            <Text className="text-gray-700 font-medium">브랜드</Text>
            <ChevronDown size={16} color="#666" />
          </TouchableOpacity>

          {/* 타임라인 */}
          <TouchableOpacity
            className="flex-row items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg"
            onPress={() => openFilterModal('timeline')}
          >
            <Text className="text-gray-700 font-medium">타임라인</Text>
            <ChevronDown size={16} color="#666" />
          </TouchableOpacity>

          {/* 카테고리 */}
          <TouchableOpacity
            className="flex-row items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg"
            onPress={() => openFilterModal('category')}
          >
            <Text className="text-gray-700 font-medium">카테고리</Text>
            <ChevronDown size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 아카이브 그리드 */}
      <ScrollView 
        className="flex-1 px-4 py-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2F2F2F']}
            tintColor="#2F2F2F"
          />
        }
      >
        {isLoadingArchives ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#2F2F2F" />
            <Text className="text-gray-500 mt-4">아카이브 로딩 중...</Text>
          </View>
        ) : hasError ? (
          // 에러 상태
          <View className="flex-1 items-center justify-center py-20">
            <View className="items-center" style={{ gap: 16 }}>
              <View 
                className="rounded-full items-center justify-center"
                style={{ 
                  width: 80, 
                  height: 80, 
                  backgroundColor: '#F5F5F5' 
                }}
              >
                <Text style={{ fontSize: 36 }}>⚠️</Text>
              </View>
              <View className="items-center" style={{ gap: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#2F2F2F' }}>
                  오류가 발생했습니다
                </Text>
                <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 40 }}>
                  네트워크 연결을 확인하거나{'\n'}잠시 후 다시 시도해주세요
                </Text>
              </View>
              <TouchableOpacity
                onPress={loadArchives}
                style={{
                  backgroundColor: '#2F2F2F',
                  paddingVertical: 12,
                  paddingHorizontal: 32,
                  borderRadius: 8,
                  marginTop: 8
                }}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                  다시 시도
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : archives.length === 0 ? (
          // 검색 결과 없음
          <View className="flex-1 items-center justify-center py-20">
            <View className="items-center" style={{ gap: 16 }}>
              <View 
                className="rounded-full items-center justify-center"
                style={{ 
                  width: 80, 
                  height: 80, 
                  backgroundColor: '#F5F5F5' 
                }}
              >
                <Text style={{ fontSize: 36 }}>🔍</Text>
              </View>
              <View className="items-center" style={{ gap: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#2F2F2F' }}>
                  검색 결과가 없습니다
                </Text>
                <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 40 }}>
                  다른 필터 조건으로{'\n'}다시 검색해보세요
                </Text>
              </View>
              <View className="items-center" style={{ gap: 12, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={async () => {
                    // 현재 경로를 저장하여 나중에 돌아올 수 있도록 함
                    await AsyncStorage.setItem('previousRoute', '/(tabs)');
                    router.push('/(tabs)/create');
                  }}
                  style={{
                    backgroundColor: '#2F2F2F',
                    paddingVertical: 12,
                    paddingHorizontal: 32,
                    borderRadius: 8
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                    아카이브 등록하기
                  </Text>
                </TouchableOpacity>
                {(selectedBrands.length > 0 || selectedTimelines.length > 0 || selectedCategories.length > 0) && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedBrands([]);
                      setSelectedTimelines([]);
                      setSelectedCategories([]);
                    }}
                    style={{
                      backgroundColor: 'white',
                      paddingVertical: 12,
                      paddingHorizontal: 32,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#2F2F2F'
                    }}
                  >
                    <Text style={{ color: '#2F2F2F', fontSize: 16, fontWeight: '600' }}>
                      필터 초기화
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-4">
            {archives.map((archive) => (
              <View key={archive.archiveId} style={{ width: CARD_WIDTH }}>
                {/* 아카이브 이미지 */}
                <TouchableOpacity
                  onPress={() => navigateToDetail(archive.archiveId)}
                  activeOpacity={0.8}
                >
                  <View className="relative rounded-2xl overflow-hidden bg-gray-100">
                    {archive.imageUrls && archive.imageUrls.length > 0 && archive.imageUrls[0] ? (
        <Image
                        source={{ uri: archive.imageUrls[0] }}
                        className="w-full aspect-[3/4]"
                        resizeMode="cover"
                        onError={(e) => {
                          console.error('이미지 로드 실패:', archive.imageUrls[0], e.nativeEvent.error);
                        }}
                      />
                    ) : (
                      <View className="w-full aspect-[3/4] items-center justify-center bg-gray-200">
                        <Text style={{ color: '#999', fontSize: 14 }}>이미지 없음</Text>
                      </View>
                    )}
                    
                    {/* 관심 아카이브 버튼 */}
                    <TouchableOpacity
                      onPress={() => toggleInterest(archive.archiveId)}
                      className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full items-center justify-center"
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: archive.isInterest ? '#2F2F2F' : 'rgba(255, 255, 255, 0.7)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.15,
                        shadowRadius: 2,
                        elevation: 2,
                      }}
                    >
                      <Tag
                        size={18}
                        color={archive.isInterest ? '#ffffff' : '#2F2F2F'}
                        fill="transparent"
                        strokeWidth={2.5}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {/* 더보기 메뉴 (3개의 점) - 이미지 하단 우측 */}
                <View className="flex-row justify-end pt-2 pb-1 pr-1">
                  <TouchableOpacity
                    onPress={() => {
                      console.log('🔍 [홈화면 메뉴] 작성자 확인:');
                      console.log('  - currentUserId:', currentUserId);
                      console.log('  - archive.authorId:', archive.authorId);
                      console.log('  - 작성자 여부:', currentUserId === archive.authorId);
                      setMenuVisible(archive.archiveId);
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

                {/* 메뉴 모달 */}
                <Modal
                  visible={menuVisible === archive.archiveId}
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
                      {currentUserId === archive.authorId ? (
                        /* 작성자인 경우 - 게시물 수정/삭제만 표시 */
                        <>
                          <TouchableOpacity
                            className="py-4 px-6 border-b border-gray-100"
                            onPress={() => {
                              setMenuVisible(null);
                              router.push(`/archive-edit/${archive.archiveId}`);
                            }}
                          >
                            <Text className="text-blue-500 text-base text-center">
                              게시물 수정
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="py-4 px-6"
                            onPress={() => {
                              setMenuVisible(null);
                              Alert.alert(
                                '게시물 삭제',
                                '정말로 이 게시물을 삭제하시겠습니까?',
                                [
                                  {
                                    text: '취소',
                                    style: 'cancel',
                                  },
                                  {
                                    text: '삭제',
                                    style: 'destructive',
                                    onPress: async () => {
                                      try {
                                        const accessToken = await AsyncStorage.getItem('accessToken');
                                        if (!accessToken) {
                                          Alert.alert('오류', '로그인이 필요합니다.');
                                          return;
                                        }
                                        await archiveAPI.deleteArchive(archive.archiveId, accessToken);
                                        Alert.alert('성공', '게시물이 삭제되었습니다.');
                                        // 홈화면 재로드 플래그 설정 (다른 화면으로 갔다가 돌아올 때를 대비)
                                        await AsyncStorage.setItem('shouldReloadHome', 'true');
                                        loadArchives(); // 즉시 목록 새로고침
                                      } catch (error: any) {
                                        console.error('게시물 삭제 실패:', error);
                                        Alert.alert('오류', error.response?.data?.message || '게시물 삭제에 실패했습니다.');
                                      }
                                    },
                                  },
                                ]
                              );
                            }}
                          >
                            <Text className="text-blue-500 text-base text-center">
                              게시물 삭제
                            </Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        /* 작성자가 아닌 경우 - 관심 아카이브 등록/해제, 게시물 신고 */
                        <>
                          <TouchableOpacity
                            className="py-4 px-6 border-b border-gray-100"
                            onPress={() => {
                              toggleInterest(archive.archiveId);
                              setMenuVisible(null);
                            }}
                          >
                            <Text className="text-blue-500 text-base text-center">
                              관심 아카이브 {archive.isInterest ? '해제' : '등록'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="py-4 px-6"
                            onPress={() => {
                              // TODO: 신고 기능 구현
                              setMenuVisible(null);
                            }}
                          >
                            <Text className="text-blue-500 text-base text-center">게시물 신고</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </Modal>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 필터 모달 */}
      <Modal
        visible={filterModalType !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalType(null)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setFilterModalType(null)}
        >
          <View className="flex-1 justify-end">
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View className="bg-white rounded-t-3xl">
                {/* 브랜드 필터 */}
                {filterModalType === 'brand' && (
                  <View className="px-6 pt-6 pb-8" style={{ minHeight: 550 }}>
                    <Text className="text-2xl font-bold mb-5" style={{ color: '#2F2F2F' }}>브랜드</Text>
                    
                    {/* 검색창 */}
                    <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3 mb-4">
                      <Search size={20} color="#999" />
                      <TextInput
                        className="flex-1 ml-2 text-base text-gray-700"
                        placeholder="브랜드를 검색하세요"
                        placeholderTextColor="#999"
                        value={brandSearchQuery}
                        onChangeText={setBrandSearchQuery}
                      />
                    </View>

                    {/* 선택된 브랜드 표시 */}
                    {tempSelectedBrands.length > 0 && (
                      <View className="flex-row flex-wrap gap-2 mb-4">
                        {tempSelectedBrands.map((brand) => (
                          <View key={brand} className="flex-row items-center bg-white border border-gray-300 rounded-full px-3 py-1.5">
                            <Text className="text-sm text-gray-700 mr-1.5">{brand}</Text>
                            <TouchableOpacity onPress={() => toggleFilter('brand', brand)}>
                              <X size={16} color="#666" strokeWidth={2} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* 브랜드 리스트 with Pagination */}
                    {isLoading ? (
                      <View className="py-10 items-center justify-center">
                        <ActivityIndicator size="large" color="#2F2F2F" />
                      </View>
                    ) : (
                      <>
                        <View style={{ height: 300 }}>
                          {brandPages.length > 0 ? (
                            <FlatList
                              ref={brandFlatListRef}
                              data={brandPages}
                              horizontal
                              pagingEnabled
                              showsHorizontalScrollIndicator={false}
                              nestedScrollEnabled
                              onMomentumScrollEnd={(event) => {
                                const pageIndex = Math.round(
                                  event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
                                );
                                setCurrentBrandPage(pageIndex);
                              }}
                              keyExtractor={(item, index) => `brand-page-${index}`}
                              renderItem={({ item: pageBrands, index }) => (
                                <View style={{ width: width - 48 }} className="flex-row flex-wrap gap-2">
                                  {index === 0 && (
                                    <TouchableOpacity
                                      className={`px-5 py-2.5 rounded-full ${
                                        tempSelectedBrands.length === 0 ? '' : 'bg-gray-200'
                                      }`}
                                      style={tempSelectedBrands.length === 0 ? { backgroundColor: '#2F2F2F' } : undefined}
                                      onPress={() => setTempSelectedBrands([])}
                                    >
                                      <Text
                                        className={`font-medium text-sm ${
                                          tempSelectedBrands.length === 0 ? 'text-white' : 'text-gray-700'
                                        }`}
                                      >
                                        All
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                  {pageBrands.map((brand: string) => (
                                    <TouchableOpacity
                                      key={brand}
                                      className={`px-5 py-2.5 rounded-full ${
                                        tempSelectedBrands.includes(brand) ? '' : 'bg-gray-200'
                                      }`}
                                      style={tempSelectedBrands.includes(brand) ? { backgroundColor: '#2F2F2F' } : undefined}
                                      onPress={() => toggleFilter('brand', brand)}
                                    >
                                      <Text
                                        className={`font-medium text-sm ${
                                          tempSelectedBrands.includes(brand) ? 'text-white' : 'text-gray-700'
                                        }`}
                                      >
                                        {brand}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              )}
                            />
                          ) : (
                            <View className="py-10 items-center justify-center">
                              <Text className="text-gray-500">브랜드가 없습니다</Text>
                            </View>
                          )}
                        </View>

                        {/* Page Indicators */}
                        {brandPages.length > 1 && (
                          <View className="flex-row justify-center items-center mt-4 gap-2">
                            {brandPages.map((_, index) => (
                              <View
                                key={index}
                                className={`h-2 rounded-full ${
                                  index === currentBrandPage ? 'w-6' : 'w-2 bg-gray-300'
                                }`}
                                style={index === currentBrandPage ? { backgroundColor: '#2F2F2F' } : undefined}
                              />
                            ))}
                          </View>
                        )}
                      </>
                    )}

                    {/* 적용 버튼 */}
                    <TouchableOpacity
                      className="rounded-2xl py-4 items-center mt-6"
                      style={{ backgroundColor: '#2F2F2F' }}
                      onPress={applyFilter}
                    >
                      <Text className="text-white text-base font-semibold">
                        {tempSelectedBrands.length > 0
                          ? `${tempSelectedBrands.length}건의 브랜드 적용하기`
                          : '적용하기'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 타임라인 필터 */}
                {filterModalType === 'timeline' && (
                  <View className="px-6 pt-6 pb-8" style={{ minHeight: 500 }}>
                    <Text className="text-2xl font-bold mb-5" style={{ color: '#2F2F2F' }}>타임라인</Text>

                    {/* 타임라인 리스트 with Pagination */}
                    {isLoading ? (
                      <View className="py-10 items-center justify-center">
                        <ActivityIndicator size="large" color="#2F2F2F" />
                      </View>
                    ) : (
                      <>
                        <View style={{ height: 300 }}>
                          {timelinePages.length > 0 ? (
                            <FlatList
                              ref={timelineFlatListRef}
                              data={timelinePages}
                              horizontal
                              pagingEnabled
                              showsHorizontalScrollIndicator={false}
                              nestedScrollEnabled
                              onMomentumScrollEnd={(event) => {
                                const pageIndex = Math.round(
                                  event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
                                );
                                setCurrentTimelinePage(pageIndex);
                              }}
                              keyExtractor={(item, index) => `timeline-page-${index}`}
                              renderItem={({ item: pageTimelines, index }) => (
                                <View style={{ width: width - 48 }} className="flex-row flex-wrap gap-2">
                                  {index === 0 && (
                                    <TouchableOpacity
                                      className={`px-5 py-2.5 rounded-full ${
                                        tempSelectedTimelines.length === 0 ? '' : 'bg-gray-200'
                                      }`}
                                      style={tempSelectedTimelines.length === 0 ? { backgroundColor: '#2F2F2F' } : undefined}
                                      onPress={() => setTempSelectedTimelines([])}
                                    >
                                      <Text
                                        className={`font-medium text-sm ${
                                          tempSelectedTimelines.length === 0 ? 'text-white' : 'text-gray-700'
                                        }`}
                                      >
                                        All
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                  {pageTimelines.map((timeline: string) => (
                                    <TouchableOpacity
                                      key={timeline}
                                      className={`px-5 py-2.5 rounded-full ${
                                        tempSelectedTimelines.includes(timeline) ? '' : 'bg-gray-200'
                                      }`}
                                      style={tempSelectedTimelines.includes(timeline) ? { backgroundColor: '#2F2F2F' } : undefined}
                                      onPress={() => toggleFilter('timeline', timeline)}
                                    >
                                      <Text
                                        className={`font-medium text-sm ${
                                          tempSelectedTimelines.includes(timeline) ? 'text-white' : 'text-gray-700'
                                        }`}
                                      >
                                        {timeline}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              )}
                            />
                          ) : (
                            <View className="py-10 items-center justify-center">
                              <Text className="text-gray-500">타임라인이 없습니다</Text>
                            </View>
                          )}
                        </View>

                        {/* Page Indicators */}
                        {timelinePages.length > 1 && (
                          <View className="flex-row justify-center items-center mt-4 gap-2">
                            {timelinePages.map((_, index) => (
                              <View
                                key={index}
                                className={`h-2 rounded-full ${
                                  index === currentTimelinePage ? 'w-6' : 'w-2 bg-gray-300'
                                }`}
                                style={index === currentTimelinePage ? { backgroundColor: '#2F2F2F' } : undefined}
                              />
                            ))}
                          </View>
                        )}
                      </>
                    )}

                    {/* 적용 버튼 */}
                    <TouchableOpacity
                      className="rounded-2xl py-4 items-center mt-6"
                      style={{ backgroundColor: '#2F2F2F' }}
                      onPress={applyFilter}
                    >
                      <Text className="text-white text-base font-semibold">적용하기</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 카테고리 필터 */}
                {filterModalType === 'category' && (
                  <View className="px-6 pt-6 pb-8" style={{ minHeight: 500 }}>
                    <Text className="text-2xl font-bold mb-5" style={{ color: '#2F2F2F' }}>카테고리</Text>

                    {/* 카테고리 리스트 with Pagination */}
                    {isLoading ? (
                      <View className="py-10 items-center justify-center">
                        <ActivityIndicator size="large" color="#2F2F2F" />
                      </View>
                    ) : (
                      <>
                        <View style={{ height: 300 }}>
                          {categoryPages.length > 0 ? (
                            <FlatList
                              ref={categoryFlatListRef}
                              data={categoryPages}
                              horizontal
                              pagingEnabled
                              showsHorizontalScrollIndicator={false}
                              nestedScrollEnabled
                              onMomentumScrollEnd={(event) => {
                                const pageIndex = Math.round(
                                  event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
                                );
                                setCurrentCategoryPage(pageIndex);
                              }}
                              keyExtractor={(item, index) => `category-page-${index}`}
                              renderItem={({ item: pageCategories, index }) => (
                                <View style={{ width: width - 48 }} className="flex-row flex-wrap gap-2">
                                  {index === 0 && (
                                    <TouchableOpacity
                                      className={`px-5 py-2.5 rounded-full ${
                                        tempSelectedCategories.length === 0 ? '' : 'bg-gray-200'
                                      }`}
                                      style={tempSelectedCategories.length === 0 ? { backgroundColor: '#2F2F2F' } : undefined}
                                      onPress={() => setTempSelectedCategories([])}
                                    >
                                      <Text
                                        className={`font-medium text-sm ${
                                          tempSelectedCategories.length === 0 ? 'text-white' : 'text-gray-700'
                                        }`}
                                      >
                                        All
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                  {pageCategories.map((category: string) => (
                                    <TouchableOpacity
                                      key={category}
                                      className={`px-5 py-2.5 rounded-full ${
                                        tempSelectedCategories.includes(category) ? '' : 'bg-gray-200'
                                      }`}
                                      style={tempSelectedCategories.includes(category) ? { backgroundColor: '#2F2F2F' } : undefined}
                                      onPress={() => toggleFilter('category', category)}
                                    >
                                      <Text
                                        className={`font-medium text-sm ${
                                          tempSelectedCategories.includes(category) ? 'text-white' : 'text-gray-700'
                                        }`}
                                      >
                                        {category}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              )}
                            />
                          ) : (
                            <View className="py-10 items-center justify-center">
                              <Text className="text-gray-500">카테고리가 없습니다</Text>
                            </View>
                          )}
                        </View>

                        {/* Page Indicators */}
                        {categoryPages.length > 1 && (
                          <View className="flex-row justify-center items-center mt-4 gap-2">
                            {categoryPages.map((_, index) => (
                              <View
                                key={index}
                                className={`h-2 rounded-full ${
                                  index === currentCategoryPage ? 'w-6' : 'w-2 bg-gray-300'
                                }`}
                                style={index === currentCategoryPage ? { backgroundColor: '#2F2F2F' } : undefined}
                              />
                            ))}
                          </View>
                        )}
                      </>
                    )}

                    {/* 적용 버튼 */}
                    <TouchableOpacity
                      className="rounded-2xl py-4 items-center mt-6"
                      style={{ backgroundColor: '#2F2F2F' }}
                      onPress={applyFilter}
                    >
                      <Text className="text-white text-base font-semibold">적용하기</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
