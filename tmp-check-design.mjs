import { chromium } from '@playwright/test';

const out = 'C:/Users/ismae/AppData/Local/Temp/opencode';
const browser = await chromium.launch();

const context = await browser.newContext({
  viewport: { width: 360, height: 640 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
});
const page = await context.newPage();
await page.goto('http://localhost:8080/');
await page.getByLabel('Nombre de la lista').fill(`Casa Compacta ${Date.now()}`);
await page.getByRole('button', { name: 'Crear lista y empezar' }).click();
const input = page.getByPlaceholder('Añadir producto…');

await input.fill('Leche');
await page.getByRole('button', { name: 'Añadir producto' }).click();
await page.getByRole('listitem').filter({ hasText: 'Leche' }).waitFor();
await page.getByRole('dialog').getByRole('button', { name: 'Ahora no' }).click();

await page.getByRole('button', { name: 'Cantidad y unidad' }).click();
await input.fill('Pan de molde');
await page.locator('input[type="number"]').fill('2');
await page.locator('select').selectOption('kg');
await page.getByRole('button', { name: 'Añadir producto' }).click();
await page.getByRole('listitem').filter({ hasText: 'Pan de molde' }).waitFor();

for (const name of ['Mortadela', 'Huevos', 'Café']) {
  await input.fill(name);
  await page.getByRole('button', { name: 'Añadir producto' }).click();
  await page.getByRole('listitem').filter({ hasText: name }).waitFor();
}

await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/compact-top.png` });

await page.getByRole('button', { name: 'Finalizar compra' }).click();
await page.getByRole('dialog').getByRole('heading', { name: 'Finalizar compra' }).waitFor();
await page.screenshot({ path: `${out}/compact-finish-dialog.png` });
await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();

await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight }));
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/compact-bottom.png` });

await page.getByRole('link', { name: 'Hogar', exact: true }).click();
await page.waitForTimeout(500);
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight }));
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/compact-hogar.png` });

await context.close();

const desktop = await browser.newContext({ viewport: { width: 1200, height: 720 } });
const desktopPage = await desktop.newPage();
await desktopPage.goto('http://localhost:8080/');
await desktopPage.getByLabel('Nombre de la lista').fill(`Casa Escritorio ${Date.now()}`);
await desktopPage.getByRole('button', { name: 'Crear lista y empezar' }).click();
const desktopInput = desktopPage.getByPlaceholder('Añadir producto…');
await desktopInput.fill('Leche');
await desktopPage.getByRole('button', { name: 'Añadir producto' }).click();
await desktopPage.getByRole('listitem').filter({ hasText: 'Leche' }).waitFor();
await desktopPage.waitForTimeout(400);
await desktopPage.screenshot({ path: `${out}/compact-desktop.png` });
await desktop.close();

await browser.close();
console.log('ok');
