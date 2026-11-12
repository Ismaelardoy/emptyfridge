import {
  type AuthResultDto,
  type CreateHouseholdInput,
  type JoinHouseholdInput,
  type RecoverIdentityInput,
  type RedeemTransferInput,
  createHouseholdInputSchema,
  joinHouseholdInputSchema,
  recoverIdentityInputSchema,
  redeemTransferInputSchema,
} from '@emptyfridge/contracts';
import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import '@fastify/cookie';
import { ZodValidationPipe } from '../../../shared/errors/zod-validation.pipe';
import { AuthenticateSessionUseCase } from '../application/authenticate-session.use-case';
import { QuickCreateHouseholdUseCase } from '../application/quick-create-household.use-case';
import { QuickJoinHouseholdUseCase } from '../application/quick-join-household.use-case';
import { RecoverIdentityUseCase } from '../application/recover-identity.use-case';
import { RedeemTransferTokenUseCase } from '../application/redeem-transfer-token.use-case';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { toUserDto } from './mappers';
import { SESSION_COOKIE, sessionCookieOptions } from './session-cookie';

/**
 * Entrada sin registro: si no hay sesión, se crea una identidad anónima.
 * El rate limit por IP es solo protección contra abuso, nunca identidad.
 */
@Controller('quick')
export class QuickController {
  constructor(
    private readonly authenticate: AuthenticateSessionUseCase,
    private readonly createHousehold: QuickCreateHouseholdUseCase,
    private readonly joinHousehold: QuickJoinHouseholdUseCase,
    private readonly redeemTransfer: RedeemTransferTokenUseCase,
    private readonly recoverIdentity: RecoverIdentityUseCase,
  ) {}

  @Post('household')
  @UseGuards(AuthRateLimitGuard)
  async create(
    @Req() request: FastifyRequest,
    @Body(new ZodValidationPipe(createHouseholdInputSchema)) body: CreateHouseholdInput,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResultDto> {
    const actor = await this.authenticate.tryExecute(request.cookies?.[SESSION_COOKIE]);
    const result = await this.createHousehold.execute(actor, body);
    if (result.session) {
      reply.setCookie(SESSION_COOKIE, result.session.token, sessionCookieOptions());
    }
    return { user: toUserDto(result.user) };
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthRateLimitGuard)
  async join(
    @Req() request: FastifyRequest,
    @Body(new ZodValidationPipe(joinHouseholdInputSchema)) body: JoinHouseholdInput,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResultDto> {
    const actor = await this.authenticate.tryExecute(request.cookies?.[SESSION_COOKIE]);
    const result = await this.joinHousehold.execute(actor, body);
    if (result.session) {
      reply.setCookie(SESSION_COOKIE, result.session.token, sessionCookieOptions());
    }
    return { user: toUserDto(result.user) };
  }

  /** Abre la identidad de otro dispositivo con un vale temporal de un solo uso. */
  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthRateLimitGuard)
  async transfer(
    @Req() request: FastifyRequest,
    @Body(new ZodValidationPipe(redeemTransferInputSchema)) body: RedeemTransferInput,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResultDto> {
    const actor = await this.authenticate.tryExecute(request.cookies?.[SESSION_COOKIE]);
    const result = await this.redeemTransfer.execute(actor, body);
    reply.setCookie(SESSION_COOKIE, result.session.token, sessionCookieOptions());
    return { user: toUserDto(result.user) };
  }

  /** Vuelve a abrir una identidad con el código de recuperación de larga duración. */
  @Post('recover')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthRateLimitGuard)
  async recover(
    @Req() request: FastifyRequest,
    @Body(new ZodValidationPipe(recoverIdentityInputSchema)) body: RecoverIdentityInput,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResultDto> {
    const actor = await this.authenticate.tryExecute(request.cookies?.[SESSION_COOKIE]);
    const result = await this.recoverIdentity.execute(actor, body);
    reply.setCookie(SESSION_COOKIE, result.session.token, sessionCookieOptions());
    return { user: toUserDto(result.user) };
  }
}
