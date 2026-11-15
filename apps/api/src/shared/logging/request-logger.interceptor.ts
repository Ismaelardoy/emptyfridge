import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { type Observable, finalize } from 'rxjs';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('http');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();
    const startedAt = Date.now();

    return next.handle().pipe(
      finalize(() => {
        const elapsed = Date.now() - startedAt;
        const line = `${request.method} ${request.url} ${response.statusCode} ${elapsed}ms`;
        // El sondeo de la lista y el healthcheck son ruido constante: con
        // LOG_LEVEL=info no se escriben, con debug sí.
        const isNoise =
          request.method === 'GET' &&
          (request.url.startsWith('/api/lists/current') || request.url === '/api/health');

        if (isNoise) {
          this.logger.debug(line);
        } else {
          this.logger.log(line);
        }
      }),
    );
  }
}
