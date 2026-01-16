import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiExtraModels, ApiQuery, getSchemaPath } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import {
  InitAuthDto,
  InitAuthResponseDto,
} from './dto/init-auth.dto';
import {
  CheckNicknameQueryDto,
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

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('init')
  @ApiOperation({ summary: 'AuthUser 생성 (회원가입 1단계)' })
  @ApiResponse({ status: 201, description: 'authUser를 생성하는데 성공' })
  @ApiResponse({ status: 400, description: '유효하지 않은 공급자' })
  async initAuth(
    @Body() dto: InitAuthDto,
  ): Promise<ApiResponseDto<InitAuthResponseDto>> {
    const result = await this.authService.initAuth(dto);
    return ApiResponseDto.created('authUser를 생성하는데 성공', result);
  }

  @Get('unique')
  @ApiOperation({ summary: '닉네임 중복 체크' })
  @ApiResponse({ status: 200, description: '닉네임 중복체크 성공' })
  @ApiResponse({ status: 400, description: '닉네임 누락 혹은 유효하지 않은 닉네임' })
  async checkNickname(
    @Query() query: CheckNicknameQueryDto,
  ): Promise<ApiResponseDto<CheckNicknameResponseDto>> {
    const result = await this.authService.checkNickname(query.nickname);
    return ApiResponseDto.success('닉네임 중복체크 성공', result);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Member 생성 (회원가입 완료 / 관리자 생성)',
    description: '일반 회원가입은 mode 없이 호출, 관리자 생성은 ?mode=admin으로 호출'
  })
  @ApiQuery({
    name: 'mode',
    required: false,
    description: '관리자 생성 시 "admin" 입력',
    enum: ['admin'],
    example: 'admin',
  })
  @ApiExtraModels(JoinDto, AdminJoinDto)
  @ApiBody({
    description: 'mode가 없으면 JoinDto, mode=admin이면 AdminJoinDto 사용',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(JoinDto) },
        { $ref: getSchemaPath(AdminJoinDto) },
      ],
    },
  })
  @ApiResponse({ status: 200, description: '회원가입 최종 성공 / 관리자 생성 성공' })
  @ApiResponse({ status: 400, description: 'authUserId 누락 혹은 잘못된 형식 / 닉네임 누락 혹은 조건 위반' })
  @ApiResponse({ status: 404, description: '존재하지 않는 authUser' })
  @ApiResponse({ status: 409, description: '이미 가입된 회원' })
  async join(
    @Query('mode') mode: string | undefined,
    @Body() dto: JoinDto | AdminJoinDto,
  ): Promise<ApiResponseDto<JoinResponseDto | AdminJoinResponseDto>> {
    // 관리자 생성 모드
    if (mode === 'admin') {
      const result = await this.authService.joinAdmin(dto as AdminJoinDto);
      return ApiResponseDto.success('관리자 생성 성공', result);
    }
    
    // 일반 회원가입
    const result = await this.authService.join(dto as JoinDto);
    return ApiResponseDto.success('회원가입 최종 성공', result);
  }

  @Post('issue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '관리자용 토큰 발급',
    description: '?mode=admin으로 호출'
  })
  @ApiQuery({
    name: 'mode',
    required: true,
    description: '"admin" 입력 필수',
    enum: ['admin'],
    example: 'admin',
  })
  @ApiResponse({ status: 200, description: '관리자용 토큰 발급 성공' })
  @ApiResponse({ status: 404, description: '존재하지 않는 authUser' })
  async issueToken(
    @Query('mode') mode: string | undefined,
    @Body() dto: AdminIssueTokenDto,
  ): Promise<ApiResponseDto<AdminIssueTokenResponseDto>> {
    // 관리자 모드 체크
    if (mode !== 'admin') {
      throw new Error('지원되지 않는 모드입니다');
    }

    const result = await this.authService.issueAdminToken(dto);
    return ApiResponseDto.success('관리자용 토큰 발급 성공', result);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 400, description: '공급자 혹은 소셜 액세스 토큰 누락' })
  @ApiResponse({ status: 401, description: '유효하지 않은 소셜 액세스 토큰' })
  @ApiResponse({ status: 503, description: '소셜 공급자 접촉 실패' })
  async login(
    @Body() dto: LoginDto,
  ): Promise<ApiResponseDto<LoginResponseDto>> {
    const result = await this.authService.login(dto);
    const message = result.isRegistered
      ? '로그인 성공'
      : '회원가입 진행 상태가 있으므로 회원가입으로 이동';
    return ApiResponseDto.success(message, result);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '액세스 토큰 재발급' })
  @ApiResponse({ status: 200, description: '액세스 토큰 재발급 성공' })
  @ApiResponse({ status: 400, description: '리프레쉬 토큰 누락' })
  @ApiResponse({ status: 401, description: '유효하지 않거나 만료된 토큰' })
  async refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<ApiResponseDto<RefreshTokenResponseDto>> {
    const result = await this.authService.refresh(dto);
    return ApiResponseDto.success('액세스 토큰 재발급 성공', result);
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않거나 만료된 토큰' })
  async logout(
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<Record<string, never>>> {
    await this.authService.logout(user.userId);
    return ApiResponseDto.success('로그아웃 성공', {});
  }

  @Get('kakao/callback')
  @ApiOperation({ summary: '카카오 로그인 콜백' })
  @ApiResponse({ status: 302, description: '앱으로 리다이렉트' })
  async kakaoCallback(
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.kakaoCallback(code);
      
      let redirectUrl: string;
      
      if (result.isRegistered) {
        // 기존 회원 - JWT 토큰 및 회원 정보 전달
        const authUser = await this.authService.getAuthUserById(result.authUserId);
        const tokens = await this.authService.generateTokensForMember(authUser.member!.id, result.authUserId);
        redirectUrl = `histolook://kakao/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&isRegistered=true&memberId=${authUser.member!.id}&nickname=${encodeURIComponent(authUser.member!.nickname)}&role=${authUser.member!.role}`;
      } else {
        // 신규 회원 - authUserId 전달
        redirectUrl = `histolook://kakao/callback?authUserId=${result.authUserId}&provider=${result.provider}&isRegistered=false&createdAt=${encodeURIComponent(result.createdAt)}`;
      }
      
      return res.redirect(redirectUrl);
    } catch (error) {
      // 에러 발생 시 에러 메시지와 함께 리다이렉트
      const errorMessage = error.message || '카카오 로그인 실패';
      return res.redirect(`histolook://kakao/callback?error=${encodeURIComponent(errorMessage)}`);
    }
  }

  @Get('google/callback')
  @ApiOperation({ summary: '구글 로그인 콜백' })
  @ApiResponse({ status: 302, description: '앱으로 리다이렉트' })
  async googleCallback(
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.googleCallback(code);
      
      let redirectUrl: string;
      
      if (result.isRegistered) {
        // 기존 회원 - JWT 토큰 및 회원 정보 전달
        const authUser = await this.authService.getAuthUserById(result.authUserId);
        const tokens = await this.authService.generateTokensForMember(authUser.member!.id, result.authUserId);
        redirectUrl = `histolook://google/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&isRegistered=true&memberId=${authUser.member!.id}&nickname=${encodeURIComponent(authUser.member!.nickname)}&role=${authUser.member!.role}`;
      } else {
        // 신규 회원 - authUserId 전달
        redirectUrl = `histolook://google/callback?authUserId=${result.authUserId}&provider=${result.provider}&isRegistered=false&createdAt=${encodeURIComponent(result.createdAt)}`;
      }
      
      return res.redirect(redirectUrl);
    } catch (error) {
      // 에러 발생 시 에러 메시지와 함께 리다이렉트
      const errorMessage = error.message || '구글 로그인 실패';
      return res.redirect(`histolook://google/callback?error=${encodeURIComponent(errorMessage)}`);
    }
  }
}
