import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiExtraModels, ApiQuery, getSchemaPath } from '@nestjs/swagger';
import { MemberService } from './member.service';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAdminGuard } from './guards/optional-admin-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { GetProfileResponseDto } from './dto/get-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SecessionDto } from './dto/secession.dto';
import { AdminSecessionDto } from './dto/admin-secession.dto';

@ApiTags('Member')
@Controller('api/v1/member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로필 조회' })
  @ApiResponse({ status: 200, description: '프로필 조회 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않거나 만료된 토큰' })
  @ApiResponse({ status: 404, description: '존재하지 않는 사용자' })
  async getProfile(
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<GetProfileResponseDto>> {
    const result = await this.memberService.getProfile(user.userId);
    return ApiResponseDto.success('프로필 조회 성공', result);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '프로필 수정' })
  @ApiResponse({ status: 204, description: '프로필 수정 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않거나 만료된 토큰' })
  @ApiResponse({ status: 403, description: '이미 사용 중인 닉네임' })
  @ApiResponse({ status: 404, description: '존재하지 않는 사용자' })
  @ApiResponse({ status: 503, description: '일시적 오류로 프로필 수정 실패(재시도 요청)' })
  async updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateProfileDto,
  ): Promise<ApiResponseDto<Record<string, never>>> {
    await this.memberService.updateProfile(user.userId, dto);
    return ApiResponseDto.noContent('프로필 수정 성공');
  }

  @Delete('secession')
  @UseGuards(OptionalAdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: '회원 탈퇴 / 관리자 삭제',
    description: '일반 회원 탈퇴는 mode 없이 호출 (인증 필요), 관리자 삭제는 ?mode=admin으로 호출'
  })
  @ApiQuery({
    name: 'mode',
    required: false,
    description: '관리자 삭제 시 "admin" 입력',
    enum: ['admin'],
    example: 'admin',
  })
  @ApiExtraModels(SecessionDto, AdminSecessionDto)
  @ApiBody({
    description: 'mode가 없으면 SecessionDto, mode=admin이면 AdminSecessionDto 사용',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(SecessionDto) },
        { $ref: getSchemaPath(AdminSecessionDto) },
      ],
    },
  })
  @ApiResponse({ status: 204, description: '회원 탈퇴 성공 / 관리자 삭제 완료' })
  @ApiResponse({ status: 400, description: '주요 필드 누락 (관리자 모드)' })
  @ApiResponse({ status: 401, description: '유효하지 않거나 만료된 토큰' })
  @ApiResponse({ status: 404, description: '존재하지 않는 사용자 / 존재하지 않는 관리자' })
  @ApiResponse({ status: 503, description: '일시적 오류로 회원 탈퇴 실패(재시도 요청)' })
  async secession(
    @Query('mode') mode: string | undefined,
    @Body() dto: SecessionDto | AdminSecessionDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Record<string, never>>> {
    // 관리자 삭제 모드
    if (mode === 'admin') {
      await this.memberService.secessionAdmin(dto as AdminSecessionDto);
      return ApiResponseDto.noContent('관리자 삭제 완료');
    }

    // 일반 회원 탈퇴 (인증 필요)
    const user = req.user as CurrentUserData | undefined;

    if (!user || !user.userId) {
      throw new UnauthorizedException('유효하지 않거나 만료된 토큰');
    }

    await this.memberService.secession(user.userId, dto as SecessionDto);
    return ApiResponseDto.noContent('회원 탈퇴 성공');
  }
}
