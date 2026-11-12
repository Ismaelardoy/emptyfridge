import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { ListsModule } from './modules/lists/lists.module';
import { DatabaseModule } from './shared/db/database.module';
import { ProblemDetailsFilter } from './shared/errors/problem-details.filter';
import { HealthModule } from './shared/health/health.module';
import { RequestLoggerInterceptor } from './shared/logging/request-logger.interceptor';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [DatabaseModule, SharedModule, AuthModule, ListsModule, HealthModule],
  providers: [
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggerInterceptor },
  ],
})
export class AppModule {}
