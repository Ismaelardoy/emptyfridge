import type { ProblemDetails } from '@emptyfridge/contracts';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  json?: unknown;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;

  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...rest,
    headers: {
      ...(json !== undefined ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => null)) as ProblemDetails | T | null;

  if (!response.ok) {
    const problem = payload as ProblemDetails | null;
    throw new ApiError(
      response.status,
      problem?.code ?? 'UNKNOWN',
      problem?.detail ?? 'Algo ha ido mal. Inténtalo de nuevo.',
      problem?.errors,
    );
  }

  return payload as T;
}
