
import { test, expect } from '@playwright/test';

test.describe('Client Dashboard Access Verification', () => {

    test('Client Demo Login and Dashboard Access', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'client@smartgig.com');
        await page.fill('input[type="password"]', 'demo1234');
        await page.click('button:has-text("Sign In")');

        // 2. Wait for navigation
        await page.waitForURL(/.*\/client\/dashboard/, { timeout: 10000 });

        // 3. Verify Dashboard Content
        await expect(page.getByText('Hiring Dashboard')).toBeVisible();
        await expect(page.getByText('Active Job Posts').first()).toBeVisible();
        await expect(page.getByText('Pro Plan')).toBeVisible();
    });

});
