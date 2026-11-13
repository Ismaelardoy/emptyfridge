import { expect, test } from '@playwright/test';

test('lista sin registro, más usados, invitación y sincronización', async ({ page, browser }) => {
  const stamp = Date.now();
  const householdName = `Casa E2E ${stamp}`;

  // Entrada sin registro: crear la lista y empezar a añadir productos.
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tenemos un infiltrado en casa.' })).toBeVisible();
  await page.getByLabel('Nombre de la lista').fill(householdName);
  await page.getByRole('button', { name: 'Crear mi lista' }).click();

  const productInput = page.getByPlaceholder('Añadir producto…');
  await expect(productInput).toBeVisible();

  const addProduct = async (name: string) => {
    await productInput.fill(name);
    // Al empezar a escribir se abren solos los ajustes de cantidad/unidad.
    await expect(page.locator('input[type="number"]')).toBeVisible();
    await page.getByRole('button', { name: 'Añadir producto' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: name })).toBeVisible();
  };

  const finishPurchase = async () => {
    await page.getByRole('button', { name: 'Finalizar compra' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Finalizar', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Compra finalizada', { exact: true })).toBeVisible();
  };

  await addProduct('Leche');

  // Tras el primer producto se sugiere instalar la PWA. En este entorno no hay
  // diálogo nativo, así que se muestra el tutorial manual.
  const installDialog = page.getByRole('dialog');
  await expect(installDialog.getByRole('heading', { name: /pantalla de inicio/i })).toBeVisible();
  await installDialog.getByRole('button', { name: 'Ahora no' }).click();
  await expect(installDialog).toBeHidden();

  await addProduct('Pan');
  await finishPurchase();

  // Se puede revertir una compra finalizada por error.
  await page.getByRole('button', { name: 'Revertir compra' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Leche' })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'Pan' })).toBeVisible();
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

  // Compartir el enlace de invitación. El historial vive al final de Hogar.
  await page.getByRole('link', { name: 'Hogar', exact: true }).click();
  await expect(page.getByText('Quién añadió qué')).toBeVisible();
  const inviteCode = (await page.getByTestId('invite-code').innerText()).trim();
  expect(inviteCode).toMatch(/^[A-Z0-9]{6,8}$/);
  // El código de acceso se genera solo la primera vez que se entra en Hogar.
  const recoveryCode = (await page.getByTestId('recovery-code').innerText()).trim();
  expect(recoveryCode).toMatch(/^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/);

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
  const secondInstallDialog = secondPage.getByRole('dialog');
  await expect(
    secondInstallDialog.getByRole('heading', { name: /pantalla de inicio/i }),
  ).toBeVisible();
  await secondInstallDialog.getByRole('button', { name: 'Ahora no' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Café' })).toBeVisible({
    timeout: 10_000,
  });

  // La sesión se recuerda en ambos dispositivos.
  await page.reload();
  await expect(productInput).toBeVisible();
  await secondPage.reload();
  await expect(secondInput).toBeVisible();

  // El código de acceso abre la misma identidad en otro dispositivo.
  const thirdContext = await browser.newContext();
  const thirdPage = await thirdContext.newPage();
  await thirdPage.goto(`/recover/${recoveryCode.replace(/-/g, '')}`);
  await expect(thirdPage.getByPlaceholder('Añadir producto…')).toBeVisible();

  // Es la misma identidad, no un miembro nuevo del hogar.
  await thirdPage.getByRole('link', { name: 'Hogar', exact: true }).click();
  await expect(thirdPage.getByRole('heading', { name: 'Miembros (2)' })).toBeVisible();
  await expect(thirdPage.getByText('tú', { exact: true })).toBeVisible();

  // Ceder la propiedad: el creador pasa a miembro y el otro puede gestionar.
  await page.getByRole('link', { name: 'Hogar', exact: true }).click();
  await page
    .getByRole('button', { name: /^Hacer owner a / })
    .first()
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Ceder propiedad' }).click();
  await expect(page.getByRole('button', { name: /^Hacer owner a / })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Expulsar a / })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Cambiar nombre del hogar' })).toHaveCount(0);
  await expect(page.getByText('Propietario', { exact: true })).toHaveCount(1);

  // El nuevo propietario ve los controles de gestión tras recargar.
  await secondPage.goto('/household');
  await expect(secondPage.getByRole('button', { name: /^Hacer owner a / })).toHaveCount(1);

  // Cerrar sesión en este dispositivo: se olvida esta identidad y se puede entrar en otra lista.
  await thirdPage.getByRole('button', { name: 'Cerrar sesión en este dispositivo' }).click();
  await thirdPage
    .getByRole('dialog')
    .getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await expect(thirdPage.getByRole('heading', { name: 'Entrar en la lista' })).toBeVisible();

  // Expulsar a alguien elimina su identidad si se queda sin hogar.
  await secondPage
    .getByRole('button', { name: /^Expulsar a / })
    .first()
    .click();
  await secondPage
    .getByRole('dialog')
    .getByRole('button', { name: 'Expulsar', exact: true })
    .click();
  await expect(secondPage.getByRole('heading', { name: 'Miembros (1)' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Tenemos un infiltrado en casa.' })).toBeVisible();

  await thirdContext.close();
  await secondContext.close();
});
