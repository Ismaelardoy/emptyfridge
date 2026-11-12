import { expect, test } from '@playwright/test';

test('lista sin registro, más usados, invitación y sincronización', async ({ page, browser }) => {
  const stamp = Date.now();
  const householdName = `Casa E2E ${stamp}`;

  // Entrada sin registro: crear la lista y empezar a añadir productos.
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '¿Otra vez no queda leche?' })).toBeVisible();
  await page.getByLabel('Nombre de la lista').fill(householdName);
  await page.getByRole('button', { name: 'Crear lista y empezar' }).click();

  const productInput = page.getByPlaceholder('Añadir producto…');
  await expect(productInput).toBeVisible();

  const addProduct = async (name: string) => {
    await productInput.fill(name);
    await page.getByRole('button', { name: 'Añadir producto' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: name })).toBeVisible();
  };

  const finishPurchase = async () => {
    await page.getByRole('button', { name: 'Finalizar compra' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Finalizar', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText(/La lista está vacía/)).toBeVisible();
  };

  await addProduct('Leche');
  await addProduct('Pan');
  await finishPurchase();

  await addProduct('Huevos');
  await finishPurchase();

  await addProduct('Huevo');
  await finishPurchase();

  // Más usados: huevo y huevos se agrupan, y se pueden añadir con un toque.
  await page.getByRole('link', { name: 'Más usados', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Más usados' })).toBeVisible();
  const frequent = page.getByTestId('most-used-item');
  await expect(frequent).toHaveCount(3);
  await expect(frequent.nth(0)).toContainText(/Huevo/);
  await expect(frequent.nth(0)).toContainText('2 veces');

  await frequent
    .nth(0)
    .getByRole('button', { name: /Añadir/ })
    .click();
  await page.getByRole('link', { name: 'Lista', exact: true }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Huevo' })).toBeVisible();

  // Compartir el enlace de invitación.
  await page.getByRole('link', { name: 'Hogar', exact: true }).click();
  const inviteCode = (await page.getByTestId('invite-code').innerText()).trim();
  expect(inviteCode).toMatch(/^[A-Z0-9]{6,8}$/);

  // Otra persona abre el enlace sin cuenta y entra directamente.
  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  await secondPage.goto(`/join/${inviteCode}`);
  const secondInput = secondPage.getByPlaceholder('Añadir producto…');
  await expect(secondInput).toBeVisible();
  await expect(secondPage.getByRole('listitem').filter({ hasText: 'Huevo' })).toBeVisible();

  // Sincronización: lo que añade una persona aparece en la otra sin recargar.
  await page.getByRole('link', { name: 'Lista', exact: true }).click();
  await expect(productInput).toBeVisible();
  await secondInput.fill('Café');
  await secondPage.getByRole('button', { name: 'Añadir producto' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Café' })).toBeVisible({
    timeout: 10_000,
  });

  // La sesión se recuerda en ambos dispositivos.
  await page.reload();
  await expect(productInput).toBeVisible();
  await secondPage.reload();
  await expect(secondInput).toBeVisible();

  // Llevarte tu identidad a otro móvil con un enlace temporal de un solo uso.
  await page.getByRole('link', { name: 'Hogar', exact: true }).click();
  await page.getByRole('button', { name: 'Pasar a otro móvil' }).click();
  const transferCode = (await page.getByTestId('transfer-code').innerText()).trim();
  expect(transferCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

  const thirdContext = await browser.newContext();
  const thirdPage = await thirdContext.newPage();
  await thirdPage.goto(`/transfer/${transferCode}`);
  await expect(thirdPage.getByPlaceholder('Añadir producto…')).toBeVisible();

  // Es la misma identidad, no un miembro nuevo del hogar.
  await thirdPage.getByRole('link', { name: 'Hogar', exact: true }).click();
  await expect(thirdPage.getByRole('heading', { name: 'Miembros (2)' })).toBeVisible();
  await expect(thirdPage.getByText('tú', { exact: true })).toBeVisible();

  // El enlace ya se ha consumido: no sirve dos veces.
  const fourthContext = await browser.newContext();
  const fourthPage = await fourthContext.newPage();
  await fourthPage.goto(`/transfer/${transferCode.replace(/-/g, '')}`);
  await expect(fourthPage.getByRole('heading', { name: 'No se pudo abrir' })).toBeVisible();

  await fourthContext.close();

  // Código de recuperación: vale también si se pierde el móvil (no caduca).
  await page.getByRole('button', { name: 'Crear código para volver' }).click();
  const recoveryCode = (await page.getByTestId('recovery-code').innerText()).trim();
  expect(recoveryCode).toMatch(/^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/);
  await page.getByRole('button', { name: 'Hecho' }).click();

  const fifthContext = await browser.newContext();
  const fifthPage = await fifthContext.newPage();
  await fifthPage.goto(`/recover/${recoveryCode.replace(/-/g, '')}`);
  await expect(fifthPage.getByPlaceholder('Añadir producto…')).toBeVisible();
  await fifthPage.getByRole('link', { name: 'Hogar', exact: true }).click();
  await expect(fifthPage.getByRole('heading', { name: 'Miembros (2)' })).toBeVisible();

  await fifthContext.close();

  // Ceder la propiedad: el creador pasa a miembro y el otro puede gestionar.
  await page
    .getByRole('button', { name: /^Hacer owner a / })
    .first()
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Ceder propiedad' }).click();
  await expect(page.getByRole('button', { name: /^Hacer owner a / })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Expulsar a / })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cambiar nombre del hogar' })).toHaveCount(0);
  await expect(page.getByText('Propietario', { exact: true })).toHaveCount(1);

  // El nuevo propietario ve los controles de gestión tras recargar.
  await secondPage.goto('/household');
  await expect(secondPage.getByRole('button', { name: /^Hacer owner a / })).toHaveCount(1);

  // Cerrar sesión en los demás móviles: el enlace de traspaso deja de valer.
  await page.getByRole('button', { name: 'Cerrar sesión en los demás móviles' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar las demás' }).click();
  // Esperar la confirmación evita recargar el otro móvil antes de que se borre la sesión.
  await expect(page.getByText('Sesión cerrada en los demás móviles')).toBeVisible();
  await thirdPage.reload();
  await expect(thirdPage.getByRole('heading', { name: '¿Otra vez no queda leche?' })).toBeVisible();
  await page.goto('/');
  await expect(page.getByPlaceholder('Añadir producto…')).toBeVisible();

  await thirdContext.close();
  await secondContext.close();
});
