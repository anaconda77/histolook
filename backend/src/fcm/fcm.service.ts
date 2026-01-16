import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import type { UUID } from '../common/types/uuid.type';
import { UpdateNotificationSettingsDto, NotificationSettingsResponseDto } from './dto/update-notification-settings.dto';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(private prisma: PrismaService) {
    // Firebase Admin 초기화
    if (!admin.apps.length) {
      try {
        // 환경변수에서 Firebase 서비스 계정 키 경로 또는 JSON 문자열 사용
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
        
        if (serviceAccount) {
          // JSON 문자열인 경우 파싱
          const serviceAccountJson = JSON.parse(serviceAccount);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccountJson),
          });
        } else {
          // 기본 애플리케이션 자격 증명 사용 (환경변수 GOOGLE_APPLICATION_CREDENTIALS)
          admin.initializeApp();
        }
        
        this.logger.log('Firebase Admin initialized successfully');
      } catch (error) {
        this.logger.error('Firebase Admin initialization failed', error);
      }
    }
  }

  /**
   * FCM 토큰 등록/업데이트
   */
  async registerToken(
    userId: UUID,
    token: string,
    platform: 'ios' | 'android',
    deviceId?: string,
  ): Promise<void> {
    try {
      // 기존 토큰이 있는지 확인
      const existingToken = await this.prisma.deviceToken.findUnique({
        where: { token },
      });

      if (existingToken) {
        // 토큰이 이미 존재하면 업데이트
        await this.prisma.deviceToken.update({
          where: { token },
          data: {
            memberId: userId,
            platform,
            deviceId,
            updatedAt: new Date(),
          },
        });
      } else {
        // 새 토큰 등록
        await this.prisma.deviceToken.create({
          data: {
            token,
            memberId: userId,
            platform,
            deviceId,
          },
        });
      }

      this.logger.log(`FCM token registered for user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to register FCM token', error);
      throw error;
    }
  }

  /**
   * FCM 토큰 삭제
   */
  async deleteToken(token: string): Promise<void> {
    try {
      await this.prisma.deviceToken.delete({
        where: { token },
      });
      this.logger.log(`FCM token deleted: ${token}`);
    } catch (error) {
      this.logger.error('Failed to delete FCM token', error);
      throw error;
    }
  }

  /**
   * 사용자의 모든 FCM 토큰 조회
   */
  async getUserTokens(userId: UUID): Promise<string[]> {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { memberId: userId },
      select: { token: true },
    });
    return tokens.map((t) => t.token);
  }

  /**
   * 단일 사용자에게 알림 전송
   */
  async sendNotificationToUser(
    userId: UUID,
    title: string,
    body: string,
    data?: {
      imageUrl?: string;
      resourcePath?: string;
      alarmType?: string;
    },
  ): Promise<void> {
    try {
      const tokens = await this.getUserTokens(userId);
      
      if (tokens.length === 0) {
        this.logger.warn(`No FCM tokens found for user ${userId}`);
        return;
      }

      await this.sendToTokens(tokens, title, body, data);
      this.logger.log(`Notification sent to user ${userId} (${tokens.length} devices)`);
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}`, error);
      throw error;
    }
  }

  /**
   * 여러 사용자에게 알림 전송
   */
  async sendNotificationToUsers(
    userIds: UUID[],
    title: string,
    body: string,
    data?: {
      imageUrl?: string;
      resourcePath?: string;
      alarmType?: string;
    },
  ): Promise<void> {
    try {
      const tokens = await this.prisma.deviceToken.findMany({
        where: { memberId: { in: userIds } },
        select: { token: true },
      });

      if (tokens.length === 0) {
        this.logger.warn(`No FCM tokens found for users`);
        return;
      }

      const tokenList = tokens.map((t) => t.token);
      await this.sendToTokens(tokenList, title, body, data);
      this.logger.log(`Notification sent to ${userIds.length} users (${tokenList.length} devices)`);
    } catch (error) {
      this.logger.error('Failed to send notification to users', error);
      throw error;
    }
  }

  /**
   * 모든 사용자에게 알림 전송 (전체 알림)
   */
  async sendNotificationToAll(
    title: string,
    body: string,
    data?: {
      imageUrl?: string;
      resourcePath?: string;
      alarmType?: string;
    },
  ): Promise<void> {
    try {
      const tokens = await this.prisma.deviceToken.findMany({
        select: { token: true },
      });

      if (tokens.length === 0) {
        this.logger.warn('No FCM tokens found');
        return;
      }

      const tokenList = tokens.map((t) => t.token);
      await this.sendToTokens(tokenList, title, body, data);
      this.logger.log(`Notification sent to all users (${tokenList.length} devices)`);
    } catch (error) {
      this.logger.error('Failed to send notification to all users', error);
      throw error;
    }
  }

  /**
   * FCM 토큰 리스트로 알림 전송 (내부 메서드)
   */
  private async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: {
      imageUrl?: string;
      resourcePath?: string;
      alarmType?: string;
    },
  ): Promise<void> {
    if (tokens.length === 0) {
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
        imageUrl: data?.imageUrl,
      },
      data: {
        title,
        body,
        ...(data?.imageUrl && { imageUrl: data.imageUrl }),
        ...(data?.resourcePath && { resourcePath: data.resourcePath }),
        ...(data?.alarmType && { alarmType: data.alarmType }),
      },
      tokens,
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      
      // 실패한 토큰 제거
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            this.logger.warn(`Failed to send to token ${tokens[idx]}: ${resp.error?.message}`);
          }
        });

        // 실패한 토큰 삭제
        if (failedTokens.length > 0) {
          await this.prisma.deviceToken.deleteMany({
            where: { token: { in: failedTokens } },
          });
          this.logger.log(`Removed ${failedTokens.length} invalid tokens`);
        }
      }

      this.logger.log(`Successfully sent ${response.successCount} notifications`);
    } catch (error) {
      this.logger.error('Failed to send FCM messages', error);
      throw error;
    }
  }

  /**
   * 알림 설정 조회
   */
  async getNotificationSettings(userId: UUID): Promise<NotificationSettingsResponseDto> {
    const deviceToken = await this.prisma.deviceToken.findFirst({
      where: { memberId: userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!deviceToken) {
      // 토큰이 없으면 기본값 반환
      return {
        notificationEnabled: true,
      };
    }

    return {
      notificationEnabled: deviceToken.notificationEnabled,
    };
  }

  /**
   * 알림 설정 업데이트
   */
  async updateNotificationSettings(
    userId: UUID,
    dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettingsResponseDto> {
    // 사용자의 모든 디바이스 토큰 업데이트
    await this.prisma.deviceToken.updateMany({
      where: { memberId: userId },
      data: {
        notificationEnabled: dto.notificationEnabled,
      },
    });

    return this.getNotificationSettings(userId);
  }
}
