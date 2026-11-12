import type { AuthResultDto, RecoveryCodeDto, TransferTicketDto } from '@emptyfridge/contracts';
import { Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import '@fastify/cookie';
import { CreateTransferTokenUseCase } from '../application/create-transfer-token.use-case';
import { GenerateRecoveryCodeUseCase } from '../application/generate-recovery-code.use-case';
import { LogoutUseCase } from '../application/logout.use-case';
import { RevokeOtherSessionsUseCase } from '../application/revoke-other-sessions.use-case';
import type { User } from '../domain/household';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { toRecoveryCodeDto, toTransferTicketDto, toUserDto } from './mappers';
import { SESSION_COOKIE } from './session-cookie';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly logout: LogoutUseCase,
    private readonly createTransferToken: CreateTransferTokenUseCase,
    private readonly generateRecoveryCode: GenerateRecoveryCodeUseCase,
    private readonly revokeOtherSessions: RevokeOtherSessionsUseCase,
  ) {}

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async signOut(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    await this.logout.execute(request.cookies?.[SESSION_COOKIE]);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: User): AuthResultDto {
    return { user: toUserDto(user) };
  }

  /**
   * Genera un enlace temporal para abrir esta misma identidad en otro dispositivo.
   * Es un vale de un solo uso, no una cuenta: no hay usuario ni contraseña.
   */
  @Post('transfer-token')
  @UseGuards(AuthGuard, AuthRateLimitGuard)
  async transferToken(@CurrentUser() user: User): Promise<TransferTicketDto> {
    const ticket = await this.createTransferToken.execute(user);
    return toTransferTicketDto(ticket);
  }

  /**
   * Código de recuperación de larga duración: vuelve a abrir esta identidad
   * aunque se pierda el dispositivo. Solo se muestra al generarlo.
   */
  @Post('recovery-code')
  @UseGuards(AuthGuard)
  async recoveryCode(@CurrentUser() user: User): Promise<RecoveryCodeDto> {
    const { code } = await this.generateRecoveryCode.execute(user);
    return toRecoveryCodeDto(code);
  }

  /** Cierra la sesión en todos los demás móviles, conservando la actual. */
  @Post('sessions/revoke-others')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  async revokeOthers(@CurrentUser() user: User, @Req() request: FastifyRequest): Promise<void> {
    await this.revokeOtherSessions.execute(user, request.cookies?.[SESSION_COOKIE]);
  }
}
