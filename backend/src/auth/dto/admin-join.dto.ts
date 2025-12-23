import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AdminJoinDto {
  @ApiProperty({ description: '관리자 닉네임' })
  @IsString()
  @IsNotEmpty()
  nickname: string;
}

export class AdminJoinResponseDto {
  @ApiProperty()
  memberId: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ type: [String] })
  brandInterests: string[];

  @ApiProperty()
  createdAt: string;
}

