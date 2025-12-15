import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty()
  status: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  content: T;

  constructor(status: string, message: string, content: T) {
    this.status = status;
    this.message = message;
    this.content = content;
  }

  static success<T>(message: string, content: T): ApiResponseDto<T> {
    return new ApiResponseDto('200 OK', message, content);
  }

  static created<T>(message: string, content: T): ApiResponseDto<T> {
    return new ApiResponseDto('201 Created', message, content);
  }

  static noContent(message: string): ApiResponseDto<Record<string, never>> {
    return new ApiResponseDto('204 No Content', message, {});
  }
}

