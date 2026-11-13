import { Module } from '@nestjs/common';
import { AddItemUseCase } from './application/add-item.use-case';
import { DeleteItemUseCase } from './application/delete-item.use-case';
import { FinishShoppingUseCase } from './application/finish-shopping.use-case';
import { GetCurrentListUseCase } from './application/get-current-list.use-case';
import { MostUsedUseCase } from './application/most-used.use-case';
import { ReopenListUseCase } from './application/reopen-list.use-case';
import { SuggestionsUseCase } from './application/suggestions.use-case';
import { UpdateItemUseCase } from './application/update-item.use-case';
import { SHOPPING_LIST_REPOSITORY } from './domain/ports';
import { DrizzleShoppingListRepository } from './infrastructure/drizzle-shopping-list.repository';
import { ListsController } from './interface/lists.controller';

@Module({
  controllers: [ListsController],
  providers: [
    GetCurrentListUseCase,
    AddItemUseCase,
    UpdateItemUseCase,
    DeleteItemUseCase,
    FinishShoppingUseCase,
    ReopenListUseCase,
    MostUsedUseCase,
    SuggestionsUseCase,
    { provide: SHOPPING_LIST_REPOSITORY, useClass: DrizzleShoppingListRepository },
  ],
})
export class ListsModule {}
