import { describe, expect, it } from 'vitest';
import { buildInviteMessage, buildInviteUrl, buildWhatsAppUrl } from './invite';

describe('enlaces de invitación', () => {
  it('construye el enlace del hogar y el mensaje de WhatsApp', () => {
    const url = buildInviteUrl('ABC123', 'https://erfrigovacio.app');

    expect(url).toBe('https://erfrigovacio.app/join/ABC123');
    expect(buildInviteMessage('Mi casa', url)).toBe(
      '¡Únete a la lista de la compra de Mi casa en erfrigovacio! https://erfrigovacio.app/join/ABC123',
    );
  });

  it('codifica el mensaje para wa.me', () => {
    const whatsapp = buildWhatsAppUrl('Hola mundo & compañía');

    expect(whatsapp.startsWith('https://wa.me/?text=')).toBe(true);
    expect(whatsapp).toContain(encodeURIComponent('Hola mundo & compañía'));
  });
});
