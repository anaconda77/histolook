import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateSupportDto {
  @ApiProperty({ description: '문의 제목 (최대 30자)' })
  @IsString()
  @IsNotEmpty({ message: '제목 누락 혹은 길이 초과' })
  @MaxLength(30, { message: '제목 누락 혹은 길이 초과' })
  title: string;

  @ApiProperty({ description: '문의 유형' })
  @IsString()
  @IsNotEmpty()
  supportType: string;

  @ApiProperty({ description: '문의 내용 (최대 300자)' })
  @IsString()
  @IsNotEmpty({ message: '내용 누락 혹은 길이 초과' })
  @MaxLength(300, { message: '내용 누락 혹은 길이 초과' })
  content: string;
}

export class CreateSupportResponseDto {
  @ApiProperty({ description: '문의글 ID' })
  supportPostId: string;

  @ApiProperty({ description: '회원 ID' })
  memberId: string;

  @ApiProperty({ description: '제목' })
  title: string;

  @ApiProperty({ description: '문의 유형' })
  supportType: string;
}

