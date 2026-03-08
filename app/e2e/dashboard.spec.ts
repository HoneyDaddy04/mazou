import { test, expect } from "@playwright/test";

const DEMO_EMAIL = "demo@mazou.io";
const DEMO_PASSWORD = "password123";

// Helper to login via Supabase
async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  // Click "Try Demo Account" button if available, otherwise fill form
  const demoBtn = page.locator('button:has-text("Demo"), button:has-text("demo")');
  if (await demoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await demoBtn.click();
  } else {
    await page.fill('input[type="email"], input[name="email"]', DEMO_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', DEMO_PASSWORD);
    await page.click('button[type="submit"]');
  }
  // Wait for redirect to dashboard (could be / or /dashboard)
  await page.waitForURL(/\/(dashboard)?$/, { timeout: 15000 });
}

test.describe("Login", () => {
  test("demo login redirects to dashboard", async ({ page }) => {
    await login(page);
    // Should see the sidebar with "mazou" branding
    await expect(page.locator("text=mazou").first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Dashboard Pages", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Dashboard page loads with stats", async ({ page }) => {
    await page.goto("/dashboard");
    // Wait for data to load - look for spend or calls indicators
    await expect(
      page.locator("text=/Total Spend|API Calls|Active Models|spend/i").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Usage page loads", async ({ page }) => {
    await page.goto("/usage");
    await expect(
      page.locator("text=/Usage|Spend|Cost|Token/i").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Routing page loads with rules", async ({ page }) => {
    await page.goto("/routing");
    await expect(
      page.locator("text=/Routing|Rules|Language Detection|Budget/i").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Agents page loads", async ({ page }) => {
    await page.goto("/agents");
    await expect(
      page.locator("text=/Customer Support Bot|Fraud Detection|Agents/i").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Recommendations page loads", async ({ page }) => {
    await page.goto("/recommendations");
    await expect(
      page.locator("text=/Recommendation|Downgrade|Route|Savings/i").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Billing page loads with wallet balance", async ({ page }) => {
    await page.goto("/billing");
    await expect(
      page.locator("text=/Balance|Wallet|NGN|Transaction/i").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Keys page loads", async ({ page }) => {
    await page.goto("/keys");
    await expect(
      page.locator("text=/API Key|Production Key|Test Key|mz_/i").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Models page loads", async ({ page }) => {
    await page.goto("/models");
    await expect(
      page.locator("text=/Model|Provider|GPT|Claude|Gemini/i").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Quickstart page loads", async ({ page }) => {
    await page.goto("/quickstart");
    await expect(
      page.locator("text=/Quickstart|Get Started|API|Install/i").first()
    ).toBeVisible({ timeout: 10000 });
  });
});
