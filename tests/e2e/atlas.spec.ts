import { expect, test, type Page } from '@playwright/test';

async function enterAtlas(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    sessionStorage.setItem('cosmos_booted', 'true');
    localStorage.setItem('cosmos-atlas-storage', JSON.stringify({
      state: { hasSeenOnboarding: true },
      version: 4,
    }));
  });
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  if (!response?.ok()) {
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
  const skip = page.getByRole('button', { name: /Saltar introducción/i });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click({ timeout: 1_000 }).catch(() => undefined);
  }
  await expect(page.locator('canvas').first()).toBeVisible();
}

test.describe('Cosmos Atlas visual journeys', () => {
  test('desktop: bóveda, zoom, búsqueda real y sistema solar', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-edge', 'Desktop-only journey');
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    await enterAtlas(page);

    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(900);
    await page.mouse.move(box!.x + box!.width * 0.5, box!.y + box!.height * 0.35);
    await page.mouse.wheel(0, -700);
    await page.waitForTimeout(800);

    const search = page.getByPlaceholder('Explorar el Cosmos...');
    await search.fill('M31');
    const result = page.getByRole('button', { name: /M31|M 31|Andrómeda/i }).first();
    await expect(result).toBeVisible();
    await result.click();
    await expect(page.getByText(/M31|M 31|Andrómeda/i).first()).toBeVisible();

    await search.fill('Polaris');
    const polaris = page.getByRole('button', { name: /Polaris/i }).first();
    await expect(polaris).toBeVisible();
    await polaris.click();
    await expect(page.getByText('Polaris', { exact: true }).first()).toBeVisible();

    await page.getByTitle('Sistema Solar').click();
    await expect(page.getByText('SISTEMA SOLAR', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Galaxia de Andrómeda', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Polaris', { exact: true })).toHaveCount(0);
    await expect(page.getByText('ASISTENTE ASTRONÓMICO', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('desktop-solar-system.png'), fullPage: true });
    expect(errors).toEqual([]);
  });

  test('mobile: layout, gestos de bóveda y panel usable', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-edge', 'Mobile-only journey');
    test.setTimeout(90_000);
    await enterAtlas(page);
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(430);
    const metrics = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(metrics.width).toBeLessThanOrEqual(metrics.client + 1);

    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Sky canvas has no bounds');

    const zoomControls = page.getByLabel('Controles de zoom');
    const initialFov = Number(await zoomControls.getAttribute('data-fov'));
    const cdp = await page.context().newCDPSession(page);
    const centerX = box.x + box.width * 0.5;
    const centerY = box.y + box.height * 0.45;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: centerX - 25, y: centerY, id: 1 },
        { x: centerX + 25, y: centerY, id: 2 },
      ],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: centerX - 90, y: centerY, id: 1 },
        { x: centerX + 90, y: centerY, id: 2 },
      ],
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(async () => Number(await zoomControls.getAttribute('data-fov'))).toBeLessThan(initialFov - 5);

    await page.touchscreen.tap(box.x + box.width * 0.55, box.y + box.height * 0.45);
    await page.getByTitle('Abrir panel').click();
    await expect(page.getByText('GUÍA', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('mobile-panel.png'), fullPage: true });
  });
});
