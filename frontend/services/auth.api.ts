import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface InitAuthResponse {
  authUserId: string;
  provider: string;
  email: string | null;
  createdAt: string;
}

export interface LoginResponse {
  isRegistered: boolean;
  accessToken?: string;
  refreshToken?: string;
}

export interface JoinRequest {
  authUserId: string;
  nickname: string;
  brandInterests: string[];
}

export interface JoinResponse {
  memberId: string;
  nickname: string;
  role: string;
  brandInterests: string[];
  imageUrl: string | null;
  createdAt: string;
  accessToken: string;
  refreshToken: string;
}

class AuthAPI {
  /**
   * 카카오 OAuth 로그인 URL 생성
   */
  getKakaoAuthUrl(): string {
    const restApiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
    const redirectUri = process.env.EXPO_PUBLIC_KAKAO_REDIRECT_URI;
    
    return `https://kauth.kakao.com/oauth/authorize?client_id=${restApiKey}&redirect_uri=${redirectUri}&response_type=code`;
  }

  /**
   * 구글 OAuth 로그인 URL 생성
   */
  getGoogleAuthUrl(): string {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI;
    
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile`;
  }

  /**
   * AuthUser 초기화 (OAuth 로그인 후 호출)
   */
  async initAuth(provider: string, accessToken: string, refreshToken: string, providerId: string, email?: string): Promise<InitAuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/init`, {
      provider,
      socialAccessToken: accessToken,
      socialRefreshToken: refreshToken,
      providerId,
      email: email || null,
    });
    return response.data.content;
  }

  /**
   * 로그인 (기존 회원 확인)
   */
  async login(provider: string, socialAccessToken: string): Promise<LoginResponse> {
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
      provider,
      socialAccessToken,
    });
    return response.data.content;
  }

  /**
   * 닉네임 중복 체크
   */
  async checkNickname(nickname: string): Promise<{ isAvailable: boolean }> {
    const response = await axios.get(`${API_BASE_URL}/api/v1/auth/unique`, {
      params: { nickname },
    });
    // 백엔드는 isExisting을 반환 (true = 이미 존재)
    // 프론트엔드는 isAvailable 필요 (true = 사용 가능)
    const isExisting = response.data.content.isExisting;
    return { isAvailable: !isExisting };
  }

  /**
   * 회원가입 완료
   */
  async join(data: JoinRequest): Promise<JoinResponse> {
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/join`, data);
    return response.data.content;
  }

  /**
   * 토큰 재발급
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
      refreshToken,
    });
    return response.data.content;
  }

  /**
   * 액세스 토큰 검증 (프로필 조회)
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      // 실제로는 프로필 조회 등의 API를 호출하여 토큰 유효성 확인
      // 현재는 간단히 토큰이 있는지만 확인
      return !!accessToken;
    } catch (error) {
      return false;
    }
  }

  /**
   * 로그아웃
   */
  async logout(accessToken: string): Promise<void> {
    await axios.get(`${API_BASE_URL}/api/v1/auth/logout`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
}

export const authAPI = new AuthAPI();

