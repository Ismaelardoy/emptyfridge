import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { User } from '../domain/household';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const request = context.switchToHttp().getRequest<{ user: User }>();
    return request.user;
  },
);
