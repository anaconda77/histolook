import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import {
  AdminGetSupportsQueryDto,
  AdminGetSupportsResponseDto,
} from './dto/admin-get-supports.dto';
import { AdminReplySupportDto } from './dto/admin-reply-support.dto';

@ApiTags('Admin Support')
@Controller('api/v1/admin/support')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('all')
  @ApiOperation({ summary: '[관리자] 전체 문의글 조회' })
  @ApiResponse({ status: 200, description: '관리자용 문의글 리스트 조회 완료' })
  @ApiResponse({ status: 400, description: '액세스 토큰 누락' })
  @ApiResponse({ status: 401, description: '유효하지 않거나 만료된 토큰' })
  @ApiResponse({ status: 403, description: '접근 권한 없음(관리자가 아님)' })
  @ApiResponse({ status: 503, description: '일시적 오류로 문의글 리스트 조회 실패(재시도 요청)' })
  async adminGetAllSupports(
    @Query() query: AdminGetSupportsQueryDto,
  ): Promise<ApiResponseDto<AdminGetSupportsResponseDto>> {
    const result = await this.supportService.adminGetAllSupports(query);
    return ApiResponseDto.success('관리자용 문의글 리스트 조회 완료', result);
  }

  @Put(':supportPostId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[관리자] 문의글 답변 등록' })
  @ApiResponse({ status: 204, description: '문의글 답변 등록 완료' })
  @ApiResponse({ status: 400, description: '액세스 토큰 누락' })
  @ApiResponse({ status: 401, description: '유효하지 않거나 만료된 토큰' })
  @ApiResponse({ status: 403, description: '접근 권한 없음(관리자가 아님)' })
  @ApiResponse({ status: 503, description: '일시적 오류로 답변 등록 실패(재시도 요청)' })
  async adminReplySupport(
    @Param('supportPostId') supportPostId: string,
    @Body() dto: AdminReplySupportDto,
  ): Promise<ApiResponseDto<Record<string, never>>> {
    await this.supportService.adminReplySupport(supportPostId, dto);
    return ApiResponseDto.noContent('문의글 답변 등록 완료');
  }

  @Delete(':supportPostId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[관리자] 문의글 삭제' })
  @ApiResponse({ status: 204, description: '문의글 삭제 완료(관리자)' })
  @ApiResponse({ status: 400, description: '액세스 토큰 누락' })
  @ApiResponse({ status: 401, description: '유효하지 않거나 만료된 토큰' })
  @ApiResponse({ status: 403, description: '접근 권한 없음(관리자가 아님)' })
  @ApiResponse({ status: 503, description: '일시적 오류로 문의글 삭제 실패(재시도 요청)' })
  async adminDeleteSupport(
    @Param('supportPostId') supportPostId: string,
  ): Promise<ApiResponseDto<Record<string, never>>> {
    await this.supportService.adminDeleteSupport(supportPostId);
    return ApiResponseDto.noContent('문의글 삭제 완료(관리자)');
  }
}

