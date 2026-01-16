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
import { router, useFocusEffect, useSegments, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { X, Camera, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { archiveAPI } from '@/services/archive.api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MAX_IMAGES = 10;
const MAX_STORY_LENGTH = 1000;

export default function CreateScreen() {
  const [images, setImages] = useState<string[]>([]);
  const [story, setStory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedTimeline, setSelectedTimeline] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isJudgementAllow, setIsJudgementAllow] = useState(false);
  const [isPriceJudgementAllow, setIsPriceJudgementAllow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  // useFocusEffect를 사용하여 화면이 포커스될 때마다 애니메이션 초기화 및 시작
  const pathname = usePathname();
  const segments = useSegments();
  
  useFocusEffect(
    useCallback(() => {
      // 네비게이션 스택 상태 로그 출력
      const canGoBack = router.canGoBack();
      
      // 이전 경로 및 호출 스택 정보 가져오기
      (async () => {
        const route = await AsyncStorage.getItem('previousRoute');
        if (route) {
          previousRouteRef.current = route;
        }
        
        // 네비게이션 히스토리 업데이트 (로그 없이)
        const currentPath = pathname || '/(tabs)/create';
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
      
      // 애니메이션 값을 초기 위치로 리셋
      slideAnim.setValue(SCREEN_HEIGHT);
      
      // 애니메이션 시작
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // 클린업: 화면을 벗어날 때 애니메이션 중지
      return () => {
        slideAnim.stopAnimation();
      };
    }, [])
  );

  const handleClose = () => {
    // 진행 중인 애니메이션 중지
    slideAnim.stopAnimation();
    
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      // 상태 초기화
      setImages([]);
      setStory('');
      setSelectedBrand('');
      setSelectedTimeline('');
      setSelectedCategory('');
      setIsJudgementAllow(false);
      setIsPriceJudgementAllow(false);
      setFilterModalType(null);
      setFilterSearch('');
      
      // 단순히 뒤로가기 (등록 화면을 스택에서 제거)
      if (router.canGoBack()) {
        router.back();
      } else {
        // 백 스택이 없으면 홈으로
        router.replace('/(tabs)');
      }
    });
  };

  // 필터 옵션 로드
  const loadFilterOptions = async (type: 'brand' | 'timeline' | 'category') => {
    setIsLoadingFilters(true);
    try {
      const options = await archiveAPI.getFiltering(type);
      // 카테고리는 정렬하지 않고, 브랜드와 타임라인만 정렬
      if (type === 'category') {
        setFilterOptions(options);
      } else {
        setFilterOptions(options.sort((a, b) => a.localeCompare(b)));
      }
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

  // 아카이브 등록
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

      // 1. Presigned URL 생성 (보안: objectNames만 받음)
      const { urls: presignedUrls, objectNames } = await archiveAPI.generatePresignedUrls(
        images.length,
        15, // 15분 유효
        accessToken
      );

      // 2. 각 이미지를 Presigned URL로 업로드
      for (let i = 0; i < images.length; i++) {
        try {
          await archiveAPI.uploadImageToStorage(presignedUrls[i], images[i]);
        } catch (error: any) {
          console.error(`이미지 ${i + 1} 업로드 실패:`, error);
          Alert.alert('오류', `이미지 ${i + 1} 업로드에 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
          setIsSubmitting(false);
          return;
        }
      }

      // 3. 아카이브 등록 (보안: objectNames 전송, 백엔드에서 publicUrl 생성)
      const result = await archiveAPI.createArchive(
        {
          brand: selectedBrand,
          timeline: selectedTimeline,
          category: selectedCategory,
          story: story.trim(),
          isJudgementAllow,
          isPriceJudgementAllow,
          imageObjectNames: objectNames,
        },
        accessToken
      );

      // 폼 초기화
      setImages([]);
      setStory('');
      setSelectedBrand('');
      setSelectedTimeline('');
      setSelectedCategory('');
      setIsJudgementAllow(false);
      setIsPriceJudgementAllow(false);

      // 아카이브 등록 성공 플래그 저장 (홈화면에서 전체 재로딩하도록)
      await AsyncStorage.setItem('shouldReloadHome', 'true');

      // 홈화면으로 이동 후 등록한 아카이브 상세 화면으로 이동
      Alert.alert('성공', '아카이브가 등록되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            // 홈화면으로 먼저 이동
            router.replace('/(tabs)');
            // 약간의 지연 후 상세 화면으로 이동 (홈화면 새로고침 완료 대기)
            setTimeout(() => {
              router.push(`/archive-detail/${result.archiveId}`);
            }, 500);
          },
        },
      ]);
    } catch (error: any) {
      console.error('아카이브 등록 실패:', error);
      Alert.alert('오류', error.response?.data?.message || '아카이브 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOptions = filterOptions.filter((option) =>
    option.toLowerCase().includes(filterSearch.toLowerCase())
  );

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
              아카이브 등록
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
            <View className="flex-row" style={{ gap: 12 }}>
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                  <View className="flex-row" style={{ gap: 8 }}>
                    {images.map((uri, index) => (
                      <View key={index} style={{ position: 'relative' }}>
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
              아카이브 게시
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
                    {filteredOptions.map((option) => (
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
