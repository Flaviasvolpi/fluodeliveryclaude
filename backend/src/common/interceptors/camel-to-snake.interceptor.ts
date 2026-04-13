import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
}

function isDecimal(obj: any): boolean {
  return obj !== null && typeof obj === 'object' && 'd' in obj && 'e' in obj && 's' in obj;
}

function transformKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    // Convert Prisma Decimal to number
    if (isDecimal(obj)) {
      return Number(obj.toString());
    }
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[camelToSnake(key)] = transformKeys(value);
    }
    return result;
  }
  return obj;
}

@Injectable()
export class CamelToSnakeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object') {
          return transformKeys(data);
        }
        return data;
      }),
    );
  }
}
