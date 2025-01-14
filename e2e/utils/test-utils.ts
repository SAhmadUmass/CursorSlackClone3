import { expect, type Page } from '@playwright/test';

export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
};

export const DEFAULT_TIMEOUT = 10000;

export async function signIn(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  try {
    await page.goto('/');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/signed in/i)).toBeVisible({ timeout: DEFAULT_TIMEOUT });
  } catch (error: any) {
    throw new Error(`Failed to sign in: ${error?.message || 'Unknown error'}`);
  }
}

export async function createChannel(page: Page, channelName: string) {
  try {
    await page.getByRole('button', { name: /create channel/i }).click();
    await page.getByLabel(/channel name/i).fill(channelName);
    await page.getByRole('button', { name: /create/i }).click();
    await expect(page.getByText(channelName)).toBeVisible({ timeout: DEFAULT_TIMEOUT });
  } catch (error: any) {
    throw new Error(`Failed to create channel ${channelName}: ${error?.message || 'Unknown error'}`);
  }
}

export async function sendMessage(page: Page, message: string) {
  try {
    await page.getByRole('textbox', { name: /message/i }).fill(message);
    await page.keyboard.press('Enter');
    await expect(page.getByText(message)).toBeVisible({ timeout: DEFAULT_TIMEOUT });
  } catch (error: any) {
    throw new Error(`Failed to send message: ${error?.message || 'Unknown error'}`);
  }
}

export async function waitForMessage(page: Page, message: string, timeout = DEFAULT_TIMEOUT) {
  try {
    await expect(page.getByText(message)).toBeVisible({ timeout });
  } catch (error: any) {
    throw new Error(`Message not received within ${timeout}ms: ${error?.message || 'Unknown error'}`);
  }
}

export async function startDM(page: Page, username: string) {
  try {
    await page.getByRole('button', { name: /start dm/i }).click();
    await page.getByRole('textbox', { name: /search users/i }).fill(username);
    await page.getByRole('button', { name: new RegExp(username, 'i') }).click();
    await expect(page.getByText(new RegExp(username, 'i'))).toBeVisible({ timeout: DEFAULT_TIMEOUT });
  } catch (error: any) {
    throw new Error(`Failed to start DM with ${username}: ${error?.message || 'Unknown error'}`);
  }
}

export async function cleanupTestData(page: Page) {
  // Add cleanup logic here if needed
  // For example, deleting test channels or messages
} 