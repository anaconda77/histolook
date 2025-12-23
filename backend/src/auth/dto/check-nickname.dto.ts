import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CheckNicknameQueryDto {
  @ApiProperty({ description: '닉네임' })
  @IsString()
  @IsNotEmpty()
  nickname: string;
}

export class CheckNicknameResponseDto {
  @ApiProperty({ description: '중복 여부 (true: 중복, false: 사용가능)' })
  isExisting: boolean;
}

