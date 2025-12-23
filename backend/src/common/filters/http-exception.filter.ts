import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * HTTP 예외를 API 스펙에 맞는 형식으로 변환하는 필터
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // 메시지 추출
    let message: string;
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
      const msg = (exceptionResponse as any).message;
      // class-validator의 배열 메시지 처리
      if (Array.isArray(msg)) {
        message = msg[0];
      } else {
        message = msg;
      }
    } else {
      message = 'Internal server error';
    }

    // API 스펙에 맞는 응답 형식
    response.status(status).json({
      status: `${status} ${this.getStatusText(status)}`,
      message,
      content: {},
    });
  }

  private getStatusText(status: number): string {
    switch (status) {
      case HttpStatus.OK:
        return 'OK';
      case HttpStatus.CREATED:
        return 'Created';
      case HttpStatus.NO_CONTENT:
        return 'No Content';
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'Service Unavailable';
      default:
        return 'Error';
    }
  }
}

