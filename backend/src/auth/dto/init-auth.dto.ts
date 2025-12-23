import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class InitAuthDto {
  @ApiProperty({ description: '소셜 액세스 토큰' })
  @IsString()
  @IsNotEmpty()
  socialAccessToken: string;

  @ApiProperty({ description: '소셜 리프레시 토큰' })
  @IsString()
  @IsNotEmpty()
  socialRefreshToken: string;

  @ApiProperty({ description: '공급자 (google, kakao, apple 등)' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ description: '공급자 ID' })
  @IsString()
  @IsNotEmpty()
  providerId: string;

  @ApiPropertyOptional({ description: '이메일' })
  @IsString()
  @IsOptional()
  email?: string;
}

export class InitAuthResponseDto {
  @ApiProperty()
  authUserId: string;

  @ApiProperty()
  provider: string;

  @ApiProperty()
  createdAt: string;
}

