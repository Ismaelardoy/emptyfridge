import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import type { IdGenerator } from '../domain/ports';

@Injectable()
export class UuidGenerator implements IdGenerator {
  next(): string {
    return uuidv7();
  }
}
