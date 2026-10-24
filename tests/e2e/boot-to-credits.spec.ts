/** Drives the running browser build with the adapter's autoplay scripts through the window.__gamePort bridge and
 * captures one screenshot per playthrough checkpoint into test-results/playthrough/<adapter>/<checkpoint>.png.
 * When project/private/reference/<checkpoint>.png exists (captured from the original game), both images are
 * attached side by side for visual comparison. Screenshots never leave the machine. */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { runAutoplay, type AutomationTarget, type AutoplayScript } from '../../src/engine/Automation';

const referenceDir = path.join('project', 'private', 'reference');

function target(page: Page): AutomationTarget {
  return {
    tick: () => page.evaluate(() => window.__gamePort!.tick()),
    topState: () => page.evaluate(() => window.__gamePort!.state()),
    inject: (action, phase) => page.evaluate(([a, p]) => window.__gamePort!.inject(a, p), [action, phase] as const),
    advance: ticks => page.evaluate(n => window.__gamePort!.advance(n), ticks),
  };
}

async function openGame(page: Page): Promise<{ id: string; scripts: AutoplayScript[] }> {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?automation=1');
  await page.waitForFunction(() => window.__gamePort !== undefined, null, { timeout: 60_000 });
  expect(errors, 'page errors during boot').toEqual([]);
  return page.evaluate(() => ({ id: window.__gamePort!.adapter.id, scripts: window.__gamePort!.scripts() }));
}

test('real-time mode boots, renders and accepts keyboard input without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const game = page.locator('.canvas-mount');
  await expect(game.locator('canvas')).toHaveCount(2);
  await expect(page.locator('.pill')).not.toHaveText('STARTING…');
  await game.click();
  for (const key of ['Enter', 'Enter', 'ArrowDown', 'ArrowUp', 'Enter', 'ArrowRight', 'Escape', 'Enter']) {
    await page.keyboard.press(key);
    await page.waitForTimeout(150);
  }
  expect(await page.evaluate(() => window.__gamePort)).toBeUndefined();
  expect(errors).toEqual([]);
});

test('every full autoplay script reaches the end credits in the browser', async ({ page }, testInfo) => {
  const { id, scripts } = await openGame(page);
  const full = scripts.filter(s => s.kind === 'full');
  expect(full.length, 'adapter must declare a full boot-to-credits script').toBeGreaterThan(0);
  const shots = path.join('test-results', 'playthrough', id);
  await mkdir(shots, { recursive: true });
  const game = page.locator('.canvas-mount');

  for (const script of full) {
    const report = await runAutoplay(target(page), script, {
      pollTicks: 10,
      onCheckpoint: async checkpoint => {
        await page.evaluate(() => new Promise(requestAnimationFrame));
        const file = path.join(shots, `${checkpoint.id}.png`);
        await game.screenshot({ path: file });
        await testInfo.attach(`${checkpoint.id} (port)`, { path: file, contentType: 'image/png' });
        const reference = path.join(referenceDir, `${checkpoint.id}.png`);
        if (existsSync(reference)) await testInfo.attach(`${checkpoint.id} (original)`, { path: reference, contentType: 'image/png' });
      },
    });
    await writeFile(path.join(shots, `${script.id}.report.json`), JSON.stringify(report, null, 2));
    expect(report.error, `autoplay ${script.id}`).toBeUndefined();
    const reachedCredits = await page.evaluate(() => window.__gamePort!.history().some(h => h.to !== null && window.__gamePort!.kindOf(h.to) === 'credits'));
    expect(reachedCredits, 'transition history must include the end credits').toBe(true);
  }
});
