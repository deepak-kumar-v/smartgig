
import { test, expect } from '@playwright/test';

test.describe('SmartGIG Smoke Tests', () => {

    test('Login page loads and shows OAuth buttons', async ({ page }) => {
        await page.goto('/login');
        // Check for Heading "Welcome Back" as title might be generic "SmartGIG"
        await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
        await expect(page.getByTestId('login-google-btn')).toBeVisible();
        await expect(page.getByTestId('login-github-btn')).toBeVisible();
    });

    test('Freelancer dashboard renders (or redirects)', async ({ page }) => {
        const response = await page.goto('/freelancer/dashboard');
        // It might redirect to login if not authenticated, which is fine for smoke test validity
        // We just want to ensure it doesn't crash (500)
        expect(response?.status()).toBeLessThan(500);
    });

    test('Service builder renders', async ({ page }) => {
        // Assuming /freelancer/services/new is the wizard
        const response = await page.goto('/freelancer/services/new');
        expect(response?.status()).toBeLessThan(500);
    });

    test('Video call route renders container or redirects', async ({ page }) => {
        // Generate a random room ID
        const roomId = 'smoke-test-room-' + Date.now();
        const response = await page.goto(`/video-call/${roomId}`);
        expect(response?.status()).toBeLessThan(500);

        // Check if we are on login page (redirected) OR if video container is present
        if (page.url().includes('/login')) {
            await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
        } else {
            // Check for container if page loaded successfully (even if access denied, it renders a state)
            // The VideoCallPage handles access denied gracefully without crashing.
            // We can look for the "Call Not Authorized" text OR the video container.
            const container = page.getByTestId('video-room-container');
            const accessDenied = page.getByText('Call Not Authorized');
            const notFound = page.getByText('Room Not Found');
            const loading = page.getByText('Validating access...');

            await expect(container.or(accessDenied).or(notFound).or(loading)).toBeVisible();
        }
    });

    test('Payments invoices route renders', async ({ page }) => {
        const response = await page.goto('/payments');
        expect(response?.status()).toBeLessThan(500);

        // If it redirects to login, that's valid behavior for unauth
        // If it loads, we check for content
    });
});
