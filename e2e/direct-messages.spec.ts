import { test, expect } from '@playwright/test';
import { signIn, sendMessage, waitForMessage, startDM } from './utils/test-utils';

test.describe('Direct Messages', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('should start a new DM conversation', async ({ page }) => {
    const username = 'testuser';
    await startDM(page, username);
    await expect(page.getByText(username)).toBeVisible();
  });

  test('should send and receive DMs in real-time', async ({ page, browser }) => {
    // First user starts DM
    const username = 'testuser';
    await startDM(page, username);
    const message = `DM test message ${Date.now()}`;
    await sendMessage(page, message);

    // Second user receives message
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await signIn(page2);
    await page2.getByText(username).click();
    await waitForMessage(page2, message);

    // Second user replies
    const reply = `DM reply ${Date.now()}`;
    await sendMessage(page2, reply);
    await waitForMessage(page, reply);

    await context2.close();
  });

  test('should load DM history after page reload', async ({ page }) => {
    const username = 'testuser';
    await startDM(page, username);
    const message = `History test ${Date.now()}`;
    await sendMessage(page, message);

    // Reload page and check history
    await page.reload();
    await page.getByText(username).click();
    await expect(page.getByText(message)).toBeVisible();
  });

  test('should show online status in DM', async ({ page }) => {
    const username = 'testuser';
    await startDM(page, username);
    await expect(page.getByText(/online/i)).toBeVisible();
  });
}); 