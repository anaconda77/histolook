import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { KakaoOAuthService } from './kakao-oauth.service';
import { GoogleOAuthService } from './google-oauth.service';
import type { UUID } from '../common/types/uuid.type';
import {
  InvalidProviderException,
  MissingTokenException,
  MissingProviderIdException,
  InvalidSocialTokenException,
  SocialProviderErrorException,
  AlreadyExistsException,
  InvalidNicknameException,
  InvalidBrandInterestsException,
} from '../common/exceptions/custom-exceptions';
import {
  InitAuthDto,
  InitAuthResponseDto,
} from './dto/init-auth.dto';
import {
  CheckNicknameResponseDto,
} from './dto/check-nickname.dto';
import {
  JoinDto,
  JoinResponseDto,
} from './dto/join.dto';
import {
  AdminJoinDto,
  AdminJoinResponseDto,
} from './dto/admin-join.dto';
import {
  AdminIssueTokenDto,
  AdminIssueTokenResponseDto,
} from './dto/admin-issue-token.dto';
import {
  LoginDto,
  LoginResponseDto,
} from './dto/login.dto';
import {
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private kakaoOAuthService: KakaoOAuthService,
    private googleOAuthService: GoogleOAuthService,
  ) {}

  /**
   * 0. 카카오 로그인 콜백 처리
   */
  async kakaoCallback(authorizationCode: string): Promise<InitAuthResponseDto & { isRegistered: boolean }> {
    // 1. 인가 코드로 액세스 토큰 발급
    const tokenResponse = await this.kakaoOAuthService.getAccessToken(authorizationCode);
    
    // 2. 액세스 토큰으로 사용자 정보 조회
    const userInfo = await this.kakaoOAuthService.getUserInfo(tokenResponse.access_token);
    
    // 3. 기존 AuthUser 확인
    const existingAuthUser = await this.prisma.authUser.findFirst({
      where: {
        provider: 'kakao',
        providerId: userInfo.id.toString(),
      },
      include: {
        member: true, // Member 관계 확인
      },
    });

    if (existingAuthUser) {
      // 기존 사용자 - 토큰 업데이트
      await this.prisma.authUser.update({
        where: { id: existingAuthUser.id },
        data: {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
        },
      });

      return {
        authUserId: existingAuthUser.id,
        provider: 'kakao',
        createdAt: existingAuthUser.createdAt.toISOString(),
        isRegistered: !!existingAuthUser.member, // Member가 있으면 true
      };
    }

    // 4. 새로운 AuthUser 생성
    const authUser = await this.prisma.authUser.create({
      data: {
        provider: 'kakao',
        providerId: userInfo.id.toString(),
        email: userInfo.kakao_account?.email || null,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
      },
    });

    return {
      authUserId: authUser.id,
      provider: authUser.provider,
      createdAt: authUser.createdAt.toISOString(),
      isRegistered: false, // 새로 생성된 경우 항상 false
    };
  }

  /**
   * 0-2. 구글 로그인 콜백 처리
   */
  async googleCallback(authorizationCode: string): Promise<InitAuthResponseDto & { isRegistered: boolean }> {
    // 1. 인가 코드로 액세스 토큰 발급
    const tokenResponse = await this.googleOAuthService.getAccessToken(authorizationCode);
    
    // 2. 액세스 토큰으로 사용자 정보 조회
    const userInfo = await this.googleOAuthService.getUserInfo(tokenResponse.access_token);
    
    // 3. 기존 AuthUser 확인
    const existingAuthUser = await this.prisma.authUser.findFirst({
      where: {
        provider: 'google',
        providerId: userInfo.id.toString(),
      },
      include: {
        member: true, // Member 관계 확인
      },
    });

    if (existingAuthUser) {
      // 기존 사용자 - 토큰 업데이트
      await this.prisma.authUser.update({
        where: { id: existingAuthUser.id },
        data: {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || null,
        },
      });

      return {
        authUserId: existingAuthUser.id,
        provider: 'google',
        createdAt: existingAuthUser.createdAt.toISOString(),
        isRegistered: !!existingAuthUser.member, // Member가 있으면 true
      };
    }

    // 4. 새로운 AuthUser 생성
    const authUser = await this.prisma.authUser.create({
      data: {
        provider: 'google',
        providerId: userInfo.id.toString(),
        email: userInfo.email || null,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
      },
    });

    return {
      authUserId: authUser.id,
      provider: authUser.provider,
      createdAt: authUser.createdAt.toISOString(),
      isRegistered: false, // 새로 생성된 경우 항상 false
    };
  }

  /**
   * 1. AuthUser 생성 (회원가입 1단계)
   */
  async initAuth(dto: InitAuthDto): Promise<InitAuthResponseDto> {
    // 유효성 검증
    if (!dto.socialAccessToken || !dto.socialRefreshToken) {
      throw new MissingTokenException();
    }

    if (!dto.providerId) {
      throw new MissingProviderIdException();
    }

    const validProviders = ['google', 'kakao', 'apple'];
    if (!validProviders.includes(dto.provider.toLowerCase())) {
      throw new InvalidProviderException();
    }

    try {
      // TODO: 실제 소셜 로그인 공급자와 토큰 검증 로직 구현 필요
      // 지금은 Mock으로 처리

      // AuthUser 생성
      const authUser = await this.prisma.authUser.create({
        data: {
          provider: dto.provider.toLowerCase(),
          providerId: dto.providerId,
          email: dto.email,
          accessToken: dto.socialAccessToken,
          refreshToken: dto.socialRefreshToken,
        },
      });

      return {
        authUserId: authUser.id,
        provider: authUser.provider,
        createdAt: authUser.createdAt.toISOString(),
      };
    } catch (error) {
      throw new SocialProviderErrorException();
    }
  }

  /**
   * 2. 닉네임 중복 체크
   */
  async checkNickname(nickname: string): Promise<CheckNicknameResponseDto> {
    if (!nickname || nickname.trim().length === 0) {
      throw new InvalidNicknameException();
    }

    const existing = await this.prisma.member.findUnique({
      where: { nickname },
    });

    return {
      isExisting: !!existing,
    };
  }

  /**
   * 3. Member 생성 (회원가입 완료)
   */
  async join(dto: JoinDto): Promise<JoinResponseDto> {
    // AuthUser 존재 확인
    const authUser = await this.prisma.authUser.findUnique({
      where: { id: dto.authUserId },
      include: { member: true },
    });

    if (!authUser) {
      throw new NotFoundException('존재하지 않는 authUser');
    }

    // 이미 Member가 생성된 경우
    if (authUser.member) {
      throw new AlreadyExistsException();
    }

    // 닉네임 중복 체크
    const nicknameCheck = await this.checkNickname(dto.nickname);
    if (nicknameCheck.isExisting) {
      throw new InvalidNicknameException('닉네임 누락 혹은 조건 위반');
    }

    // 브랜드 검증 (최대 3개로 제한하는 예시)
    if (!dto.brandInterests || dto.brandInterests.length === 0) {
      throw new InvalidBrandInterestsException();
    }

    if (dto.brandInterests.length > 10) {
      throw new InvalidBrandInterestsException();
    }

    // Member 생성
    const member = await this.prisma.member.create({
      data: {
        nickname: dto.nickname,
        role: 'USER', // 기본 역할
        imageUrl: null,
        brandInterests: dto.brandInterests.join(','), // 배열을 쉼표로 구분된 문자열로 저장
        authUserId: dto.authUserId,
      },
    });

    // 회원가입 완료 후 즉시 서비스 토큰 발급
    const tokens = await this.generateTokens(member.id, authUser.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      memberId: member.id,
      nickname: member.nickname,
      role: member.role,
      imageUrl: member.imageUrl,
      brandInterests: dto.brandInterests,
      authUserId: member.authUserId,
      createdAt: member.createdAt.toISOString(),
    };
  }

  /**
   * 3-2. 관리자 생성 (authUser 없이)
   */
  async joinAdmin(dto: AdminJoinDto): Promise<AdminJoinResponseDto> {
    // 닉네임 검증
    if (!dto.nickname || dto.nickname.trim().length === 0) {
      throw new InvalidNicknameException('닉네임 누락 혹은 조건 위반');
    }

    // 닉네임 중복 체크
    const nicknameCheck = await this.checkNickname(dto.nickname);
    if (nicknameCheck.isExisting) {
      throw new InvalidNicknameException('닉네임 누락 혹은 조건 위반');
    }

    // 기본 브랜드 (명세서 기준)
    const defaultBrands = ['Levis', 'Carhartt', 'RRL'];

    // 관리자용 AuthUser 생성 (소셜 로그인 없음)
    const authUser = await this.prisma.authUser.create({
      data: {
        provider: 'admin',
        providerId: `admin-${Date.now()}`, // 고유 ID 생성
        email: null,
        accessToken: null,
        refreshToken: null,
      },
    });

    // 관리자 Member 생성
    const member = await this.prisma.member.create({
      data: {
        nickname: dto.nickname,
        role: 'ADMIN',
        imageUrl: null,
        brandInterests: defaultBrands.join(','),
        authUserId: authUser.id,
      },
    });

    return {
      memberId: member.id,
      nickname: member.nickname,
      role: member.role,
      brandInterests: defaultBrands,
      createdAt: member.createdAt.toISOString(),
    };
  }

  /**
   * 3-3. 관리자용 토큰 발급
   */
  async issueAdminToken(dto: AdminIssueTokenDto): Promise<AdminIssueTokenResponseDto> {
    // Member 조회
    const member = await this.prisma.member.findUnique({
      where: { id: dto.memberId },
    });

    if (!member || member.deletedAt) {
      throw new NotFoundException('존재하지 않는 authUser');
    }

    // AuthUser 조회
    const authUser = await this.prisma.authUser.findUnique({
      where: { id: member.authUserId },
    });

    if (!authUser) {
      throw new NotFoundException('존재하지 않는 authUser');
    }

    // 우리 서비스의 JWT 토큰 발급 (DB에 저장하지 않음)
    const tokens = await this.generateTokens(member.id, authUser.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * 4. 로그인
   */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    if (!dto.provider || !dto.socialAccessToken) {
      throw new MissingTokenException('공급자 혹은 소셜 액세스 토큰 누락');
    }

    try {
      // TODO: 실제 소셜 로그인 공급자와 토큰 검증 로직 구현 필요
      // socialAccessToken으로 providerId를 가져온다고 가정
      const mockProviderId = 'mock-provider-id'; // Mock

      // AuthUser 찾기
      const authUser = await this.prisma.authUser.findFirst({
        where: {
          provider: dto.provider.toLowerCase(),
          // providerId: mockProviderId, // 실제로는 소셜 로그인 검증 후 가져온 ID 사용
        },
        include: {
          member: true,
        },
      });

      // AuthUser가 없으면 회원가입 필요
      if (!authUser) {
        throw new InvalidSocialTokenException();
      }

      // Member가 없으면 회원가입 진행 중
      if (!authUser.member || authUser.member.deletedAt) {
        return {
          isRegistered: false,
          authUserId: authUser.id,
        };
      }

      // 로그인 성공 - 우리 서비스의 JWT 토큰 발급
      const tokens = await this.generateTokens(authUser.member.id, authUser.id);

      return {
        isRegistered: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof InvalidSocialTokenException) {
        throw error;
      }
      throw new SocialProviderErrorException();
    }
  }

  /**
   * 5. 액세스 토큰 재발급
   */
  async refresh(dto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    if (!dto.refreshToken) {
      throw new MissingTokenException('리프레쉬 토큰 누락');
    }

    try {
      // Refresh Token 검증
      const payload = this.jwtService.verify(dto.refreshToken);

      // Member 조회 (토큰의 sub는 memberId)
      const member = await this.prisma.member.findUnique({
        where: { id: payload.sub },
      });

      if (!member || member.deletedAt) {
        throw new UnauthorizedException('유효하지 않거나 만료된 토큰');
      }

      // 새로운 토큰 발급
      const tokens = await this.generateTokens(member.id, payload.authUserId);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('유효하지 않거나 만료된 토큰');
    }
  }

  /**
   * 6. 로그아웃
   */
  async logout(userId: UUID): Promise<void> {
    // 우리 서비스의 JWT 토큰은 stateless이므로 서버에서 무효화할 수 없음
    // 클라이언트에서 토큰을 삭제하면 됨
    // 필요시 블랙리스트 구현 또는 토큰 버전 관리 가능
    
    // OAuth2 토큰은 AuthUser 테이블에 그대로 유지
    // (소셜 로그인 재사용을 위해)
    return;
  }

  /**
   * AuthUser 조회 (member 포함)
   */
  async getAuthUserById(authUserId: UUID) {
    const authUser = await this.prisma.authUser.findUnique({
      where: { id: authUserId },
      include: { member: true },
    });

    if (!authUser || !authUser.member || authUser.member.deletedAt) {
      throw new NotFoundException('존재하지 않는 AuthUser 또는 회원가입 미완료');
    }

    return authUser;
  }

  /**
   * JWT 토큰 생성 (public wrapper)
   */
  async generateTokensForMember(memberId: UUID, authUserId: UUID) {
    return this.generateTokens(memberId, authUserId);
  }

  /**
   * JWT 토큰 생성 헬퍼
   */
  private async generateTokens(
    memberId: UUID,
    authUserId: UUID,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Member 정보 조회
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.deletedAt) {
      throw new NotFoundException('존재하지 않는 회원');
    }

    // JWT Payload에 memberId, nickname, role 포함
    const payload = {
      sub: memberId,
      authUserId,
      nickname: member.nickname,
      role: member.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1d', // 액세스 토큰: 1일
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d', // 리프레시 토큰: 30일
    });

    return { accessToken, refreshToken };
  }
}
