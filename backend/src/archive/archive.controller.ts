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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ArchiveService } from './archive.service';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { OptionalAuth } from '../common/decorators/optional-auth.decorator';
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
import {
  GetInterestArchivesQueryDto,
  GetInterestArchivesResponseDto,
} from './dto/get-interest-archives.dto';

@ApiTags('Archive')
@Controller('api/v1')
export class ArchiveController {
  constructor(private readonly archiveService: ArchiveService) {}

  @Get('archive')
  @OptionalAuth()
  @ApiOperation({ summary: '홈화면 아카이브 리스트 조회' })
  @ApiResponse({ status: 200, description: '성공' })
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

  @Get('archive/:archiveId')
  @OptionalAuth()
  @ApiOperation({ summary: '아카이브 상세 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getArchiveDetail(
    @Param('archiveId') archiveId: string,
    @CurrentUser() user: CurrentUserData | null,
  ): Promise<ApiResponseDto<GetArchiveDetailResponseDto>> {
    const result = await this.archiveService.getArchiveDetail(
      archiveId,
      user?.userId,
    );
    return ApiResponseDto.success('아카이브 상세 화면을 불러오는데 성공', result);
  }

  @Get('my/archive')
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 아카이브 리스트 조회' })
  @ApiResponse({ status: 200, description: '성공' })
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

  @Post('archive')
  @ApiBearerAuth()
  @ApiOperation({ summary: '아카이브 등록' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  async createArchive(
    @Body() dto: CreateArchiveDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<CreateArchiveResponseDto>> {
    const result = await this.archiveService.createArchive(user.userId, dto);
    return ApiResponseDto.created('아카이브가 성공적으로 생성됨', result);
  }

  @Put('archive/:archiveId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '아카이브 수정' })
  @ApiResponse({ status: 204, description: '수정 성공' })
  async updateArchive(
    @Param('archiveId') archiveId: string,
    @Body() dto: UpdateArchiveDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<Record<string, never>>> {
    await this.archiveService.updateArchive(user.userId, archiveId, dto);
    return ApiResponseDto.noContent('아카이브가 성공적으로 수정됨');
  }

  @Delete('archive/:archiveId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '아카이브 삭제' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  async deleteArchive(
    @Param('archiveId') archiveId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<Record<string, never>>> {
    await this.archiveService.deleteArchive(user.userId, archiveId);
    return ApiResponseDto.noContent('아카이브가 성공적으로 삭제됨');
  }

  @Post('archive/:archiveId/judgement')
  @ApiBearerAuth()
  @ApiOperation({ summary: '아카이브 판정 등록' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  async createJudgement(
    @Param('archiveId') archiveId: string,
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
  @OptionalAuth()
  @ApiOperation({ summary: '판정 코멘트 리스트 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getComments(
    @Query('archiveId') archiveId: string,
    @Query() query: GetCommentsQueryDto,
  ): Promise<ApiResponseDto<GetCommentsResponseDto>> {
    const result = await this.archiveService.getComments(archiveId, query);
    return ApiResponseDto.success('판정 코멘트 리스트를 불러오는데 성공', result);
  }

  @Get('interest/archive')
  @ApiBearerAuth()
  @ApiOperation({ summary: '관심 아카이브 리스트 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getInterestArchives(
    @Query() query: GetInterestArchivesQueryDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<GetInterestArchivesResponseDto>> {
    const result = await this.archiveService.getInterestArchives(
      user.userId,
      query,
    );
    return ApiResponseDto.success('관심 아카이브 리스트를 불러오는데 성공', result);
  }

  @Delete('interest/archive/:archiveId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '관심 아카이브 삭제' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  async deleteInterestArchive(
    @Param('archiveId') archiveId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<Record<string, never>>> {
    await this.archiveService.deleteInterestArchive(user.userId, archiveId);
    return ApiResponseDto.noContent('관심 아카이브가 성공적으로 삭제됨');
  }
}

