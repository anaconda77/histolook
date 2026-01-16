import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface ProfileResponse {
  nickname: string;
  role: 'USER' | 'ADMIN';
  imageUrl: string | null;
  brandInterests: string[];
}

class MemberAPI {
  /**
   * 프로필 조회
   */
  async getProfile(accessToken: string): Promise<ProfileResponse> {
    // AsyncStorage에서 memberId 가져오기
    const memberId = await AsyncStorage.getItem('memberId');
    if (!memberId) {
      throw new Error('memberId not found in storage');
    }

    const response = await axios.get(`${API_BASE_URL}/api/v1/member/${memberId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.content;
  }

  /**
   * 프로필 수정
   * 보안: imageUrl 대신 imageObjectName 전송
   */
  async updateProfile(
    accessToken: string,
    data: {
      nickname?: string;
      imageObjectName?: string;
      brandInterests?: string[];
    }
  ): Promise<void> {
    await axios.put(`${API_BASE_URL}/api/v1/member/profile`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * 회원 탈퇴
   */
  async secession(reason: string, accessToken: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/v1/member/secession`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        reason,
      },
    });
  }
}

export const memberAPI = new MemberAPI();

