import {
  Controller,
  Post,
  Body,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FcmService } from './fcm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { UpdateNotificationSettingsDto, NotificationSettingsResponseDto } from './dto/update-notification-settings.dto';
import { RegisterTokenDto, RegisterTokenResponseDto } from './dto/register-token.dto';
import { SendNotificationDto, SendNotificationResponseDto } from './dto/send-notification.dto';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('FCM')
@Controller('api/v1/fcm')
export class FcmController {
  constructor(
    private readonly fcmService: FcmService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'FCM 토큰 등록/업데이트' })
  @ApiResponse({ status: 200, description: '토큰 등록 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async registerToken(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RegisterTokenDto,
  ): Promise<ApiResponseDto<RegisterTokenResponseDto>> {
    await this.fcmService.registerToken(
      user.userId,
      dto.token,
      dto.platform,
      dto.deviceId,
    );

    return ApiResponseDto.success('FCM 토큰이 성공적으로 등록되었습니다', {
      message: 'Token registered successfully',
    });
  }

  @Delete('token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'FCM 토큰 삭제' })
  @ApiResponse({ status: 204, description: '토큰 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async deleteToken(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: { token: string },
  ): Promise<void> {
    await this.fcmService.deleteToken(dto.token);
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '알림 전송 및 DB 저장' })
  @ApiResponse({ status: 200, description: '알림 전송 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async sendNotification(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SendNotificationDto,
  ): Promise<ApiResponseDto<SendNotificationResponseDto>> {
    // 알림을 DB에 저장
    const alarm = await this.prisma.alarm.create({
      data: {
        title: dto.title,
        content: dto.content,
        alarmType: dto.alarmType,
        imageUrl: dto.imageUrl,
        resourcePath: dto.resourcePath,
        isGlobal: !dto.userIds || dto.userIds.length === 0,
        memberId: dto.userIds && dto.userIds.length === 1 ? dto.userIds[0] : null,
      },
    });

    // FCM으로 알림 전송
    let sentCount = 0;
    if (dto.userIds && dto.userIds.length > 0) {
      // 특정 사용자들에게 전송
      if (dto.userIds.length === 1) {
        await this.fcmService.sendNotificationToUser(
          dto.userIds[0],
          dto.title,
          dto.content,
          {
            imageUrl: dto.imageUrl,
            resourcePath: dto.resourcePath,
            alarmType: dto.alarmType,
          },
        );
        sentCount = 1;
      } else {
        await this.fcmService.sendNotificationToUsers(
          dto.userIds,
          dto.title,
          dto.content,
          {
            imageUrl: dto.imageUrl,
            resourcePath: dto.resourcePath,
            alarmType: dto.alarmType,
          },
        );
        sentCount = dto.userIds.length;
      }
    } else {
      // 전체 알림 전송
      await this.fcmService.sendNotificationToAll(
        dto.title,
        dto.content,
        {
          imageUrl: dto.imageUrl,
          resourcePath: dto.resourcePath,
          alarmType: dto.alarmType,
        },
      );
      // 전체 사용자 수는 별도로 계산 필요 (선택사항)
      sentCount = 0; // 전체 전송 시 카운트는 0으로 표시
    }

    return ApiResponseDto.success('알림이 성공적으로 전송되었습니다', {
      message: 'Notification sent successfully',
      sentCount,
    });
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '알림 설정 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getNotificationSettings(
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<NotificationSettingsResponseDto>> {
    const settings = await this.fcmService.getNotificationSettings(user.userId);
    return ApiResponseDto.success('알림 설정 조회 성공', settings);
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '알림 설정 업데이트' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async updateNotificationSettings(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateNotificationSettingsDto,
  ): Promise<ApiResponseDto<NotificationSettingsResponseDto>> {
    const settings = await this.fcmService.updateNotificationSettings(user.userId, dto);
    return ApiResponseDto.success('알림 설정 업데이트 성공', settings);
  }
}
