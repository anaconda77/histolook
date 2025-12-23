import { ApiProperty } from '@nestjs/swagger';

export class CreateInterestArchiveResponseDto {
  @ApiProperty({ description: '아카이브 ID' })
  archiveId: string;
}

