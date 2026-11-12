import { Global, Module } from '@nestjs/common';
import { SystemClock } from './clock/system-clock';
import { CLOCK, ID_GENERATOR } from './domain/ports';
import { UuidGenerator } from './ids/uuid-generator';

@Global()
@Module({
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    { provide: ID_GENERATOR, useClass: UuidGenerator },
  ],
  exports: [CLOCK, ID_GENERATOR],
})
export class SharedModule {}
