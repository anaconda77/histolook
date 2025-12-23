import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class AdminSecessionDto {
  @ApiProperty({ description: '관리자 Member ID' })
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({ description: '관리자 닉네임' })
  @IsString()
  @IsNotEmpty()
  nickname: string;
}

