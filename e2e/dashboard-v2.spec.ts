
import { test, expect } from '@playwright/test';

test.describe('Freelancer Dashboard V2 Restoration', () => {

    test('Verify Missing Widgets are Restored', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'demo@smartgig.com');
        await page.fill('input[type="password"]', 'demo1234');
        await page.click('button:has-text("Sign In")');

        // 2. Verify Dashboard Load
        await expect(page).toHaveURL(/.*\/freelancer\/dashboard/);

        // 3. Verify Reputation Widget
        await expect(page.getByText('Reputation', { exact: true })).toBeVisible();
        await expect(page.getByText('Job Success Score')).toBeVisible();
        await expect(page.getByText('98%').nth(1)).toBeVisible();
        await expect(page.getByText('Communication')).toBeVisible();
        await expect(page.getByText('Quality')).toBeVisible();
        await expect(page.getByText('Deadlines')).toBeVisible();

        // 4. Verify Workload Widget
        await expect(page.getByText('Current Workload')).toBeVisible();
        await expect(page.getByText('Capacity')).toBeVisible();
        await expect(page.getByText('Weekly Hours')).toBeVisible();

        // 5. Verify Skills Widget
        await expect(page.getByText('Verified Skills')).toBeVisible();
        await expect(page.getByText('React', { exact: true })).toBeVisible();
        await expect(page.getByText('TypeScript')).toBeVisible();
    });

});
