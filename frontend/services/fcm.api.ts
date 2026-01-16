import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface NotificationSettings {
  notificationEnabled: boolean;
}

export const fcmAPI = {
  /**
   * FCM 토큰 등록
   */
  async registerToken(
    token: string,
    platform: 'ios' | 'android',
    deviceId: string | undefined,
    accessToken: string
  ): Promise<void> {
    await axios.post(
      `${API_URL}/api/v1/fcm/token`,
      { token, platform, deviceId },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  },

  /**
   * FCM 토큰 삭제
   */
  async deleteToken(token: string, accessToken: string): Promise<void> {
    await axios.delete(`${API_URL}/api/v1/fcm/token`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: { token },
    });
  },

  /**
   * 알림 설정 조회
   */
  async getNotificationSettings(accessToken: string): Promise<NotificationSettings> {
    const response = await axios.get(`${API_URL}/api/v1/fcm/settings`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.content;
  },

  /**
   * 알림 설정 업데이트
   */
  async updateNotificationSettings(
    settings: Partial<NotificationSettings>,
    accessToken: string
  ): Promise<NotificationSettings> {
    const response = await axios.put(
      `${API_URL}/api/v1/fcm/settings`,
      settings,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data.content;
  },
};
