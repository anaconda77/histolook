import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  refresh_token_expires_in: number;
}

interface KakaoUserInfo {
  id: number;
  connected_at: string;
  properties: {
    nickname: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account: {
    profile?: {
      nickname: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
    };
    email?: string;
    has_email?: boolean;
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
  };
}

@Injectable()
export class KakaoOAuthService {
  private readonly logger = new Logger(KakaoOAuthService.name);

  /**
   * 인가 코드로 액세스 토큰 발급
   */
  async getAccessToken(authorizationCode: string): Promise<KakaoTokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_REST_API_KEY || '',
        redirect_uri: process.env.KAKAO_REDIRECT_URI || '',
        code: authorizationCode,
      });

      // Client Secret이 설정되어 있으면 추가 (선택사항)
      if (process.env.KAKAO_CLIENT_SECRET) {
        params.append('client_secret', process.env.KAKAO_CLIENT_SECRET);
      }

      const response = await axios.post(
        'https://kauth.kakao.com/oauth/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Kakao access token', error);
      throw new Error('카카오 액세스 토큰 발급 실패');
    }
  }

  /**
   * 액세스 토큰으로 사용자 정보 조회
   */
  async getUserInfo(accessToken: string): Promise<KakaoUserInfo> {
    try {
      const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Kakao user info', error);
      throw new Error('카카오 사용자 정보 조회 실패');
    }
  }

  /**
   * 액세스 토큰 검증
   */
  async verifyAccessToken(accessToken: string): Promise<{
    id: number;
    expires_in: number;
    app_id: number;
  }> {
    try {
      const response = await axios.get(
        'https://kapi.kakao.com/v1/user/access_token_info',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Invalid Kakao access token', error);
      throw new Error('유효하지 않은 카카오 액세스 토큰');
    }
  }

  /**
   * 리프레시 토큰으로 액세스 토큰 갱신
   */
  async refreshAccessToken(refreshToken: string): Promise<KakaoTokenResponse> {
    try {
      const response = await axios.post(
        'https://kauth.kakao.com/oauth/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.KAKAO_REST_API_KEY || '',
          refresh_token: refreshToken,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh Kakao access token', error);
      throw new Error('카카오 액세스 토큰 갱신 실패');
    }
  }
}

