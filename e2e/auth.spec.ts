import { test, expect } from '@playwright/test';
import { TEST_USER, signIn } from './utils/test-utils';

test.describe('Authentication', () => {
  test('should sign in successfully', async ({ page }) => {
    await signIn(page);
    await expect(page.getByText(/signed in/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('should sign out successfully', async ({ page }) => {
    await signIn(page);
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
}); 