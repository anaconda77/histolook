import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AlarmService } from './alarm.service';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { GetAlarmCountResponseDto } from './dto/get-alarm-count.dto';
import { GetMyAlarmsResponseDto } from './dto/get-my-alarms.dto';

@ApiTags('Alarm')
@Controller('api/v1/alarm')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlarmController {
  constructor(private readonly alarmService: AlarmService) {}

  @Get('count')
  @ApiOperation({ summary: '알림 개수 조회' })
  @ApiResponse({ status: 200, description: '알림 개수 조회 성공' })
  @ApiResponse({ status: 400, description: '액세스 토큰 누락' })
  @ApiResponse({ status: 401, description: '유효하지 않거나 만료된 토큰' })
  async getAlarmCount(
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<GetAlarmCountResponseDto>> {
    const result = await this.alarmService.getAlarmCount(user.userId);
    return ApiResponseDto.success('알림 개수 조회 성공', result);
  }

  @Get('my')
  @ApiOperation({ summary: '알림 리스트 조회' })
  @ApiResponse({ status: 200, description: '알림 리스트 조회 성공' })
  @ApiResponse({ status: 400, description: '액세스 토큰 누락' })
  @ApiResponse({ status: 401, description: '유효하지 않거나 만료된 토큰' })
  async getMyAlarms(
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponseDto<GetMyAlarmsResponseDto>> {
    const result = await this.alarmService.getMyAlarms(user.userId);
    return ApiResponseDto.success('알림 리스트 조회 성공', result);
  }
}

