import { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Tag, Bell, ChevronDown, Heart, MoreHorizontal, Search, X } from 'lucide-react-native';
import { archiveAPI } from '@/services/archive.api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 좌우 패딩 16 + 카드 간격 16
const ITEMS_PER_PAGE = 15; // 페이지당 표시할 아이템 수

// 임시 아카이브 데이터
const MOCK_ARCHIVES = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    isInterested: false,
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    isInterested: true,
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1578932750355-5eb30ece2e26?w=400',
    isInterested: false,
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    isInterested: false,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [archives, setArchives] = useState(MOCK_ARCHIVES);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  
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

  // 관심 아카이브 토글
  const toggleInterest = (archiveId: string) => {
    setArchives(
      archives.map((archive) =>
        archive.id === archiveId
          ? { ...archive, isInterested: !archive.isInterested }
          : archive
      )
    );
  };

  // 아카이브 상세 페이지로 이동
  const navigateToDetail = (archiveId: string) => {
    // TODO: 아카이브 상세 페이지 구현 후 연결
    console.log('Navigate to archive:', archiveId);
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
          <Text className="text-3xl font-bold" style={{ color: '#2F2F2F' }}>HistoLook</Text>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity>
              <Tag size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity className="relative">
              <Bell size={24} color="#000" />
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">12</Text>
              </View>
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
            className="flex-row items-center gap-1 px-4 py-2.5 border border-gray-300 rounded-lg"
            onPress={() => openFilterModal('brand')}
          >
            <Text className="text-gray-700 font-medium">브랜드</Text>
            <ChevronDown size={16} color="#666" />
          </TouchableOpacity>

          {/* 타임라인 */}
          <TouchableOpacity
            className="flex-row items-center gap-1 px-4 py-2.5 border border-gray-300 rounded-lg"
            onPress={() => openFilterModal('timeline')}
          >
            <Text className="text-gray-700 font-medium">타임라인</Text>
            <ChevronDown size={16} color="#666" />
          </TouchableOpacity>

          {/* 카테고리 */}
          <TouchableOpacity
            className="flex-row items-center gap-1 px-4 py-2.5 border border-gray-300 rounded-lg"
            onPress={() => openFilterModal('category')}
          >
            <Text className="text-gray-700 font-medium">카테고리</Text>
            <ChevronDown size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 아카이브 그리드 */}
      <ScrollView className="flex-1 px-4 py-4">
        <View className="flex-row flex-wrap gap-4">
          {archives.map((archive) => (
            <View key={archive.id} style={{ width: CARD_WIDTH }}>
              {/* 아카이브 이미지 */}
              <TouchableOpacity
                onPress={() => navigateToDetail(archive.id)}
                activeOpacity={0.8}
              >
                <View className="relative rounded-2xl overflow-hidden bg-gray-100">
                  <Image
                    source={{ uri: archive.imageUrl }}
                    className="w-full aspect-[3/4]"
                    resizeMode="cover"
                  />
                  
                  {/* 관심 아카이브 버튼 */}
                  <TouchableOpacity
                    onPress={() => toggleInterest(archive.id)}
                    className="absolute bottom-2.5 right-2.5 w-9 h-9 bg-white/90 rounded-full items-center justify-center"
                    activeOpacity={0.7}
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.15,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  >
                    <Heart
                      size={18}
                      color={archive.isInterested ? '#ef4444' : '#666'}
                      fill={archive.isInterested ? '#ef4444' : 'transparent'}
                      strokeWidth={2.5}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* 더보기 메뉴 (3개의 점) - 이미지 하단 우측 */}
              <View className="flex-row justify-end pt-2 pb-1 pr-1">
                <TouchableOpacity
                  onPress={() => setMenuVisible(archive.id)}
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
                visible={menuVisible === archive.id}
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
                      className="py-4 px-6 border-b border-gray-100"
                      onPress={() => {
                        toggleInterest(archive.id);
                        setMenuVisible(null);
                      }}
                    >
                      <Text className="text-blue-600 text-base">
                        관심 아카이브 {archive.isInterested ? '해제' : '등록'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="py-4 px-6"
                      onPress={() => {
                        // TODO: 신고 기능 구현
                        setMenuVisible(null);
                      }}
                    >
                      <Text className="text-blue-600 text-base">게시물 신고</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
          ))}
        </View>
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
