import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import {
  CreateSupportDto,
  CreateSupportResponseDto,
} from './dto/create-support.dto';
import { GetSupportsResponseDto } from './dto/get-supports.dto';
import { GetSupportDetailResponseDto } from './dto/get-support-detail.dto';

@ApiTags('Support')
@Controller('api/v1/support')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @ApiOperation({ summary: '문의글 등록' })
  @ApiResponse({ status: 201, description: '문의글 등록 완료' })
  @ApiResponse({ status: 400, description: '액세스 토큰 누락' })
  @ApiResponse({ status: 401, description: '유효하지 않거나 만료된 토큰' })
  @ApiResponse({ status: 400, description: '제목 누락 혹은 길이 초과' })
  @ApiResponse({ status: 400, description: '내용 누락 혹은 길이 초과' })
  @ApiResponse({ status: 503, description: '일시적 오류로 문의글 등록 실패(재시도 요청)' })
  async createSupport(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateSupportDto,
  ): Promise<ApiResponseDto<CreateSupportResponseDto>> {
    const result = await this.supportService.createSupport(user.userId, dto);
    return ApiResponseDto.created('문의글 등록 완료', result);
  }

  @Get('all')
  @ApiOperation({ summary: '문의글 리스트 조회' })
  @ApiResponse({ status: 200, description: '문의글 리스트 조회 완료' })
  @ApiResponse({ status: 400, description: '액세스 토큰 누락' })
  @ApiResponse({ status: 401, description: '유효하지 않거나 만료된 토큰' })
  @ApiResponse({ status: 503, description: '일시적 오류로 문의글 리스트 조회 실패(재시도 요청)' })
  async getSupports(
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<GetSupportsResponseDto>> {
    const result = await this.supportService.getSupports(user.userId);
    return ApiResponseDto.success('문의글 리스트 조회 완료', result);
  }

  @Get(':supportPostId')
  @ApiOperation({ summary: '문의글 조회' })
  @ApiResponse({ status: 200, description: '문의글 조회 완료' })
  @ApiResponse({ status: 400, description: '액세스 토큰 누락' })
  @ApiResponse({ status: 401, description: '유효하지 않거나 만료된 토큰' })
  @ApiResponse({ status: 503, description: '일시적 오류로 문의글 리스트 조회 실패(재시도 요청)' })
  async getSupportDetail(
    @CurrentUser() user: CurrentUserData,
    @Param('supportPostId') supportPostId: string,
  ): Promise<ApiResponseDto<GetSupportDetailResponseDto>> {
    const result = await this.supportService.getSupportDetail(
      user.userId,
      supportPostId,
    );
    return ApiResponseDto.success('문의글 조회 완료', result);
  }
}

