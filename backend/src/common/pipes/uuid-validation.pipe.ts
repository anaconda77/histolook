import { PipeTransform, Injectable } from '@nestjs/common';
import { InvalidUuidException } from '../exceptions/custom-exceptions';

/**
 * UUID 형식 검증 파이프
 */
@Injectable()
export class UuidValidationPipe implements PipeTransform {
  private readonly uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  transform(value: string): string {
    if (!this.uuidRegex.test(value)) {
      throw new InvalidUuidException();
    }
    return value;
  }
}

