import axios from 'axios';

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
    const response = await axios.get(`${API_BASE_URL}/api/v1/member/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.content;
  }

  /**
   * 프로필 수정
   */
  async updateProfile(
    accessToken: string,
    data: {
      nickname?: string;
      imageUrl?: string;
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
  async secession(accessToken: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/v1/member/secession`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
}

export const memberAPI = new MemberAPI();

