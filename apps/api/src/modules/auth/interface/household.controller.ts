import {
  type HouseholdDto,
  type RenameHouseholdInput,
  type TransferOwnershipInput,
  renameHouseholdInputSchema,
  transferOwnershipInputSchema,
  uuidSchema,
} from '@emptyfridge/contracts';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../../shared/errors/zod-validation.pipe';
import { GetHouseholdUseCase } from '../application/get-household.use-case';
import { RemoveMemberUseCase } from '../application/remove-member.use-case';
import { RenameHouseholdUseCase } from '../application/rename-household.use-case';
import { TransferOwnershipUseCase } from '../application/transfer-ownership.use-case';
import type { User } from '../domain/household';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { toHouseholdDto } from './mappers';

@Controller('household')
@UseGuards(AuthGuard)
export class HouseholdController {
  constructor(
    private readonly getHousehold: GetHouseholdUseCase,
    private readonly renameHousehold: RenameHouseholdUseCase,
    private readonly removeMember: RemoveMemberUseCase,
    private readonly transferOwnershipUseCase: TransferOwnershipUseCase,
  ) {}

  @Get()
  async get(@CurrentUser() user: User): Promise<HouseholdDto> {
    const result = await this.getHousehold.execute(user);
    return toHouseholdDto(result.household, result.members);
  }

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  async rename(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(renameHouseholdInputSchema)) body: RenameHouseholdInput,
  ): Promise<void> {
    await this.renameHousehold.execute(user, body);
  }

  @Delete('members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthRateLimitGuard)
  async remove(
    @CurrentUser() user: User,
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
  ): Promise<void> {
    await this.removeMember.execute(user, id);
  }

  @Post('transfer-ownership')
  @HttpCode(HttpStatus.NO_CONTENT)
  async transferOwnership(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(transferOwnershipInputSchema)) body: TransferOwnershipInput,
  ): Promise<void> {
    await this.transferOwnershipUseCase.execute(user, body.memberId);
  }
}
