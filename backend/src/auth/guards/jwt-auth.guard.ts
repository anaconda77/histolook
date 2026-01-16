import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { OPTIONAL_AUTH_KEY } from '../../common/decorators/optional-auth.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isOptional = this.reflector.getAllAndOverride<boolean>(
      OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isOptional) {
      // Optional Auth인 경우, 토큰이 없어도 통과
      // 단, 토큰이 있으면 검증 후 user 정보를 설정
      const result = super.canActivate(context);
      
      if (result instanceof Promise) {
        return result.catch(() => true);
      } else if (result instanceof Observable) {
        return new Observable((subscriber) => {
          (result as Observable<boolean>).subscribe({
            next: (value) => subscriber.next(value),
            error: () => {
              subscriber.next(true);
              subscriber.complete();
            },
            complete: () => subscriber.complete(),
          });
        });
      }
      return result;
    }

    return super.canActivate(context);
  }
}

