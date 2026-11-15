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

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  json?: unknown;
}

/** Hace la petición sin interpretar el cuerpo (para manejar 304, ETag, etc.). */
export function requestApi(path: string, options: RequestOptions = {}): Promise<Response> {
  const { json, headers, ...rest } = options;

  return fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...rest,
    headers: {
      ...(json !== undefined ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });
}

/** Convierte la respuesta en JSON y lanza `ApiError` si no es correcta. */
export async function parseApiResponse<T>(response: Response): Promise<T> {
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

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return parseApiResponse<T>(await requestApi(path, options));
}
