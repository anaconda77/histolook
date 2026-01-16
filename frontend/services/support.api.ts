import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface CreateSupportDto {
  supportType: string;
  title: string;
  content: string;
}

export interface SupportPostListItem {
  supportPostId: string;
  supportType: string;
  title: string;
  status: string; // '대기중' | '답변 완료'
}

export interface SupportPostDetail {
  supportPostId: string;
  supportType: string;
  title: string;
  content: string;
  reply?: string | null;
  status: string;
  createdAt: string;
}

export const supportAPI = {
  /**
   * 문의글 등록
   */
  async createSupport(dto: CreateSupportDto, accessToken: string): Promise<any> {
    const response = await axios.post(
      `${API_URL}/api/v1/support`,
      dto,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data.content;
  },

  /**
   * 문의글 리스트 조회
   */
  async getSupportList(accessToken: string): Promise<SupportPostListItem[]> {
    const response = await axios.get(`${API_URL}/api/v1/support/all`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.content.supports;
  },

  /**
   * 문의글 상세 조회
   */
  async getSupportDetail(supportPostId: string, accessToken: string): Promise<SupportPostDetail> {
    const response = await axios.get(`${API_URL}/api/v1/support/${supportPostId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.content.supports[0];
  },
};
