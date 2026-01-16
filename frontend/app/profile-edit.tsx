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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Search, X, Camera } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { memberAPI } from '@/services/member.api';
import { authAPI } from '@/services/auth.api';
import { archiveAPI } from '@/services/archive.api';

export default function ProfileEditScreen() {
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSuccess, setNicknameSuccess] = useState('');
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null); // 선택된 이미지 URI
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const filteredBrands = allBrands.filter(
    (brand) =>
      brand.toLowerCase().includes(brandSearch.toLowerCase()) &&
      !selectedBrands.includes(brand)
  );

  useEffect(() => {
    loadProfileAndBrands();
    requestImagePermission();
  }, []);

  const requestImagePermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '프로필 이미지를 변경하려면 갤러리 접근 권한이 필요합니다.');
    }
  };

  const loadProfileAndBrands = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert('오류', '로그인이 필요합니다.');
        router.back();
        return;
      }

      // 프로필과 브랜드 목록을 병렬로 로드
      const [profile, brands] = await Promise.all([
        memberAPI.getProfile(accessToken),
        archiveAPI.getFiltering('brand'),
      ]);

      setCurrentProfile(profile);
      setNickname(profile.nickname);
      setSelectedBrands(profile.brandInterests || []);
      setProfileImage(profile.imageUrl || null); // 기존 프로필 이미지 설정
      setIsNicknameChecked(true); // 기존 닉네임은 이미 확인된 것으로 간주
      setAllBrands(brands.sort((a, b) => a.localeCompare(b))); // ABC 순 정렬
    } catch (error) {
      console.error('프로필 로딩 실패:', error);
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

  const handleNicknameChange = (text: string) => {
    setNickname(text);
    setNicknameError('');
    setNicknameSuccess('');

    // 현재 프로필의 닉네임과 같으면 자동으로 체크된 상태
    if (currentProfile && text === currentProfile.nickname) {
      setIsNicknameChecked(true);
      setNicknameSuccess('사용 가능한 닉네임입니다');
      return;
    }

    setIsNicknameChecked(false);

    // 기본 유효성 검사
    if (text.length === 0) {
      return;
    }

    if (text.length > 10) {
      setNicknameError('닉네임은 최대 10자까지 입력 가능합니다');
      return;
    }

    const nicknameRegex = /^[가-힣a-zA-Z0-9]+$/;
    if (!nicknameRegex.test(text)) {
      setNicknameError('한글, 영어, 숫자만 입력 가능합니다');
      return;
    }
  };

  const checkNicknameDuplicate = async () => {
    if (!nickname) {
      setNicknameError('닉네임을 입력해주세요');
      return;
    }

    if (nickname.length > 10) {
      setNicknameError('닉네임은 최대 10자까지 입력 가능합니다');
      return;
    }

    const nicknameRegex = /^[가-힣a-zA-Z0-9]+$/;
    if (!nicknameRegex.test(nickname)) {
      setNicknameError('한글, 영어, 숫자만 입력 가능합니다');
      return;
    }

    // 현재 닉네임과 같으면 중복 체크 건너뛰기
    if (currentProfile && nickname === currentProfile.nickname) {
      setIsNicknameChecked(true);
      setNicknameSuccess('사용 가능한 닉네임입니다');
      return;
    }

    try {
      const result = await authAPI.checkNickname(nickname);
      if (result.isAvailable) {
        setIsNicknameChecked(true);
        setNicknameSuccess('사용 가능한 닉네임입니다');
        setNicknameError('');
      } else {
        setIsNicknameChecked(false);
        setNicknameError('이미 존재하는 닉네임입니다');
        setNicknameSuccess('');
      }
    } catch (error) {
      console.error('닉네임 중복 체크 실패:', error);
      setNicknameError('중복 확인에 실패했습니다');
    }
  };

  const addBrand = (brand: string) => {
    if (selectedBrands.length >= 3) {
      Alert.alert('알림', '관심 브랜드는 최대 3개만 선택 가능합니다.');
      return;
    }
    setSelectedBrands([...selectedBrands, brand]);
    setBrandSearch('');
  };

  const removeBrand = (brand: string) => {
    setSelectedBrands(selectedBrands.filter((b) => b !== brand));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      Alert.alert('오류', '이미지를 선택할 수 없습니다.');
    }
  };

  const useDefaultImage = () => {
    setProfileImage(null);
  };

  const handleSave = async () => {
    if (!isNicknameChecked) {
      Alert.alert('알림', '닉네임 중복 확인을 해주세요.');
      return;
    }

    if (selectedBrands.length === 0) {
      Alert.alert('알림', '관심 브랜드를 최소 1개 이상 선택해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert('오류', '로그인이 필요합니다.');
        router.back();
        return;
      }

      let imageUrl = currentProfile.imageUrl; // 기존 이미지 URL

      let imageObjectName: string | null | undefined = undefined;

      // 이미지가 변경된 경우 업로드
      if (profileImage && profileImage !== currentProfile.imageUrl) {
        setIsUploadingImage(true);
        try {
          // 1. Presigned URL 생성 (보안: objectNames만 받음)
          console.log('프로필 이미지 업로드 시작');
          const { urls: presignedUrls, objectNames } = await archiveAPI.generatePresignedUrls(
            1, // 1개의 이미지
            15, // 15분 유효
            accessToken
          );

          // 2. 이미지 업로드
          console.log('Presigned URL:', presignedUrls[0]);
          await archiveAPI.uploadImageToStorage(presignedUrls[0], profileImage);
          console.log('이미지 업로드 완료');

          // 3. objectName 저장 (백엔드에서 publicUrl로 변환)
          imageObjectName = objectNames[0];
          console.log('업로드된 이미지 objectName:', imageObjectName);
        } catch (error: any) {
          console.error('이미지 업로드 실패:', error);
          Alert.alert('오류', `이미지 업로드에 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
          setIsUploadingImage(false);
          setIsSaving(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      } else if (profileImage === null && currentProfile.imageUrl) {
        // 기본 이미지로 변경 (빈 문자열로 설정)
        imageObjectName = '';
      }

      const updateData: any = {
        brandInterests: selectedBrands,
      };
      
      // 닉네임이 변경된 경우만 전송
      if (nickname !== currentProfile.nickname) {
        updateData.nickname = nickname;
      }

      // 이미지가 변경된 경우만 전송 (보안: objectName 전송)
      if (imageObjectName !== undefined) {
        updateData.imageObjectName = imageObjectName;
      }
      
      await memberAPI.updateProfile(accessToken, updateData);

      // 프로필 재로드 플래그 설정
      await AsyncStorage.setItem('shouldReloadProfile', 'true');
      
      Alert.alert('성공', '프로필이 수정되었습니다.', [
        {
          text: '확인',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('프로필 수정 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('에러 상태:', error.response?.status);
      console.error('에러 메시지:', error.message);
      
      const errorMessage = error.response?.data?.message || '프로필 수정에 실패했습니다.';
      Alert.alert('오류', errorMessage);
    } finally {
      setIsSaving(false);
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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#2F2F2F" />
          </TouchableOpacity>
          <Text className="text-xl font-bold" style={{ color: '#2F2F2F' }}>
            프로필 편집
          </Text>
        </View>

        {/* Profile Image */}
        <View className="items-center mt-6 mb-8">
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              className="w-32 h-32 rounded-full mb-4"
            />
          ) : (
            <View
              className="w-32 h-32 rounded-full mb-4 items-center justify-center"
              style={{ backgroundColor: '#2F2F2F' }}
            >
              <Text className="text-white text-5xl font-bold">
                {nickname?.charAt(0) || '?'}
              </Text>
            </View>
          )}
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="rounded-full px-6 py-2 flex-row items-center gap-2"
              style={{ backgroundColor: '#2F2F2F' }}
              onPress={pickImage}
            >
              <Camera size={16} color="#FFFFFF" />
              <Text className="text-white text-sm font-bold">이미지 선택</Text>
            </TouchableOpacity>
            {profileImage && (
              <TouchableOpacity
                className="rounded-full px-6 py-2"
                style={{ backgroundColor: '#9CA3AF' }}
                onPress={useDefaultImage}
              >
                <Text className="text-white text-sm font-bold">기본 이미지</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Nickname Section */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold mb-2" style={{ color: '#2F2F2F' }}>
            닉네임
          </Text>
          <Text className="text-sm text-gray-500 mb-3">
            한글, 영어, 숫자 조합으로 입력해주세요. (최대 10자)
          </Text>
          <View className="flex-row items-center gap-2 mb-2">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3"
              placeholder="닉네임을 입력하세요"
              value={nickname}
              onChangeText={handleNicknameChange}
              maxLength={10}
            />
            <TouchableOpacity
              className="rounded-full px-6 py-3"
              style={{ 
                backgroundColor: currentProfile && nickname === currentProfile.nickname ? '#9CA3AF' : '#2F2F2F' 
              }}
              onPress={checkNicknameDuplicate}
              disabled={currentProfile && nickname === currentProfile.nickname}
            >
              <Text className="text-white text-sm font-bold">중복 확인</Text>
            </TouchableOpacity>
          </View>
          {nicknameError ? (
            <Text className="text-red-500 text-sm">{nicknameError}</Text>
          ) : nicknameSuccess ? (
            <Text className="text-green-500 text-sm">{nicknameSuccess}</Text>
          ) : null}
        </View>

        {/* Brand Interests Section */}
        <View className="px-6 mb-8">
          <Text className="text-lg font-bold mb-2" style={{ color: '#2F2F2F' }}>
            관심 브랜드
          </Text>
          <Text className="text-sm text-gray-500 mb-3">
            관심 있는 브랜드의 아카이브를 홈화면에서 우선적으로 노출합니다.{'\n'}(최대 3개 선택 가능)
          </Text>

          {/* Brand Search Input */}
          <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-2 mb-4">
            <Search size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 py-1"
              placeholder="브랜드를 검색하세요"
              value={brandSearch}
              onChangeText={setBrandSearch}
            />
          </View>

          {/* Selected Brands */}
          <View className="flex-row flex-wrap gap-2 mb-4">
            {selectedBrands.map((brand) => (
              <View
                key={brand}
                className="flex-row items-center rounded-full px-4 py-2"
                style={{ borderWidth: 1, borderColor: '#2F2F2F' }}
              >
                <Text style={{ color: '#2F2F2F' }}>{brand}</Text>
                <TouchableOpacity onPress={() => removeBrand(brand)} className="ml-2">
                  <X size={16} color="#2F2F2F" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Brand Search Results */}
          {brandSearch && filteredBrands.length > 0 && (
            <View className="border border-gray-200 rounded-lg p-2 max-h-48">
              <ScrollView>
                {filteredBrands.slice(0, 10).map((brand) => (
                  <TouchableOpacity
                    key={brand}
                    onPress={() => addBrand(brand)}
                    className="py-2 px-2"
                    disabled={selectedBrands.length >= 3}
                  >
                    <Text
                      style={{
                        color: selectedBrands.length >= 3 ? '#9CA3AF' : '#2F2F2F',
                      }}
                    >
                      {brand}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          className="rounded-full py-4 items-center"
          style={{ backgroundColor: '#2F2F2F' }}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#FFFFFF" />
              {isUploadingImage && (
                <Text className="text-white text-sm">이미지 업로드 중...</Text>
              )}
            </View>
          ) : (
            <Text className="text-white text-base font-bold">프로필 수정</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

