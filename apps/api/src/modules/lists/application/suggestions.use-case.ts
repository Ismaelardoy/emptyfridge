import { Injectable } from '@nestjs/common';
import { MostUsedUseCase } from './most-used.use-case';

@Injectable()
export class SuggestionsUseCase {
  constructor(private readonly mostUsed: MostUsedUseCase) {}

  async execute(householdId: string): Promise<string[]> {
    const products = await this.mostUsed.execute(householdId, 30);
    return products.map((product) => product.name);
  }
}
