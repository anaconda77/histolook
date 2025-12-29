import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, SafeAreaView, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react-native';
import { authAPI } from '@/services/auth.api';
import { archiveAPI } from '@/services/archive.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BRANDS_PER_PAGE = 15;

export default function SignupScreen() {
  const params = useLocalSearchParams();
  const authUserId = params.authUserId as string;
  
  const [nickname, setNickname] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [currentBrandPage, setCurrentBrandPage] = useState(0);
  const [isNicknameValid, setIsNicknameValid] = useState(false);
  const [isNicknameChecked, setIsNicknameChecked] = useState(false); // 중복 확인 완료 여부
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSuccess, setNicknameSuccess] = useState(''); // 성공 메시지
  const [isLoading, setIsLoading] = useState(false);
  const [showExistingUserModal, setShowExistingUserModal] = useState(false);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  
  const flatListRef = useRef<FlatList>(null);

  // 브랜드 목록 로드
  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const brands = await archiveAPI.getFiltering('brand');
      setAllBrands(brands.sort((a, b) => a.localeCompare(b))); // ABC 순 정렬
    } catch (error) {
      console.error('브랜드 목록 로딩 실패:', error);
      Alert.alert('오류', '브랜드 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoadingBrands(false);
    }
  };

  // 닉네임 입력 시 기본 검증만 (에러 메시지 표시 안 함)
  const handleNicknameChange = (text: string) => {
    setNickname(text);
    setIsNicknameChecked(false); // 입력이 변경되면 중복 확인 초기화
    setNicknameError(''); // 에러 메시지 초기화
    setNicknameSuccess(''); // 성공 메시지 초기화
    
    // 형식이 올바른지 내부적으로만 확인 (에러 표시 안 함)
    if (text.length >= 2 && text.length <= 10) {
      const regex = /^[가-힣a-zA-Z0-9_]+$/;
      setIsNicknameValid(regex.test(text));
    } else {
      setIsNicknameValid(false);
    }
  };

  // 중복 확인 버튼 클릭 시에만 호출
  const checkNicknameDuplicate = async () => {
    // 초기화
    setNicknameError('');
    setNicknameSuccess('');
    
    if (!nickname || nickname.trim().length === 0) {
      setNicknameError('닉네임을 입력해주세요.');
      setIsNicknameChecked(false);
      return;
    }
    
    // 길이 체크
    if (nickname.length < 2 || nickname.length > 10) {
      setNicknameError('닉네임은 2자 이상 10자 이하로 입력해주세요.');
      setIsNicknameChecked(false);
      return;
    }
    
    // 형식 체크
    const regex = /^[가-힣a-zA-Z0-9_]+$/;
    if (!regex.test(nickname)) {
      setNicknameError('한글, 영어, 숫자, 밑줄만 사용 가능합니다.');
      setIsNicknameChecked(false);
      return;
    }
    
    // API 호출하여 중복 확인
    try {
      const result = await authAPI.checkNickname(nickname);
      if (result.isAvailable) {
        setIsNicknameChecked(true);
        setNicknameError('');
        setNicknameSuccess('사용 가능한 닉네임입니다.');
      } else {
        setIsNicknameChecked(false);
        setNicknameError('이미 존재하는 닉네임입니다.');
        setNicknameSuccess('');
      }
    } catch (error) {
      console.error('닉네임 중복 체크 실패:', error);
      setNicknameError('닉네임 중복 확인에 실패했습니다.');
      setIsNicknameChecked(false);
    }
  };

  // 브랜드 선택/해제
  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    } else {
      if (selectedBrands.length < 3) {
        setSelectedBrands([...selectedBrands, brand]);
      } else {
        Alert.alert('알림', '관심 브랜드는 최대 3개만 선택 가능합니다.');
      }
    }
  };

  // 회원가입 완료
  const handleSignup = async () => {
    if (!authUserId) {
      Alert.alert('오류', '인증 정보가 없습니다.');
      return;
    }

    // 닉네임 검증
    if (!nickname || nickname.trim().length === 0) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }

    if (!isNicknameChecked) {
      Alert.alert('알림', '닉네임 중복 확인을 해주세요.');
      return;
    }

    // 브랜드 검증
    if (selectedBrands.length === 0) {
      Alert.alert('알림', '관심 브랜드를 최소 1개 이상 선택해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authAPI.join({
        authUserId,
        nickname,
        brandInterests: selectedBrands,
      });

      // 토큰 저장
      await AsyncStorage.setItem('accessToken', result.accessToken);
      await AsyncStorage.setItem('refreshToken', result.refreshToken);
      await AsyncStorage.setItem('memberId', result.memberId);

      // 환영 화면으로 이동
      router.replace({ pathname: '/welcome', params: { nickname } });
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      if (error.response?.status === 409) {
        // 이미 가입된 회원
        setShowExistingUserModal(true);
      } else {
        Alert.alert('오류', '회원가입에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 기존 회원 정보 로드
  const handleLoadExistingUser = async () => {
    try {
      // TODO: 기존 회원 정보 가져오기 API 호출
      setShowExistingUserModal(false);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('오류', '정보를 불러오는데 실패했습니다.');
    }
  };

  // 필터링된 브랜드 (이미 allBrands가 정렬되어 있으므로 필터링만 수행)
  const filteredBrands = allBrands.filter(brand =>
    brand.toLowerCase().includes(brandSearchQuery.toLowerCase())
  );

  // 페이지별로 브랜드 나누기
  const totalPages = Math.ceil(filteredBrands.length / BRANDS_PER_PAGE);
  const paginatedBrands = [];
  for (let i = 0; i < totalPages; i++) {
    paginatedBrands.push(
      filteredBrands.slice(i * BRANDS_PER_PAGE, (i + 1) * BRANDS_PER_PAGE)
    );
  }

  // 검색 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentBrandPage(0);
    if (flatListRef.current && totalPages > 0) {
      try {
        flatListRef.current.scrollToIndex({ index: 0, animated: false });
      } catch (error) {
        // FlatList가 아직 레이아웃되지 않은 경우 무시
      }
    }
  }, [brandSearchQuery]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        {/* 헤더 */}
        <Text className="text-2xl font-bold mb-2" style={{ color: '#2F2F2F' }}>
          히스토룩의 회원으로 등록합니다.
        </Text>

        {/* 닉네임 입력 */}
        <View className="mb-8">
          <Text className="text-base font-semibold mb-2" style={{ color: '#2F2F2F' }}>닉네임</Text>
          <Text className="text-sm text-gray-600 mb-3">
            한글, 영어, 숫자 조합으로 입력해주세요. (최대 10자)
          </Text>
          
          <View className="flex-row items-center gap-2">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="닉네임을 입력하세요"
              value={nickname}
              onChangeText={handleNicknameChange}
              maxLength={10}
            />
            <TouchableOpacity
              className={`rounded-lg px-5 py-3.5 ${
                isNicknameValid ? 'bg-gray-200' : 'bg-gray-100'
              }`}
              onPress={checkNicknameDuplicate}
              disabled={!isNicknameValid}
            >
              <Text 
                className="font-medium text-sm"
                style={{ color: isNicknameValid ? '#2F2F2F' : '#9CA3AF' }}
              >
                중복 확인
              </Text>
            </TouchableOpacity>
          </View>
          
          {nicknameError ? (
            <View className="mt-2">
              <Text className="text-sm text-red-500">{nicknameError}</Text>
            </View>
          ) : nicknameSuccess ? (
            <View className="mt-2">
              <Text className="text-sm text-green-600">{nicknameSuccess}</Text>
            </View>
          ) : null}
        </View>

        {/* 관심 브랜드 */}
        <View className="mb-8">
          <Text className="text-base font-semibold mb-2" style={{ color: '#2F2F2F' }}>관심 브랜드</Text>
          <Text className="text-sm text-gray-600 mb-3">
            관심 있는 브랜드의 아카이브를 홈화면에서 우선적으로 노출합니다.{'\n'}(최대 3개 선택 가능)
          </Text>

          {/* 검색창 */}
          <View className="border border-gray-300 rounded-lg px-4 py-3 mb-4 flex-row items-center">
            <TextInput
              className="flex-1 text-base"
              placeholder="브랜드를 검색하세요"
              placeholderTextColor="#9CA3AF"
              value={brandSearchQuery}
              onChangeText={setBrandSearchQuery}
            />
          </View>

          {/* 선택된 브랜드 표시 */}
          {selectedBrands.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-4">
              {selectedBrands.map((brand) => (
                <View
                  key={brand}
                  className="flex-row items-center bg-white border border-gray-300 rounded-full px-3 py-1.5"
                >
                  <Text className="text-sm text-gray-700 mr-1.5">{brand}</Text>
                  <TouchableOpacity onPress={() => toggleBrand(brand)}>
                    <X size={16} color="#666" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* 브랜드 리스트 (페이지네이션) */}
          {isLoadingBrands ? (
            <View className="h-64 items-center justify-center">
              <ActivityIndicator size="large" color="#2F2F2F" />
              <Text className="text-gray-500 mt-2">브랜드 목록 로딩 중...</Text>
            </View>
          ) : paginatedBrands.length > 0 ? (
            <>
              <View style={{ height: 250 }}>
                <FlatList
                  ref={flatListRef}
                  data={paginatedBrands}
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
                  keyExtractor={(item, index) => `page-${index}`}
                  renderItem={({ item: pageBrands }) => (
                    <View style={{ width: SCREEN_WIDTH - 48 }} className="flex-row flex-wrap gap-2">
                      {pageBrands.map((brand: string) => (
                        <TouchableOpacity
                          key={brand}
                          className={`px-5 py-2.5 rounded-full ${
                            selectedBrands.includes(brand) ? '' : 'bg-gray-200'
                          } ${
                            selectedBrands.length >= 3 && !selectedBrands.includes(brand) ? 'opacity-50' : ''
                          }`}
                          style={selectedBrands.includes(brand) ? { backgroundColor: '#2F2F2F' } : undefined}
                          onPress={() => toggleBrand(brand)}
                          disabled={selectedBrands.length >= 3 && !selectedBrands.includes(brand)}
                        >
                          <Text
                            className={`font-medium text-sm ${
                              selectedBrands.includes(brand) ? 'text-white' : 'text-gray-700'
                            }`}
                          >
                            {brand}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
              </View>
              
              {/* 페이지 인디케이터 */}
              {totalPages > 1 && (
                <View className="flex-row justify-center items-center mt-4 gap-2">
                  {Array.from({ length: totalPages }).map((_, index) => (
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
          ) : (
            <View className="h-64 items-center justify-center">
              <Text className="text-gray-500">브랜드 목록이 없습니다.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View className="px-6 pb-8 pt-4 border-t border-gray-200">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${
            isNicknameChecked && selectedBrands.length > 0 ? '' : 'bg-gray-200'
          }`}
          style={isNicknameChecked && selectedBrands.length > 0 ? { backgroundColor: '#2F2F2F' } : undefined}
          onPress={handleSignup}
          disabled={!isNicknameChecked || selectedBrands.length === 0 || isLoading}
        >
          <Text className={`text-base font-semibold ${
            isNicknameChecked && selectedBrands.length > 0 ? 'text-white' : 'text-gray-400'
          }`}>
            {isLoading ? '처리 중...' : '회원가입'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 기존 회원 모달 */}
      <Modal
        visible={showExistingUserModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExistingUserModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-center mb-4" style={{ color: '#2F2F2F' }}>
              기존에 등록한 회원이 존재합니다.
              회원 가입을 이어서 진행합니다.
            </Text>
            
            <TouchableOpacity
              className="rounded-xl py-4 items-center"
              style={{ backgroundColor: '#2F2F2F' }}
              onPress={handleLoadExistingUser}
            >
              <Text className="text-white text-base font-semibold">확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

