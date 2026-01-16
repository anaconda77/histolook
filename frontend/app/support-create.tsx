import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supportAPI } from '@/services/support.api';

const SUPPORT_TYPES = ['게시물 신고', '서비스 문의', '기능 개선 제안', '버그 신고', '기타'];

export default function SupportCreateScreen() {
  const router = useRouter();
  const [supportType, setSupportType] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  const handleSubmit = async () => {
    // 유효성 검사
    if (!supportType) {
      Alert.alert('알림', '문의 유형을 선택해주세요.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('알림', '제목을 입력해주세요.');
      return;
    }

    if (title.length > 30) {
      Alert.alert('알림', '제목은 최대 30자까지 입력 가능합니다.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('알림', '문의 내용을 입력해주세요.');
      return;
    }

    if (content.length > 300) {
      Alert.alert('알림', '문의 내용은 최대 300자까지 입력 가능합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert(
          '알림',
          '로그인이 필요한 서비스입니다.',
          [
            {
              text: '확인',
              onPress: () => router.push('/login'),
            },
          ]
        );
        return;
      }

      await supportAPI.createSupport(
        {
          supportType,
          title: title.trim(),
          content: content.trim(),
        },
        accessToken
      );

      Alert.alert(
        '알림',
        '문의가 성공적으로 등록되었습니다.',
        [
          {
            text: '확인',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('문의 등록 실패:', error);
      if (error.response?.status === 401) {
        Alert.alert(
          '알림',
          '로그인이 필요한 서비스입니다.',
          [
            {
              text: '확인',
              onPress: () => router.push('/login'),
            },
          ]
        );
      } else {
        Alert.alert('오류', '문의 등록에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View className="px-4 pb-6" style={{ paddingTop: 68 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={28} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold ml-2">문의하기</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* 안내 문구 */}
        <Text style={{ color: '#6B7280', fontSize: 14, marginBottom: 32 }}>
          히스토룩 서비스에 관해 문의할 내용을 자유롭게 남겨주세요.
        </Text>

        {/* 문의 유형 */}
        <Text style={{ color: '#2F2F2F', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
          문의 유형
        </Text>
        <TouchableOpacity
          onPress={() => setShowTypeModal(true)}
          className="border border-gray-200 rounded-lg px-4 py-4 mb-8"
          style={{ backgroundColor: '#FAFAFA' }}
        >
          <View className="flex-row items-center justify-between">
            <Text style={{ color: supportType ? '#2F2F2F' : '#9CA3AF', fontSize: 14 }}>
              {supportType || '문의 유형을 선택해주세요.'}
            </Text>
            <ChevronDown size={20} color="#6B7280" />
          </View>
        </TouchableOpacity>

        {/* 제목 */}
        <Text style={{ color: '#2F2F2F', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
          제목
        </Text>
        <TextInput
          className="border border-gray-200 rounded-lg px-4 py-4 mb-8"
          style={{ backgroundColor: '#FAFAFA', fontSize: 14, color: '#2F2F2F' }}
          placeholder="문의글 제목을 입력해주세요. (최대 30자 입력 가능)"
          placeholderTextColor="#9CA3AF"
          value={title}
          onChangeText={setTitle}
          maxLength={30}
        />

        {/* 문의 내용 */}
        <Text style={{ color: '#2F2F2F', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
          문의 내용
        </Text>
        <TextInput
          className="border border-gray-200 rounded-lg px-4 py-4 mb-8"
          style={{ 
            backgroundColor: '#FAFAFA', 
            fontSize: 14, 
            color: '#2F2F2F',
            minHeight: 200,
            textAlignVertical: 'top'
          }}
          placeholder="문의 내용을 상세하게 입력해주세요. (최대 300자)"
          placeholderTextColor="#9CA3AF"
          value={content}
          onChangeText={setContent}
          maxLength={300}
          multiline
          numberOfLines={10}
        />
      </ScrollView>

      {/* 문의하기 버튼 */}
      <View className="px-4 pb-8">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className="rounded-lg py-4"
          style={{ backgroundColor: '#2F2F2F' }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">문의하기</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 유형 선택 모달 */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowTypeModal(false)}
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <View className="bg-white rounded-lg w-4/5 max-h-96">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-lg font-bold text-center">문의 유형 선택</Text>
            </View>
            <ScrollView className="max-h-80">
              {SUPPORT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    setSupportType(type);
                    setShowTypeModal(false);
                  }}
                  className="p-4 border-b border-gray-100"
                >
                  <Text
                    style={{
                      color: supportType === type ? '#2F2F2F' : '#6B7280',
                      fontSize: 16,
                      fontWeight: supportType === type ? '600' : '400',
                    }}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
