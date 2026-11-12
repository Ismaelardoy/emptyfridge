import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import '@fastify/cookie';
import { AppError } from '../../../shared/errors/app-error';
import { AuthenticateSessionUseCase } from '../application/authenticate-session.use-case';
import type { User } from '../domain/household';
import { SESSION_COOKIE, sessionCookieOptions } from './session-cookie';

type AuthenticatedRequest = FastifyRequest & { user?: User };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authenticate: AuthenticateSessionUseCase) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[SESSION_COOKIE];
    const auth = await this.authenticate.tryExecuteWithSession(token);

    if (!auth) {
      throw AppError.unauthorized('Tu sesión ha caducado. Vuelve a entrar.');
    }

    request.user = auth.user;

    // La sesión no caduca en BD, pero las cookies sí (límite del navegador):
    // se reemite en cada visita para que el móvil no se quede fuera.
    if (token) {
      const reply = context.switchToHttp().getResponse<FastifyReply>();
      reply.setCookie(SESSION_COOKIE, token, sessionCookieOptions());
    }

    return true;
  }
}
