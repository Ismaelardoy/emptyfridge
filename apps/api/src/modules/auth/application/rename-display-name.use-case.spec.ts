import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../shared/errors/app-error';
import { fakeUserRepository, makeUser } from '../../../test/fakes';
import { RenameDisplayNameUseCase } from './rename-display-name.use-case';

function build(updateDisplayName = vi.fn(async () => undefined)) {
  const users = fakeUserRepository({ updateDisplayName });

  return {
    updateDisplayName,
    useCase: new RenameDisplayNameUseCase(users),
  };
}

describe('RenameDisplayNameUseCase', () => {
  it('cambia el nombre y guarda la clave normalizada', async () => {
    const { useCase, updateDisplayName } = build();
    const actor = makeUser();

    const updated = await useCase.execute(actor, { displayName: '  José  ' });

    expect(updateDisplayName).toHaveBeenCalledWith('u1', 'José', 'jose');
    expect(updated.displayName).toBe('José');
    expect(updated.displayNameKey).toBe('jose');
  });

  it('propaga el conflicto si el nombre ya está en uso', async () => {
    const updateDisplayName = vi.fn(async () => {
      throw AppError.conflict('DISPLAY_NAME_TAKEN', 'Ese nombre ya está en uso.');
    });
    const { useCase } = build(updateDisplayName);

    await expect(useCase.execute(makeUser(), { displayName: 'Luis' })).rejects.toMatchObject({
      code: 'DISPLAY_NAME_TAKEN',
      status: 409,
    });
    expect(updateDisplayName).toHaveBeenCalled();
  });
});
