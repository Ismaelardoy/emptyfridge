import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { AppError } from './app-error';

const TITLES: Record<number, string> = {
  400: 'Solicitud inválida',
  401: 'No autorizado',
  403: 'Prohibido',
  404: 'No encontrado',
  409: 'Conflicto',
  422: 'Datos no válidos',
  429: 'Demasiadas peticiones',
  500: 'Error interno',
};

const CODE_BY_STATUS: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
};

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    const error = this.toAppError(exception);

    const body = {
      type: `https://emptyfridge.app/errors/${error.code.toLowerCase()}`,
      title: TITLES[error.status] ?? 'Error',
      status: error.status,
      detail: error.message,
      code: error.code,
      ...(error.details !== undefined ? { errors: error.details } : {}),
    };

    reply.status(error.status).type('application/problem+json').send(body);
  }

  private toAppError(exception: unknown): AppError {
    if (exception instanceof AppError) {
      return exception;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return new AppError(
        CODE_BY_STATUS[status] ?? 'HTTP_ERROR',
        status,
        status === 404 ? 'Recurso no encontrado.' : exception.message,
      );
    }

    this.logger.error(
      exception instanceof Error ? (exception.stack ?? exception.message) : String(exception),
    );
    return new AppError('INTERNAL_ERROR', 500, 'Algo ha ido mal. Inténtalo de nuevo.');
  }
}
