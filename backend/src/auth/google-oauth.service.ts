import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);

  /**
   * 인가 코드로 액세스 토큰 발급
   */
  async getAccessToken(authorizationCode: string): Promise<GoogleTokenResponse> {
    try {
      const params = new URLSearchParams({
        code: authorizationCode,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
        grant_type: 'authorization_code',
      });

      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Google access token', error);
      throw new Error('구글 액세스 토큰 발급 실패');
    }
  }

  /**
   * 액세스 토큰으로 사용자 정보 조회
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Google user info', error);
      throw new Error('구글 사용자 정보 조회 실패');
    }
  }
}

