import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memberAPI } from '@/services/member.api';
import { deleteFcmToken } from '@/utils/fcm';

const WITHDRAWAL_REASONS = [
  '서비스 이용 빈도가 낮아서',
  '원하는 기능이 없어서',
  '다른 서비스를 이용하려고',
  '개인정보 보호를 위해',
  '기타'
];

export default function MemberWithdrawalScreen() {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdrawal = () => {
    // 유효성 검사
    if (!reason) {
      Alert.alert('알림', '탈퇴 사유를 선택해주세요.');
      return;
    }

    // 확인 팝업
    Alert.alert(
      '회원 탈퇴',
      '회원 탈퇴 시 개인 정보 보관 방침에 의해, 개인 정보는 1년간 보관됩니다.\n또한 작성한 글 및 평가 정보는 별도로 삭제되지 않습니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: () => confirmWithdrawal(),
        },
      ]
    );
  };

  const confirmWithdrawal = async () => {
    setIsSubmitting(true);

    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert('알림', '로그인이 필요한 서비스입니다.');
        router.push('/login');
        return;
      }

      // FCM 토큰 삭제
      try {
        await deleteFcmToken();
      } catch (error) {
        console.error('FCM 토큰 삭제 실패:', error);
        // FCM 토큰 삭제 실패는 무시하고 진행
      }

      // 회원 탈퇴 API 호출
      await memberAPI.secession(reason, accessToken);

      // 로컬 저장소 클리어
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'memberId']);

      // 탈퇴 완료 팝업
      Alert.alert(
        '탈퇴 완료',
        '회원 탈퇴가 완료되었습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              // 로그인 화면으로 이동 (스택 초기화)
              router.replace('/login');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      console.error('회원 탈퇴 실패:', error);
      if (error.response?.status === 401) {
        Alert.alert('알림', '로그인이 필요한 서비스입니다.');
        router.push('/login');
      } else {
        Alert.alert('오류', '회원 탈퇴 처리에 실패했습니다. 다시 시도해주세요.');
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
          <Text className="text-2xl font-bold ml-2">회원 탈퇴</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* 탈퇴 사유 */}
        <Text style={{ color: '#000000', fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
          탈퇴 사유
        </Text>
        <TouchableOpacity
          onPress={() => setShowReasonModal(true)}
          className="border border-gray-200 rounded-2xl px-5 py-4 mb-8"
          style={{ backgroundColor: '#FAFAFA' }}
        >
          <View className="flex-row items-center justify-between">
            <Text style={{ color: reason ? '#000000' : '#9CA3AF', fontSize: 15 }}>
              {reason || '탈퇴 사유를 선택해주세요.'}
            </Text>
            <ChevronDown size={20} color="#6B7280" />
          </View>
        </TouchableOpacity>

        {/* 유의사항 */}
        <Text style={{ color: '#000000', fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
          유의사항
        </Text>
        <View className="px-4 py-4 rounded-2xl" style={{ backgroundColor: '#F5F5F5' }}>
          <Text style={{ color: '#424242', fontSize: 14, lineHeight: 22 }}>
            회원 탈퇴 시 개인 정보 보관 방침에 의해, 개인 정보는 1년간 보관됩니다.{'\n'}
            또한 작성한 글 및 평가 정보는 별도로 삭제되지 않습니다.
          </Text>
        </View>
      </ScrollView>

      {/* 탈퇴하기 버튼 */}
      <View className="px-4 pb-8">
        <TouchableOpacity
          onPress={handleWithdrawal}
          disabled={isSubmitting}
          className="rounded-2xl py-4"
          style={{ backgroundColor: '#2F2F2F' }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">탈퇴하기</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 사유 선택 모달 */}
      <Modal
        visible={showReasonModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReasonModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowReasonModal(false)}
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <View className="bg-white rounded-2xl w-4/5 overflow-hidden">
            <View className="p-5 border-b border-gray-200">
              <Text className="text-lg font-bold text-center">탈퇴 사유 선택</Text>
            </View>
            <ScrollView className="max-h-80">
              {WITHDRAWAL_REASONS.map((reasonOption) => (
                <TouchableOpacity
                  key={reasonOption}
                  onPress={() => {
                    setReason(reasonOption);
                    setShowReasonModal(false);
                  }}
                  className="p-4 border-b border-gray-100"
                >
                  <Text
                    style={{
                      color: reason === reasonOption ? '#2F2F2F' : '#6B7280',
                      fontSize: 16,
                      fontWeight: reason === reasonOption ? '600' : '400',
                    }}
                  >
                    {reasonOption}
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
