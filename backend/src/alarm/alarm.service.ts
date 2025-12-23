import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UUID } from '../common/types/uuid.type';
import { GetAlarmCountResponseDto } from './dto/get-alarm-count.dto';
import { GetMyAlarmsResponseDto, AlarmItemDto } from './dto/get-my-alarms.dto';

@Injectable()
export class AlarmService {
  constructor(private prisma: PrismaService) {}

  /**
   * 1. 알림 개수 조회
   * 사용자의 모든 알림 개수를 반환합니다.
   */
  async getAlarmCount(userId: UUID): Promise<GetAlarmCountResponseDto> {
    const count = await this.prisma.alarm.count({
      where: {
        OR: [
          { memberId: userId }, // 개인 알림
          { isGlobal: true },   // 전체 알림
        ],
      },
    });

    return { count };
  }

  /**
   * 2. 알림 리스트 조회
   * 사용자의 알림 목록을 최신순으로 반환합니다.
   */
  async getMyAlarms(userId: UUID): Promise<GetMyAlarmsResponseDto> {
    const alarms = await this.prisma.alarm.findMany({
      where: {
        OR: [
          { memberId: userId }, // 개인 알림
          { isGlobal: true },   // 전체 알림
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const alarmItems: AlarmItemDto[] = alarms.map((alarm) => ({
      id: alarm.id,
      title: alarm.title,
      content: alarm.content,
      imageUrl: alarm.imageUrl,
      resourcePath: alarm.resourcePath,
      publishedAt: this.getRelativeTime(alarm.createdAt),
    }));

    return { alarms: alarmItems };
  }

  /**
   * 상대 시간 계산 헬퍼 함수
   * 예: "방금 전", "1분 전", "1시간 전", "1일 전"
   */
  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
      return '방금 전';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays < 30) {
      return `${diffDays}일 전`;
    } else if (diffMonths < 12) {
      return `${diffMonths}개월 전`;
    } else {
      return `${diffYears}년 전`;
    }
  }
}

