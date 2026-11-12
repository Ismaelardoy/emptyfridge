import { describe, expect, it } from 'vitest';
import { normalizeDisplayName } from './normalize-display-name';

describe('normalizeDisplayName', () => {
  it('trata "José" y "jose" como el mismo nombre', () => {
    expect(normalizeDisplayName('  José ')).toBe(normalizeDisplayName('jose'));
  });

  it('colapsa espacios internos', () => {
    expect(normalizeDisplayName('María   José')).toBe('maria jose');
  });
});
