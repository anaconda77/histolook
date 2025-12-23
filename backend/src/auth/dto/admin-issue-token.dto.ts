import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class AdminIssueTokenDto {
  @ApiProperty({ description: '관리자 Member ID' })
  @IsUUID()
  @IsNotEmpty()
  memberId: string;
}

export class AdminIssueTokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}

