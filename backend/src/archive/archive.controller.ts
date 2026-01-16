import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ArchiveService } from './archive.service';
import { StorageService } from './storage.service';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import type { UUID } from '../common/types/uuid.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { OptionalAuth } from '../common/decorators/optional-auth.decorator';
// import { ApiBearerAuth } from '@nestjs/swagger';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';
import {
  GetArchivesQueryDto,
  GetArchivesResponseDto,
} from './dto/get-archives.dto';
import { GetArchiveDetailResponseDto } from './dto/get-archive-detail.dto';
import {
  GetMyArchivesQueryDto,
  GetMyArchivesResponseDto,
} from './dto/get-my-archives.dto';
import {
  CreateArchiveDto,
  CreateArchiveResponseDto,
} from './dto/create-archive.dto';
import { UpdateArchiveDto } from './dto/update-archive.dto';
import {
  CreateJudgementDto,
  CreateJudgementResponseDto,
} from './dto/create-judgement.dto';
import {
  GetCommentsQueryDto,
  GetCommentsResponseDto,
} from './dto/get-comments.dto';
import { GetArchiveCommentsResponseDto } from './dto/get-archive-comments.dto';
import {
  GetInterestArchivesQueryDto,
  GetInterestArchivesResponseDto,
} from './dto/get-interest-archives.dto';
import { CreateInterestArchiveResponseDto } from './dto/create-interest-archive.dto';
import {
  GetFilteringQueryDto,
  GetBrandsResponseDto,
  GetTimelinesResponseDto,
  GetCategoriesResponseDto,
} from './dto/get-filters.dto';
import {
  GeneratePresignedUrlDto,
  GeneratePresignedUrlResponseDto,
} from './dto/generate-presigned-url.dto';

// TODO: Auth - 테스트용 고정 UUID (실제 인증 구현 시 제거)
const TEST_USER_ID: UUID = '00000000-0000-0000-0000-000000000001';

@ApiTags('Archive')
@Controller('api/v1')
export class ArchiveController {
  constructor(
    private readonly archiveService: ArchiveService,
    private readonly storageService: StorageService,
  ) {}

