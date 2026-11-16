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
  await page.getByRole('button', { name: /Continuar/ }).click({ timeout: 25_000 });
  await expect(page.getByRole('dialog', { name: 'Portada de Cosmos Atlas' })).toBeHidden();
  const skip = page.getByRole('button', { name: /Saltar introducción/i });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click({ timeout: 1_000 }).catch(() => undefined);
  }
  await expect(page.locator('[data-sky-viewport][data-zoom-ready="true"]')).toBeVisible();
  await expect(page.locator('canvas').first()).toBeVisible();
  await expect.poll(async () => (await page.locator('canvas').first().boundingBox())?.width).toBeGreaterThan(350);
}

test.describe('Cosmos Atlas visual journeys', () => {
  test('desktop: bóveda, zoom, búsqueda real y sistema solar', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-edge', 'Desktop-only journey');
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    await enterAtlas(page);

    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(900);
    await page.mouse.move(box!.x + box!.width * 0.5, box!.y + box!.height * 0.35);
    await page.mouse.wheel(0, -700);
    await page.waitForTimeout(800);

    const zoomControls = page.getByLabel('Controles de zoom');
    for (let i = 0; i < 26; i++) await page.getByRole('button', { name: 'Acercar', exact: true }).click();
    await expect.poll(async () => Number(await zoomControls.getAttribute('data-fov'))).toBe(1.5);
    await page.getByRole('button', { name: 'Restablecer zoom', exact: true }).click();

    const search = page.getByPlaceholder('Explorar el Cosmos...');
    await search.fill('NGC 2360');
    const ngc = page.getByRole('button', { name: /NGC 2360/i }).first();
    await expect(ngc).toBeVisible();
    await ngc.click();
    await expect.poll(async () => Number(await zoomControls.getAttribute('data-fov')), { timeout: 20_000 }).toBeLessThan(3);
    await page.screenshot({ path: testInfo.outputPath('desktop-ngc-zoom.png'), fullPage: true });
    await search.fill('M31');
    const result = page.getByRole('button', { name: /M31|M 31|Andrómeda/i }).first();
    await expect(result).toBeVisible();
    await result.click();
    await expect(page.getByText(/M31|M 31|Andrómeda/i).first()).toBeVisible();

    await page.mouse.move(box!.x + box!.width * 0.45, box!.y + box!.height * 0.35);
    await expect.poll(async () => Number(await zoomControls.getAttribute('data-fov'))).toBeGreaterThan(4);
    await page.mouse.wheel(0, -90);
    await page.waitForTimeout(100);
    const manualFov = Number(await zoomControls.getAttribute('data-fov'));
    await page.waitForTimeout(1000);
    expect(Number(await zoomControls.getAttribute('data-fov'))).toBeCloseTo(manualFov, 1);

    const dragPoint = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!;
      const bounds = canvas.getBoundingClientRect();
      const hits: string[] = [];
      for (const horizontal of [0.2, 0.3, 0.6, 0.75]) {
        for (const vertical of [0.3, 0.45, 0.6, 0.75]) {
          const x = bounds.x + bounds.width * horizontal;
          const y = bounds.y + bounds.height * vertical;
          const target = document.elementFromPoint(x, y);
          if (target === canvas) return { x, y };
          hits.push(target?.outerHTML.slice(0, 120) ?? 'null');
        }
      }
      throw new Error('No unobstructed canvas point available for dragging ' + JSON.stringify({ bounds: bounds.toJSON(), hits }));
    });
    await page.mouse.move(dragPoint.x, dragPoint.y);
    await page.mouse.down();
    await page.mouse.move(dragPoint.x + 90, dragPoint.y + 25, { steps: 6 });
    await page.mouse.up();
    const recenter = page.getByRole('button', { name: 'Volver a centrar', exact: true });
    await expect(recenter).toBeVisible();
    await expect(page.locator('aside').getByText('Galaxia de Andrómeda', { exact: true })).toBeVisible();
    await recenter.click();
    await expect(recenter).toBeHidden();

    await page.locator('header').getByRole('button', { name: 'Abrir panel', exact: true }).click();
    await page.getByRole('button', { name: /Control Center/ }).click();
    const explore = page.getByRole('button', { name: /Explorar cielo profundo/ });
    await expect(explore).toHaveAttribute('aria-pressed', 'false');
    await explore.click();
    await expect(explore).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: testInfo.outputPath('desktop-exploration.png'), fullPage: true });
    await page.locator('header').getByRole('button', { name: 'Cerrar panel', exact: true }).click();

    await search.fill('Polaris');
    const polaris = page.getByRole('button', { name: /Polaris/i }).first();
    await expect(polaris).toBeVisible();
    await polaris.click();
    await expect(page.getByText('Polaris', { exact: true }).first()).toBeVisible();

    await page.getByTitle('Sistema Solar').click();
    await expect(page.getByText('SISTEMA SOLAR', { exact: false }).first()).toBeVisible();
    await expect(page.locator('aside').getByText('Galaxia de Andrómeda', { exact: true })).toHaveCount(0);
    await expect(page.locator('aside').getByText('Polaris', { exact: true })).toHaveCount(0);
    await expect(page.getByText('ASISTENTE ASTRONÓMICO', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('desktop-solar-system.png'), fullPage: true });
    expect(errors).toEqual([]);
  });

  test('zoom keeps the same celestial point under the gesture after release', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.clock.setFixedTime(new Date('2026-11-16T22:00:00Z'));
    await enterAtlas(page);
    const mobile = testInfo.project.name === 'mobile-edge';
    if (mobile) await page.getByRole('button', { name: 'Buscar objeto', exact: true }).click();
    const search = page.locator('input[placeholder="Explorar el Cosmos..."]:visible');
    await search.fill('M31');
    await page.getByRole('button', { name: /M31|Andrómeda/i }).first().click();
    if (mobile) await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
    const zoom = page.getByLabel('Controles de zoom');
    await expect.poll(async () => Number(await zoom.getAttribute('data-fov'))).toBeCloseTo(190 * 4 / 60, 0);
    await page.getByRole('button', { name: 'Restablecer zoom', exact: true }).click();
    await expect(zoom).toHaveAttribute('data-fov', '60.00');
    await page.getByRole('button', { name: 'Cerrar ficha', exact: true }).click();
    const canvas = page.locator('canvas').first();
    const box = (await canvas.boundingBox())!;
    const cdp = await page.context().newCDPSession(page);
    const x = box.x + box.width * 0.15;
    const y = box.y + box.height * 0.2;
    if (mobile) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 20, y: y + 8, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 40, y + 15, { steps: 5 });
      await page.mouse.up();
    }
    const label = page.getByText('M31', { exact: true }).first();
    const position = () => label.evaluate(element => {
      let wrapper = element.parentElement;
      while (wrapper && !wrapper.style.transform.startsWith('translate3d(')) wrapper = wrapper.parentElement;
      if (!wrapper) throw new Error('Missing projected DSO label');
      const bounds = wrapper.getBoundingClientRect();
      return { x: bounds.x, y: bounds.y };
    });
    await expect(label).toBeVisible();
    await page.waitForTimeout(250);
    let anchor = await position();
    expect(anchor.x).toBeGreaterThan(box.x + 90);
    expect(anchor.x).toBeLessThan(box.x + box.width - 90);
    if (mobile) {
      for (let pinch = 0; pinch < 3; pinch++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
          { x: anchor.x - 15, y: anchor.y, id: 1 }, { x: anchor.x + 15, y: anchor.y, id: 2 },
        ] });
        for (let step = 1; step <= 5; step++) {
          const spread = 15 + step * 13;
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
            { x: anchor.x + 6 * step / 5 - spread, y: anchor.y + 4 * step / 5, id: 1 },
            { x: anchor.x + 6 * step / 5 + spread, y: anchor.y + 4 * step / 5, id: 2 },
          ] });
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(250);
        const after = await position();
        expect(Math.hypot(after.x - anchor.x - 6, after.y - anchor.y - 4)).toBeLessThan(2);
        anchor = after;
      }
    } else {
      const cursor = { x: Math.round(anchor.x), y: Math.round(anchor.y) };
      await page.mouse.move(cursor.x, cursor.y);
      for (let step = 0; step < 16; step++) await page.mouse.wheel(0, -250);
      // Wheel coordinates use whole CSS pixels. Preserve the initial subpixel
      // offset, magnified by the perspective change from 60 to 1.5 degrees.
      const scale = Math.tan(Math.PI / 6) / Math.tan(1.5 * Math.PI / 360);
      anchor = { x: cursor.x + (anchor.x - cursor.x) * scale, y: cursor.y + (anchor.y - cursor.y) * scale };
    }
    await expect.poll(async () => Number(await zoom.getAttribute('data-fov'))).toBe(1.5);
    await page.waitForTimeout(700);
    const settled = await position();
    expect(Math.hypot(settled.x - anchor.x, settled.y - anchor.y)).toBeLessThan(2);
    await page.screenshot({ path: testInfo.outputPath('anchored-deep-zoom.png'), fullPage: true });
  });

  test.describe('HiPS loading', () => {
    test.use({ serviceWorkers: 'block' });

    test('HiPS retries a failed script and keeps its instance when changing survey', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop-edge', 'Desktop-only integration check');
      test.setTimeout(60_000);
      let requests = 0;
      await page.route('https://aladin.cds.unistra.fr/AladinLite/api/v3/3.8.1/aladin.js', async route => {
        requests++;
        if (requests === 1) {
          await route.fulfill({ status: 404, body: '' });
          return;
        }
        await route.fulfill({ contentType: 'application/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: `
          window.A = {
            init: Promise.resolve(),
            aladin(selector, options) {
              const element = document.querySelector(selector);
              element.dataset.initialisations = String(Number(element.dataset.initialisations || 0) + 1);
              element.dataset.target = options.target;
              return {
                setBaseImageLayer(survey) { element.dataset.survey = survey; },
                gotoRaDec(ra, dec) { element.dataset.target = ra + ' ' + dec; },
                setFoV(fov) { element.dataset.fov = String(fov); }
              };
            }
          };
        ` });
      });
      await enterAtlas(page);
      await page.getByTitle('Vía Láctea científica HiPS').click();
      await expect(page.getByText('No se ha podido cargar la vista científica')).toBeVisible();
      await page.getByRole('button', { name: 'Reintentar HiPS' }).click();
      const view = page.locator('[data-initialisations]');
      await expect(view).toHaveAttribute('data-initialisations', '1');
      await page.getByLabel('Survey astronómico').selectOption('P/PanSTARRS/DR1/color-z-zg-g');
      await expect(view).toHaveAttribute('data-survey', 'P/PanSTARRS/DR1/color-z-zg-g');
      await expect(view).toHaveAttribute('data-initialisations', '1');
      expect(requests).toBe(2);
    });
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
