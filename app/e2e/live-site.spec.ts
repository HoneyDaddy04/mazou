import { test, expect } from "@playwright/test";

// Tests against the live Vercel deployment
test.describe("Live Site - mazou.vercel.app", () => {
  test.use({ baseURL: "https://mazou.vercel.app" });

  test("Landing page renders with content", async ({ page }) => {
    await page.goto("/");
    // Wait for React to hydrate
    await page.waitForSelector("#root > *", { timeout: 10000 });
    // Check for mazou branding
    await expect(page.locator("text=/mazou/i").first()).toBeVisible({ timeout: 5000 });
    // Take screenshot for visual verification
    await page.screenshot({ path: "test-results/landing-page.png", fullPage: true });
  });

  test("Login page renders form", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("#root > *", { timeout: 10000 });
    // Check for login form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');
    const demoBtn = page.locator('button:has-text("Try Demo Account")');

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
    await expect(demoBtn).toBeVisible();
    await page.screenshot({ path: "test-results/login-page.png" });
  });

  test("Hub page renders", async ({ page }) => {
    await page.goto("/hub");
    await page.waitForSelector("#root > *", { timeout: 10000 });
    await expect(page.locator("text=/mazou|hub/i").first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: "test-results/hub-page.png" });
  });

  test("Demo login works and dashboard loads", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("#root > *", { timeout: 10000 });

    // Click Try Demo Account
    const demoBtn = page.locator('button:has-text("Try Demo Account")');
    await expect(demoBtn).toBeVisible({ timeout: 5000 });
    await demoBtn.click();

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard**", { timeout: 20000 });
    await page.waitForSelector("#root > *", { timeout: 5000 });

    // Check dashboard loaded with content
    await expect(
      page.locator("text=/Total Spend|API Calls|mazou|Dashboard/i").first()
    ).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: "test-results/dashboard-page.png", fullPage: true });
  });
});
