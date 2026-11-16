import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('production PWA registers, versions caches and reloads offline', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-edge', 'One production PWA check is sufficient');
  test.setTimeout(90_000);
  await page.addInitScript(() => sessionStorage.setItem('cosmos_booted', 'true'));
  await page.goto('/');
  await page.getByRole('button', { name: /Continuar/ }).click({ timeout: 25_000 });
  await expect(page.getByRole('dialog', { name: 'Portada de Cosmos Atlas' })).toBeHidden();
  const skip = page.getByRole('button', { name: /Saltar introducción/i });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await expect(page.locator('canvas').first()).toBeVisible();

  const registration = await page.evaluate(async () => {
    const ready = await navigator.serviceWorker.ready;
    return { scope: ready.scope, scriptURL: ready.active?.scriptURL ?? '' };
  });
  expect(registration.scope).toBe(new URL('/', page.url()).href);
  expect(registration.scriptURL).toContain('/sw.js');

  const worker = await page.request.get('/sw.js');
  expect(worker.ok()).toBeTruthy();
  const workerText = await worker.text();
  expect(workerText).toContain('cosmos-catalogs-v2');
  expect(workerText).toContain('cosmos-tles-v2');

  await page.reload();
  await expect(page.locator('canvas').first()).toBeVisible();
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByPlaceholder('Explorar el Cosmos...')).toBeVisible();
  await context.setOffline(false);
});
