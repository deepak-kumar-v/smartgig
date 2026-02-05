
import { test, expect } from '@playwright/test';

test.describe('Demo User & Dashboard Restoration Flows', () => {

    test('Freelancer Demo: Login and Verify Dashboard Restoration', async ({ page }) => {
        // 1. Login as Demo Freelancer
        await page.goto('/login');
        await page.fill('input[type="email"]', 'demo@smartgig.com');
        await page.fill('input[type="password"]', 'demo1234');
        await page.click('button:has-text("Sign In")');

        // 2. Verify Redirect to Freelancer Dashboard
        await expect(page).toHaveURL(/.*\/freelancer\/dashboard/);

        // 3. Verify Key Restored Elements
        // Metrics
        await expect(page.getByText('Total Earnings')).toBeVisible();
        await expect(page.getByText('Active Jobs')).toBeVisible();

        // Content Areas (checking strict restoration)
        await expect(page.getByRole('heading', { name: 'Active Contracts' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Recent Proposals' })).toBeVisible();
    });

    test('Client Demo: Login and Verify Dashboard Restoration', async ({ page }) => {
        // 1. Login as Demo Client
        await page.goto('/login');
        await page.fill('input[type="email"]', 'client@smartgig.com');
        await page.fill('input[type="password"]', 'demo1234');
        await page.click('button:has-text("Sign In")');

        // 2. Verify Redirect to Client Dashboard
        await expect(page).toHaveURL(/.*\/client\/dashboard/);

        // 3. Verify Key Restored Elements
        await expect(page.getByText('Hiring Dashboard')).toBeVisible();
        await expect(page.getByText('Recent Proposals')).toBeVisible();
        await expect(page.getByText('Total Spent')).toBeVisible();
    });

    test('Logout Functionality', async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('input[type="email"]', 'demo@smartgig.com');
        await page.fill('input[type="password"]', 'demo1234');
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/.*\/freelancer\/dashboard/);

        // Click Logout (Sidebar)
        // Note: There might be multiple log out buttons (mobile/desktop), we pick the first visible one
        const logoutBtn = page.locator('button[title="Sign Out"], button:has-text("Log Out")').first();
        await logoutBtn.click();

        // Verify Redirect to Login
        await expect(page).toHaveURL(/.*\/login/);
        await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

});
