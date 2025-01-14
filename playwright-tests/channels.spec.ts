import { test, expect } from '@playwright/test';
import { signIn, createChannel, sendMessage, waitForMessage } from './utils/test-utils';

test.describe('Channel Operations', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('should create a new channel', async ({ page }) => {
    const channelName = `test-channel-${Date.now()}`;
    await createChannel(page, channelName);
    await expect(page.getByText(channelName)).toBeVisible();
  });

  test('should join an existing channel', async ({ page }) => {
    const channelName = `join-channel-${Date.now()}`;
    await createChannel(page, channelName);
    await page.getByRole('link', { name: /browse channels/i }).click();
    await page.getByText(channelName).click();
    await page.getByRole('button', { name: /join channel/i }).click();
    await expect(page.getByText(/joined channel/i)).toBeVisible();
  });

  test('should send and receive messages in a channel', async ({ page, browser }) => {
    // Create channel and send message
    const channelName = `message-channel-${Date.now()}`;
    await createChannel(page, channelName);
    const message = `Test message ${Date.now()}`;
    await sendMessage(page, message);

    // Create a second browser context to simulate another user
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await signIn(page2);
    await page2.getByText(channelName).click();
    await waitForMessage(page2, message);

    await context2.close();
  });

  test('should load message history when joining channel', async ({ page }) => {
    const channelName = `history-channel-${Date.now()}`;
    await createChannel(page, channelName);
    const message = `History message ${Date.now()}`;
    await sendMessage(page, message);

    // Reload page to test history loading
    await page.reload();
    await page.getByText(channelName).click();
    await expect(page.getByText(message)).toBeVisible();
  });
}); 