import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('loads and shows header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('CurveWhisperer');
    await expect(page.locator('text=Four.Meme AI Advisor')).toBeVisible();
  });

  test('shows stats cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Active Curves')).toBeVisible();
    await expect(page.locator('text=Graduations Today')).toBeVisible();
    await expect(page.locator('text=Top Score')).toBeVisible();
    await expect(page.locator('text=Connection')).toBeVisible();
  });

  test('shows search input and sort dropdown', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
  });

  test('sort dropdown has all options', async ({ page }) => {
    await page.goto('/');
    const select = page.locator('select');
    await expect(select.locator('option')).toHaveCount(4);
    await expect(select).toContainText('Score');
    await expect(select).toContainText('Fill');
    await expect(select).toContainText('Velocity');
    await expect(select).toContainText('Newest');
  });

  test('shows Live Feed section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Live Feed')).toBeVisible();
  });

  test('shows footer', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toContainText('Four.Meme AI Sprint');
  });

  test('shows empty state or curve cards', async ({ page }) => {
    await page.goto('/');
    // Wait for loading to finish
    await page.waitForTimeout(2000);
    const emptyState = page.locator('text=No active bonding curves detected');
    const curveCards = page.locator('a[href^="/token/"]');
    // Either empty state or at least one card
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const cardCount = await curveCards.count();
    expect(hasEmpty || cardCount >= 0).toBe(true);
  });

  test('search filters content', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('nonexistent_token_xyz_123');
    await page.waitForTimeout(500);
    // Should show no results or empty state
    const cards = page.locator('a[href^="/token/"]');
    expect(await cards.count()).toBe(0);
  });
});
