import {
  type AddItemInput,
  type AddItemResultDto,
  type CurrentListDto,
  type FinishListResultDto,
  type ItemResponseDto,
  type MostUsedDto,
  type SuggestionsDto,
  type UpdateItemInput,
  addItemInputSchema,
  updateItemInputSchema,
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
import { toHouseholdActor } from '../../auth/application/household-actor';
import type { User } from '../../auth/domain/household';
import { AuthGuard } from '../../auth/interface/auth.guard';
import { CurrentUser } from '../../auth/interface/current-user.decorator';
import { AddItemUseCase } from '../application/add-item.use-case';
import { DeleteItemUseCase } from '../application/delete-item.use-case';
import { FinishShoppingUseCase } from '../application/finish-shopping.use-case';
import { GetCurrentListUseCase } from '../application/get-current-list.use-case';
import { MostUsedUseCase } from '../application/most-used.use-case';
import { SuggestionsUseCase } from '../application/suggestions.use-case';
import { UpdateItemUseCase } from '../application/update-item.use-case';
import { toItemDto, toListDto } from './mappers';

@Controller('lists')
@UseGuards(AuthGuard)
export class ListsController {
  constructor(
    private readonly getCurrentList: GetCurrentListUseCase,
    private readonly addItem: AddItemUseCase,
    private readonly updateItem: UpdateItemUseCase,
    private readonly deleteItem: DeleteItemUseCase,
    private readonly finishShopping: FinishShoppingUseCase,
    private readonly mostUsed: MostUsedUseCase,
    private readonly suggestions: SuggestionsUseCase,
  ) {}

  @Get('current')
  async current(@CurrentUser() user: User): Promise<CurrentListDto> {
    const actor = toHouseholdActor(user);
    const list = await this.getCurrentList.execute(actor.householdId);
    return { list: list ? toListDto(list) : null };
  }

  @Post('current/items')
  async createItem(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(addItemInputSchema)) body: AddItemInput,
  ): Promise<AddItemResultDto> {
    const actor = toHouseholdActor(user);
    const result = await this.addItem.execute(actor, body);
    return { item: toItemDto(result.item), created: result.created };
  }

  @Post('current/finish')
  @HttpCode(HttpStatus.OK)
  finish(@CurrentUser() user: User): Promise<FinishListResultDto> {
    return this.finishShopping.execute(toHouseholdActor(user));
  }

  @Patch('items/:id')
  async update(
    @CurrentUser() user: User,
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateItemInputSchema)) body: UpdateItemInput,
  ): Promise<ItemResponseDto> {
    const item = await this.updateItem.execute(toHouseholdActor(user), id, body);
    return { item: toItemDto(item) };
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: User,
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
  ): Promise<void> {
    await this.deleteItem.execute(toHouseholdActor(user).householdId, id);
  }

  @Get('suggestions')
  async getSuggestions(@CurrentUser() user: User): Promise<SuggestionsDto> {
    return {
      suggestions: await this.suggestions.execute(toHouseholdActor(user).householdId),
    };
  }

  @Get('most-used')
  async getMostUsed(@CurrentUser() user: User): Promise<MostUsedDto> {
    return {
      products: await this.mostUsed.execute(toHouseholdActor(user).householdId, 50),
    };
  }
}
