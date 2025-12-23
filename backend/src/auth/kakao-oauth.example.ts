/**
 * 카카오 OAuth 연동 예시 코드
 * 
 * 이 파일은 참고용입니다. 실제 구현 시 auth.service.ts에 통합하세요.
 */

import axios from 'axios';

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

/**
 * 1. 인가 코드로 액세스 토큰 발급
 */
export async function getKakaoAccessToken(authorizationCode: string): Promise<{
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  refresh_token_expires_in: number;
}> {
  const response = await axios.post(
    'https://kauth.kakao.com/oauth/token',
    null,
    {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_REST_API_KEY,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code: authorizationCode,
        // client_secret: process.env.KAKAO_CLIENT_SECRET, // 선택 사항
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    },
  );

  return response.data;
}

/**
 * 2. 액세스 토큰으로 사용자 정보 조회
 */
export async function getKakaoUserInfo(
  accessToken: string,
): Promise<KakaoUserInfo> {
  const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });

  return response.data;
}

/**
 * 3. 액세스 토큰 검증
 */
export async function verifyKakaoAccessToken(accessToken: string): Promise<{
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
    throw new Error('Invalid Kakao access token');
  }
}

/**
 * 4. 리프레시 토큰으로 액세스 토큰 갱신
 */
export async function refreshKakaoAccessToken(refreshToken: string): Promise<{
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  refresh_token_expires_in: number;
}> {
  const response = await axios.post(
    'https://kauth.kakao.com/oauth/token',
    null,
    {
      params: {
        grant_type: 'refresh_token',
        client_id: process.env.KAKAO_REST_API_KEY,
        refresh_token: refreshToken,
        // client_secret: process.env.KAKAO_CLIENT_SECRET, // 선택 사항
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    },
  );

  return response.data;
}

/**
 * 5. auth.service.ts의 login 메서드에서 사용 예시
 */
export async function kakaoLoginExample(socialAccessToken: string) {
  // 1. 토큰 검증
  const tokenInfo = await verifyKakaoAccessToken(socialAccessToken);

  // 2. 사용자 정보 조회
  const userInfo = await getKakaoUserInfo(socialAccessToken);

  // 3. AuthUser 생성 또는 조회에 사용할 데이터
  const authData = {
    provider: 'kakao',
    providerId: userInfo.id.toString(),
    email: userInfo.kakao_account.email,
    nickname: userInfo.properties.nickname,
    profileImage: userInfo.properties.profile_image,
  };

  return authData;
}

