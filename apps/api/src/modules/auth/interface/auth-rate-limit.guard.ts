import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { AppError } from '../../../shared/errors/app-error';

const WINDOW_MS = 5 * 60_000;
const MAX_ATTEMPTS = 20;

interface Attempt {
  count: number;
  resetAt: number;
}

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly attempts = new Map<string, Attempt>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const key = `${request.ip}:${request.routeOptions.url ?? request.url}`;
    const now = Date.now();
    const current = this.attempts.get(key);

    if (!current || current.resetAt <= now) {
      this.attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
      this.cleanup(now);
      return true;
    }

    current.count += 1;
    if (current.count > MAX_ATTEMPTS) {
      throw AppError.tooManyRequests('Demasiados intentos. Espera unos minutos.');
    }

    return true;
  }

  private cleanup(now: number): void {
    if (this.attempts.size < 5_000) {
      return;
    }
    for (const [key, attempt] of this.attempts) {
      if (attempt.resetAt <= now) {
        this.attempts.delete(key);
      }
    }
  }
}
