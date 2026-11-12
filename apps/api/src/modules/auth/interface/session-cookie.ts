import { env } from '../../../shared/config/env';

export const SESSION_COOKIE = 'sid';

/**
 * Chrome limita cualquier cookie a 400 días. La sesión no caduca en la base de
 * datos, así que reemitimos la cookie en cada petición autenticada: mientras
 * uses la app, la sesión sigue viva.
 */
export const SESSION_COOKIE_DAYS = 400;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env().PUBLIC_URL.startsWith('https://'),
    path: '/',
    maxAge: SESSION_COOKIE_DAYS * 86_400,
  };
}