  @Get('archive')
  @UseGuards(JwtAuthGuard)
  @OptionalAuth()
  @ApiOperation({ summary: '홈화면 아카이브 리스트 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 400, description: '올바르지 않은 필터링 파라미터 조건 또는 유효하지 않은 페이지 넘버' })
  async getArchives(
    @Query() query: GetArchivesQueryDto,
    @CurrentUser() user: CurrentUserData | null,
  ): Promise<ApiResponseDto<GetArchivesResponseDto>> {
    const result = await this.archiveService.getArchives(
      query,
      user?.userId,
    );
    return ApiResponseDto.success('홈화면 아카이브 리스트를 불러오는데 성공', result);
  }

  @Get('archive/filtering')
  // TODO: Auth - @OptionalAuth()
  @ApiOperation({ summary: '필터링 옵션 조회 (브랜드/타임라인/카테고리)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 400, description: '잘못된 필터링 옵션' })
  @ApiResponse({ status: 503, description: '일시적 오류로 필터링 옵션 조회 실패(재시도 요청)' })
  async getFiltering(
    @Query() query: GetFilteringQueryDto,
  ): Promise<ApiResponseDto<GetBrandsResponseDto | GetTimelinesResponseDto | GetCategoriesResponseDto>> {
    const result = await this.archiveService.getFiltering(query);
    
    let message = '';
    if (query.name === 'brand') {
      message = '필터링 브랜드 리스트 조회 성공';
    } else if (query.name === 'timeline') {
      message = '필터링 타임라인 리스트 조회 성공';
    } else if (query.name === 'category') {
      message = '필터링 카테고리 리스트 조회 성공';
    }
    
    return ApiResponseDto.success(message, result);
  }

  @Get('my/archive')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 아카이브 리스트 조회 (임시: 테스트 사용자)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 400, description: '올바르지 않은 필터링 파라미터 조건 또는 유효하지 않은 페이지 넘버' })
  @ApiResponse({ status: 401, description: '인증 실패: 토큰 필요 또는 유효하지 않은 토큰' })
  async getMyArchives(
    @Query() query: GetMyArchivesQueryDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<GetMyArchivesResponseDto>> {
    const result = await this.archiveService.getMyArchives(
      user.userId,
      query,
    );
    return ApiResponseDto.success('내 아카이브 리스트를 불러오는데 성공', result);
  }

  @Get('archive/:archiveId')
  @UseGuards(JwtAuthGuard)
  @OptionalAuth()
  @ApiOperation({ summary: '아카이브 상세 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 400, description: '아카이브 id가 uuid 형식이 아님' })
  @ApiResponse({ status: 404, description: '존재하지 않는 아카이브 id' })
  async getArchiveDetail(
    @Param('archiveId', UuidValidationPipe) archiveId: UUID,
    @CurrentUser() user: CurrentUserData | null,
  ): Promise<ApiResponseDto<GetArchiveDetailResponseDto>> {
    const result = await this.archiveService.getArchiveDetail(
      archiveId,
      user?.userId,
    );
    return ApiResponseDto.success('아카이브 상세 화면을 불러오는데 성공', result);
  }

  @Post('archive/upload-urls')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '이미지 업로드용 Presigned URL 생성' })
  @ApiResponse({ status: 200, description: 'Presigned URL 생성 성공' })
  @ApiResponse({ status: 401, description: '인증 실패: 토큰 필요 또는 유효하지 않은 토큰' })
  async generatePresignedUrls(
    @Body() dto: GeneratePresignedUrlDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<GeneratePresignedUrlResponseDto>> {
    const result = await this.storageService.generatePresignedUploadUrls(
      user.userId,
      dto.fileCount,
      dto.expiresInMinutes || 15,
    );
    return ApiResponseDto.success('Presigned URL 생성 성공', result);
  }

  @Post('archive')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '아카이브 등록' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  @ApiResponse({ status: 401, description: '인증 실패: 토큰 필요 또는 유효하지 않은 토큰' })
  @ApiResponse({ status: 503, description: '일시적 오류로 아카이브 등록 실패(재시도 요청)' })
  async createArchive(
    @Body() dto: CreateArchiveDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<CreateArchiveResponseDto>> {
    const result = await this.archiveService.createArchive(user.userId, dto);
    return ApiResponseDto.created('아카이브가 성공적으로 생성됨', result);
  }

  @Put('archive/:archiveId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '아카이브 수정' })
  @ApiResponse({ status: 204, description: '수정 성공' })
  @ApiResponse({ status: 400, description: '아카이브 id가 uuid 형식이 아님' })
  @ApiResponse({ status: 401, description: '인증 실패: 토큰 필요 또는 유효하지 않은 토큰' })
  @ApiResponse({ status: 403, description: '아카이브를 수정할 권한이 없습니다' })
  @ApiResponse({ status: 404, description: '존재하지 않는 아카이브 id' })
  @ApiResponse({ status: 503, description: '일시적 오류로 아카이브 수정 실패(재시도 요청)' })
  async updateArchive(
    @Param('archiveId', UuidValidationPipe) archiveId: UUID,
    @Body() dto: UpdateArchiveDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<Record<string, never>>> {
    await this.archiveService.updateArchive(user.userId, archiveId, dto);
    return ApiResponseDto.noContent('아카이브가 성공적으로 수정됨');
  }

  @Delete('archive/:archiveId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '아카이브 삭제' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: '아카이브 id가 uuid 형식이 아님' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음 (작성자가 아님)' })
  @ApiResponse({ status: 404, description: '존재하지 않는 아카이브 id' })
  @ApiResponse({ status: 503, description: '일시적 오류로 아카이브 삭제 실패(재시도 요청)' })
  async deleteArchive(
    @Param('archiveId', UuidValidationPipe) archiveId: UUID,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<Record<string, never>>> {
    await this.archiveService.deleteArchive(user.userId, archiveId);
    return ApiResponseDto.noContent('아카이브가 성공적으로 삭제됨');
  }

  @Post('archive/:archiveId/judgement')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '아카이브 판정 등록' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  @ApiResponse({ status: 400, description: '아카이브 id가 uuid 형식이 아님' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '존재하지 않는 아카이브 id' })
  @ApiResponse({ status: 503, description: '일시적 오류로 아카이브 판정 등록 실패(재시도 요청)' })
  async createJudgement(
    @Param('archiveId', UuidValidationPipe) archiveId: UUID,
    @Body() dto: CreateJudgementDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<CreateJudgementResponseDto>> {
    const result = await this.archiveService.createJudgement(
      user.userId,
      archiveId,
      dto,
    );
    return ApiResponseDto.created('아카이브 판정이 성공적으로 생성됨', result);
  }

  @Get('my/archive/comments')
  // TODO: Auth - @ApiBearerAuth()
  @ApiOperation({ summary: '내 아카이브에 달린 판정 코멘트 리스트 조회 (임시: 테스트 사용자)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 400, description: '올바르지 않은 필터링 파라미터 조건' })
  // TODO: Auth - @ApiResponse({ status: 401, description: '인증 실패' })
  async getComments(
    @Query() query: GetCommentsQueryDto,
    // TODO: Auth - @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<GetCommentsResponseDto>> {
    const result = await this.archiveService.getComments(TEST_USER_ID, query); // TODO: Auth - Replace with user.userId
    return ApiResponseDto.success('판정 코멘트 리스트를 불러오는데 성공', result);
  }

  @Get('archive/:archiveId/comments')
  // TODO: Auth - @OptionalAuth()
  @ApiOperation({ summary: '특정 아카이브의 판정 코멘트 리스트 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 400, description: '아카이브 id가 uuid 형식이 아님' })
  @ApiResponse({ status: 404, description: '존재하지 않는 아카이브 id' })
  async getArchiveComments(
    @Param('archiveId', UuidValidationPipe) archiveId: UUID,
  ): Promise<ApiResponseDto<GetArchiveCommentsResponseDto>> {
    const result = await this.archiveService.getArchiveComments(archiveId);
    return ApiResponseDto.success('아카이브 코멘트 리스트를 불러오는데 성공', result);
  }

  @Get('interest/archive')
  // TODO: Auth - @ApiBearerAuth()
  @ApiOperation({ summary: '관심 아카이브 리스트 조회 (임시: 테스트 사용자)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 400, description: '올바르지 않은 필터링 파라미터 조건 또는 유효하지 않은 페이지 넘버' })
  // TODO: Auth - @ApiResponse({ status: 401, description: '인증 실패: 토큰 필요 또는 유효하지 않은 토큰' })
  async getInterestArchives(
    @Query() query: GetInterestArchivesQueryDto,
    // TODO: Auth - @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<GetInterestArchivesResponseDto>> {
    const result = await this.archiveService.getInterestArchives(
      TEST_USER_ID, // TODO: Auth - Replace with user.userId
      query,
    );
    return ApiResponseDto.success('관심 아카이브 리스트를 불러오는데 성공', result);
  }

  @Post('interest/archive/:archiveId')
  // TODO: Auth - @ApiBearerAuth()
  @ApiOperation({ summary: '관심 아카이브 등록 (임시: 테스트 사용자)' })
  @ApiResponse({ status: 201, description: '등록 성공' })
  @ApiResponse({ status: 400, description: '아카이브 id가 uuid 형식이 아님' })
  // TODO: Auth - @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '존재하지 않는 아카이브 id' })
  @ApiResponse({ status: 503, description: '일시적 오류로 관심 아카이브 등록 실패(재시도 요청)' })
  async createInterestArchive(
    @Param('archiveId', UuidValidationPipe) archiveId: UUID,
    // TODO: Auth - @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<CreateInterestArchiveResponseDto>> {
    const result = await this.archiveService.createInterestArchive(TEST_USER_ID, archiveId); // TODO: Auth - Replace with user.userId
    return ApiResponseDto.created('관심 아카이브가 성공적으로 등록됨', result);
  }

  @Delete('interest/archive/:archiveId')
  @HttpCode(HttpStatus.NO_CONTENT)
  // TODO: Auth - @ApiBearerAuth()
  @ApiOperation({ summary: '관심 아카이브 삭제 (임시: 테스트 사용자)' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: '아카이브 id가 uuid 형식이 아님' })
  // TODO: Auth - @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '존재하지 않는 아카이브 id' })
  @ApiResponse({ status: 503, description: '일시적 오류로 관심 아카이브 삭제 실패(재시도 요청)' })
  async deleteInterestArchive(
    @Param('archiveId', UuidValidationPipe) archiveId: UUID,
    // TODO: Auth - @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<Record<string, never>>> {
    await this.archiveService.deleteInterestArchive(TEST_USER_ID, archiveId); // TODO: Auth - Replace with user.userId
    return ApiResponseDto.noContent('관심 아카이브가 성공적으로 삭제됨');
  }
}

