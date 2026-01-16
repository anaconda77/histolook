import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * 알림 아이템
 */
export interface AlarmItem {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  resourcePath: string;
  publishedAt: string;
}

/**
 * 알림 리스트 응답
 */
export interface GetAlarmsResponse {
  alarms: AlarmItem[];
}

/**
 * 알림 개수 응답
 */
export interface GetAlarmCountResponse {
  count: number;
}

class AlarmAPI {
  /**
   * 알림 개수 조회
   */
  async getAlarmCount(accessToken: string): Promise<GetAlarmCountResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/v1/alarm/count`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.content;
  }

  /**
   * 알림 리스트 조회
   */
  async getAlarms(accessToken: string): Promise<GetAlarmsResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/v1/alarm/my`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.content;
  }
}

export const alarmAPI = new AlarmAPI();
