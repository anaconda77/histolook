import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Switch,
  Modal,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect, useSegments, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { X, Camera } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { archiveAPI } from '@/services/archive.api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MAX_IMAGES = 10;
const MAX_STORY_LENGTH = 1000;

export default function EditArchiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [images, setImages] = useState<string[]>([]);
  const [story, setStory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedTimeline, setSelectedTimeline] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isJudgementAllow, setIsJudgementAllow] = useState(false);
  const [isPriceJudgementAllow, setIsPriceJudgementAllow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 필터 모달 상태
  const [filterModalType, setFilterModalType] = useState<'brand' | 'timeline' | 'category' | null>(null);
  const [filterOptions, setFilterOptions] = useState<string[]>([]);
  const [filterSearch, setFilterSearch] = useState('');
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);

  // 슬라이드 애니메이션
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  
  // 이전 화면 경로 저장
  const previousRouteRef = useRef<string | null>(null);
  
  // SafeArea insets
  const insets = useSafeAreaInsets();

  // 기존 아카이브 데이터 로드
  useEffect(() => {
    loadArchiveData();
  }, [id]);

  const loadArchiveData = async () => {
    try {
      setIsLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert('알림', '로그인이 필요합니다.');
        router.back();
        return;
      }

      const archiveDetail = await archiveAPI.getArchiveDetail(id, accessToken);
      
      setImages(archiveDetail.imageUrls || []);
      setStory(archiveDetail.story);
      setSelectedBrand(archiveDetail.brand);
      setSelectedTimeline(archiveDetail.timeline);
      setSelectedCategory(archiveDetail.category);
      setIsJudgementAllow(archiveDetail.isJudgementAllow);
      setIsPriceJudgementAllow(archiveDetail.isPriceJudgementAllow);
    } catch (error: any) {
      console.error('아카이브 데이터 로드 실패:', error);
      setIsLoading(false);
      Alert.alert(
        '오류',
        '페이지 로드하는데 실패했습니다.',
        [
          {
            text: '확인',
            onPress: () => router.back()
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 선택 권한 요청
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
      }
    })();
  }, []);

  // 화면 진입 시 아래에서 위로 슬라이드 애니메이션
  const pathname = usePathname();
  const segments = useSegments();
  
  useFocusEffect(
    useCallback(() => {
      const canGoBack = router.canGoBack();
      console.log('📱 [아카이브 수정 화면] 진입');
      console.log('  - pathname:', pathname);
      console.log('  - segments:', segments);
      console.log('  - canGoBack:', canGoBack);
      console.log('  - archiveId:', id);
      
      (async () => {
        const route = await AsyncStorage.getItem('previousRoute');
        if (route) {
          previousRouteRef.current = route;
          console.log('  - 저장된 이전 경로:', route);
        } else {
          console.log('  - 저장된 이전 경로: 없음');
        }
        
        const currentPath = `/archive-edit/${id}`;
        const historyStr = await AsyncStorage.getItem('navigationHistory');
        let history: string[] = historyStr ? JSON.parse(historyStr) : [];
        
        if (history.length === 0 || history[history.length - 1] !== currentPath) {
          history.push(currentPath);
          if (history.length > 10) {
            history = history.slice(-10);
          }
          await AsyncStorage.setItem('navigationHistory', JSON.stringify(history));
        }
        
        console.log('  - 호출 스택 리스트:');
        if (history.length > 0) {
          history.forEach((path, index) => {
            console.log(`    ${index + 1}. ${path}${index === history.length - 1 ? ' (현재)' : ''}`);
          });
        } else {
          console.log('    (스택이 비어있음)');
        }
      })();

      // 애니메이션 초기화 및 시작
      slideAnim.setValue(SCREEN_HEIGHT);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      return () => {
        slideAnim.stopAnimation();
      };
    }, [pathname, segments, router, id])
  );

  // 이미지 선택
  const pickImage = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('알림', `최대 ${MAX_IMAGES}개까지 첨부할 수 있습니다.`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: MAX_IMAGES - images.length,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      Alert.alert('오류', '이미지를 선택할 수 없습니다.');
    }
  };

  // 이미지 제거
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // 필터 옵션 로드
  const loadFilterOptions = async (type: 'brand' | 'timeline' | 'category') => {
    setIsLoadingFilters(true);
    try {
      const options = await archiveAPI.getFiltering(type);
      setFilterOptions(options.sort((a, b) => a.localeCompare(b)));
    } catch (error) {
      console.error('필터 옵션 로드 실패:', error);
      Alert.alert('오류', '필터 옵션을 불러올 수 없습니다.');
    } finally {
      setIsLoadingFilters(false);
    }
  };

  // 필터 모달 열기
  const openFilterModal = async (type: 'brand' | 'timeline' | 'category') => {
    setFilterModalType(type);
    setFilterSearch('');
    await loadFilterOptions(type);
  };

  // 닫기
  const handleClose = async () => {
    const canGoBack = router.canGoBack();

    slideAnim.stopAnimation();
    await AsyncStorage.removeItem('previousRoute');

    if (canGoBack) {
      router.back();
    } else {
      router.navigate('/'); 
    }
  };

  // 아카이브 수정 제출
  const handleSubmit = async () => {
    // 유효성 검사
    if (images.length === 0) {
      Alert.alert('알림', '최소 1개 이상의 이미지를 첨부해주세요.');
      return;
    }

    if (!story.trim()) {
      Alert.alert('알림', '스토리를 입력해주세요.');
      return;
    }

    if (!selectedBrand) {
      Alert.alert('알림', '브랜드를 선택해주세요.');
      return;
    }

    if (!selectedTimeline) {
      Alert.alert('알림', '타임라인을 선택해주세요.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('알림', '카테고리를 선택해주세요.');
      return;
    }

    if (isPriceJudgementAllow && !isJudgementAllow) {
      Alert.alert('알림', '가격 평가를 허용하려면 먼저 판정 허용을 활성화해야 합니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert('알림', '로그인이 필요합니다.');
        router.push('/login');
        return;
      }

      // 기존 이미지와 새 이미지 구분
      const existingImages = images.filter(img => img.startsWith('http'));
      const newImages = images.filter(img => !img.startsWith('http'));

      let objectNames: string[] = [];

      // 새 이미지가 있으면 업로드
      if (newImages.length > 0) {
        // 1. Presigned URL 생성 (보안: objectNames만 받음)
        const { urls: presignedUrls, objectNames: newObjectNames } = await archiveAPI.generatePresignedUrls(
          newImages.length,
          15, // 15분 유효
          accessToken
        );

        // 2. 각 이미지를 Presigned URL로 업로드
        for (let i = 0; i < newImages.length; i++) {
          try {
            console.log(`이미지 ${i + 1} 업로드 시작:`, newImages[i]);
            console.log(`Presigned URL:`, presignedUrls[i]);
            await archiveAPI.uploadImageToStorage(presignedUrls[i], newImages[i]);
            console.log(`이미지 ${i + 1} 업로드 완료`);
          } catch (error: any) {
            console.error(`이미지 ${i + 1} 업로드 실패:`, error);
            Alert.alert('오류', `이미지 ${i + 1} 업로드에 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
            setIsSubmitting(false);
            return;
          }
        }

        objectNames = newObjectNames;
      }

      // 기존 이미지의 objectName 추출 (URL에서)
      const existingObjectNames = existingImages.map(url => {
        const match = url.match(/\/o\/(.+)(\?|$)/);
        return match ? decodeURIComponent(match[1]) : url;
      });

      // 3. 아카이브 수정 (보안: objectNames 전송, 백엔드에서 publicUrl 생성)
      await archiveAPI.updateArchive(
        id,
        {
          brand: selectedBrand,
          timeline: selectedTimeline,
          category: selectedCategory,
          story: story.trim(),
          isJudgementAllow,
          isPriceJudgementAllow,
          imageObjectNames: [...existingObjectNames, ...objectNames],
        },
        accessToken
      );

      // 홈화면 재로드 플래그 설정
      await AsyncStorage.setItem('shouldReloadHome', 'true');
      
      Alert.alert('성공', '아카이브가 수정되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error('아카이브 수정 실패:', error);
      Alert.alert('오류', error.response?.data?.message || '아카이브 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOptions = filterOptions.filter((option) =>
    option.toLowerCase().includes(filterSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2F2F2F" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black/50">
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'white',
          transform: [{ translateY: slideAnim }],
        }}
      >
        <SafeAreaView className="flex-1 bg-white">
          <StatusBar style="dark" />
          
          {/* 헤더 */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <Text className="text-xl font-bold" style={{ color: '#2F2F2F' }}>
              아카이브 수정
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              className="p-2"
            >
              <X size={24} color="#2F2F2F" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="px-4 pt-2 pb-1" style={{ gap: 8 }}>
              {/* 이미지 업로드 */}
              <View>
                <View className="flex-row" style={{ gap: 12, alignItems: 'flex-start' }}>
                  {/* 왼쪽 큰 이미지 추가 버튼 */}
                  <TouchableOpacity
                    onPress={pickImage}
                    disabled={images.length >= MAX_IMAGES}
                    className="items-center justify-center bg-gray-100 rounded-lg"
                    style={{ 
                      width: 120, 
                      height: 120,
                      opacity: images.length >= MAX_IMAGES ? 0.5 : 1,
                    }}
                  >
                    <Camera size={32} color="#999" />
                  </TouchableOpacity>
                  {/* 오른쪽 썸네일들 */}
                  {images.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, height: 120 }}>
                      <View className="flex-row" style={{ gap: 8, alignItems: 'center', height: 120 }}>
                        {images.map((uri, index) => (
                          <View key={index} style={{ position: 'relative', width: 80, height: 80 }}>
                            <Image
                              source={{ uri }}
                              style={{ width: 80, height: 80, borderRadius: 8 }}
                            />
                            <TouchableOpacity
                              onPress={() => removeImage(index)}
                              style={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                backgroundColor: '#2F2F2F',
                                borderRadius: 10,
                                width: 20,
                                height: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <X size={12} color="white" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </View>
                <View className="flex-row justify-end mt-1">
                  <Text className="text-xs text-gray-500">
                    사진 최대 {MAX_IMAGES}개 첨부 가능
                  </Text>
                </View>
              </View>

              {/* 스토리 입력 */}
              <View style={{ position: 'relative' }}>
                <TextInput
                  placeholder="본인의 아카이브를 소개해보세요! 사진과 함께라면 더 좋답니다."
                  placeholderTextColor="#999"
                  value={story}
                  onChangeText={(text) => {
                    if (text.length <= MAX_STORY_LENGTH) {
                      setStory(text);
                    }
                  }}
                  multiline
                  numberOfLines={8}
                  style={{
                    backgroundColor: '#F5F5F5',
                    borderRadius: 12,
                    padding: 12,
                    paddingBottom: 36,
                    fontSize: 12,
                    color: '#2F2F2F',
                    minHeight: 140,
                    textAlignVertical: 'top',
                  }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: '#999',
                    position: 'absolute',
                    bottom: 10,
                    right: 12,
                  }}
                >
                  {story.length}/{MAX_STORY_LENGTH}
                </Text>
              </View>

              {/* 텍스트 창과 브랜드 선택 사이 여백 */}
              <View style={{ height: 8 }} />

              {/* 브랜드 선택 */}
              <TouchableOpacity
                onPress={() => openFilterModal('brand')}
                className="flex-row items-center justify-between py-2"
              >
                <Text className="text-base" style={{ color: '#2F2F2F', fontWeight: 800 }}>
                  브랜드
                </Text>
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  {selectedBrand && (
                    <Text className="text-base" style={{ color: '#2F2F2F' }}>
                      {selectedBrand}
                    </Text>
                  )}
                  <Text className="text-base" style={{ color: '#2F2F2F' }}>
                    {' >'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 타임라인 선택 */}
              <TouchableOpacity
                onPress={() => openFilterModal('timeline')}
                className="flex-row items-center justify-between py-2"
              >
                <Text className="text-base" style={{ color: '#2F2F2F', fontWeight: 800 }}>
                  타임라인
                </Text>
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  {selectedTimeline && (
                    <Text className="text-base" style={{ color: '#2F2F2F' }}>
                      {selectedTimeline}
                    </Text>
                  )}
                  <Text className="text-base" style={{ color: '#2F2F2F' }}>
                    {' >'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 카테고리 선택 */}
              <TouchableOpacity
                onPress={() => openFilterModal('category')}
                className="flex-row items-center justify-between py-2"
              >
                <Text className="text-base" style={{ color: '#2F2F2F', fontWeight: 800 }}>
                  카테고리
                </Text>
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  {selectedCategory && (
                    <Text className="text-base" style={{ color: '#2F2F2F' }}>
                      {selectedCategory}
                    </Text>
                  )}
                  <Text className="text-base" style={{ color: '#2F2F2F' }}>
                    {' >'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 카테고리와 감정 허용 사이 여백 */}
              <View style={{ height: 8 }} />

              {/* 판정 허용 토글 */}
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-base flex-1 pr-4" style={{ color: '#2F2F2F' }}>
                  다른 유저들에게 아카이브에 대한 감정을 받습니다.
                </Text>
                <Switch
                  value={isJudgementAllow}
                  onValueChange={(value) => {
                    setIsJudgementAllow(value);
                    if (!value) {
                      setIsPriceJudgementAllow(false);
                    }
                  }}
                  trackColor={{ false: '#E5E5E5', true: '#2F2F2F' }}
                  thumbColor={isJudgementAllow ? '#fff' : '#f4f3f4'}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
              </View>

              {/* 가격 평가 허용 토글 */}
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-base flex-1 pr-4" style={{ color: '#2F2F2F' }}>
                  가격 평가를 허용합니다.
                </Text>
                <Switch
                  value={isPriceJudgementAllow}
                  onValueChange={setIsPriceJudgementAllow}
                  disabled={!isJudgementAllow}
                  trackColor={{ false: '#E5E5E5', true: '#2F2F2F' }}
                  thumbColor={isPriceJudgementAllow ? '#fff' : '#f4f3f4'}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
              </View>
            </View>
          </ScrollView>

          {/* 하단 게시 버튼 - 네비게이션 바 위치 */}
          <View 
            className="px-4 bg-white border-t border-gray-200"
            style={{
              paddingTop: 12,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
            }}
          >
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg items-center justify-center"
              style={{
                backgroundColor: '#2F2F2F',
                opacity: isSubmitting ? 0.6 : 1,
                paddingVertical: 14,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-base font-semibold" style={{ color: 'white' }}>
                  아카이브 수정
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 필터 선택 모달 */}
          <Modal
            visible={filterModalType !== null}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setFilterModalType(null)}
          >
            <View className="flex-1 bg-black/50">
              <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl" style={{ maxHeight: '80%' }}>
                <SafeAreaView>
                  <View className="p-4 border-b border-gray-200">
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-lg font-bold" style={{ color: '#2F2F2F' }}>
                        {filterModalType === 'brand' && '브랜드 선택'}
                        {filterModalType === 'timeline' && '타임라인 선택'}
                        {filterModalType === 'category' && '카테고리 선택'}
                      </Text>
                      <TouchableOpacity onPress={() => setFilterModalType(null)}>
                        <X size={24} color="#2F2F2F" />
                      </TouchableOpacity>
                    </View>
                    <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2">
                      <TextInput
                        placeholder="검색..."
                        placeholderTextColor="#999"
                        value={filterSearch}
                        onChangeText={setFilterSearch}
                        style={{ flex: 1, fontSize: 14, color: '#2F2F2F' }}
                      />
                    </View>
                  </View>
                  <ScrollView className="flex-1" style={{ maxHeight: 400 }}>
                    {isLoadingFilters ? (
                      <View className="py-20 items-center">
                        <ActivityIndicator size="large" color="#2F2F2F" />
                      </View>
                    ) : (
                      <View>
                        {filteredOptions.filter((option) =>
                          option.toLowerCase().includes(filterSearch.toLowerCase())
                        ).map((option) => (
                          <TouchableOpacity
                            key={option}
                            onPress={() => {
                              if (filterModalType === 'brand') setSelectedBrand(option);
                              if (filterModalType === 'timeline') setSelectedTimeline(option);
                              if (filterModalType === 'category') setSelectedCategory(option);
                              setFilterModalType(null);
                            }}
                            className="px-4 py-3 border-b border-gray-100"
                          >
                            <Text className="text-base" style={{ color: '#2F2F2F' }}>
                              {option}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </ScrollView>
                </SafeAreaView>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

