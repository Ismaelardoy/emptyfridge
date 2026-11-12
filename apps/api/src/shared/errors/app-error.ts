export class AppError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static unauthorized(detail = 'Necesitas iniciar sesión.'): AppError {
    return new AppError('UNAUTHORIZED', 401, detail);
  }

  static forbidden(code: string, detail: string): AppError {
    return new AppError(code, 403, detail);
  }

  static notFound(code: string, detail: string): AppError {
    return new AppError(code, 404, detail);
  }

  static conflict(code: string, detail: string): AppError {
    return new AppError(code, 409, detail);
  }

  static validation(detail: string, errors?: unknown): AppError {
    return new AppError('VALIDATION_ERROR', 400, detail, errors);
  }

  static tooManyRequests(detail: string): AppError {
    return new AppError('RATE_LIMITED', 429, detail);
  }
}
