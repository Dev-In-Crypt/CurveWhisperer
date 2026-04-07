import { test, expect } from '@playwright/test';

test.describe('Token Detail Page', () => {
  const fakeAddress = '0x0000000000000000000000000000000000000000';

  test('shows not found for invalid token', async ({ page }) => {
    await page.goto(`/token/${fakeAddress}`);
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Token not found')).toBeVisible();
  });

  test('has back link to dashboard', async ({ page }) => {
    await page.goto(`/token/${fakeAddress}`);
    await page.waitForTimeout(2000);
    const backLink = page.locator('a[href="/"]');
    await expect(backLink).toBeVisible();
  });

  test('back link navigates to dashboard', async ({ page }) => {
    await page.goto(`/token/${fakeAddress}`);
    await page.waitForTimeout(2000);
    await page.locator('a[href="/"]').click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('CurveWhisperer');
  });
});
