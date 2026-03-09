import { test, expect } from "@playwright/test";

test.describe("Live Site Full Test", () => {
  test.use({ baseURL: "https://mazou.vercel.app" });
  test.setTimeout(120000);

  test("Demo login → all dashboard pages", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.waitForSelector("#root > *", { timeout: 10000 });
    await page.locator('button:has-text("Try Demo Account")').click();
    await page.waitForURL("**/dashboard**", { timeout: 20000 });

    // Wait for dashboard data to load
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/live-dashboard.png", fullPage: true });

    // Verify dashboard loaded with data
    await expect(page.getByText(/Total Spend|API Calls|Active Models/i)).toBeVisible({ timeout: 10000 });

    // Navigate to each page and verify content
    const pages = [
      { path: "/usage", name: "usage", expect: /Usage|Spend|Cost/i },
      { path: "/routing", name: "routing", expect: /Routing|Rules|Language/i },
      { path: "/agents", name: "agents", expect: /Agents|Customer Support|Fraud/i },
      { path: "/recommendations", name: "recommendations", expect: /Recommendation|Savings/i },
      { path: "/keys", name: "keys", expect: /API Key|Production|mz_/i },
      { path: "/billing", name: "billing", expect: /Balance|Wallet|Transaction/i },
      { path: "/models", name: "models", expect: /Model|Provider|GPT|Claude/i },
      { path: "/catalog", name: "catalog", expect: /Catalog|Model|African/i },
      { path: "/quickstart", name: "quickstart", expect: /Quickstart|Get Started|API/i },
      { path: "/settings", name: "settings", expect: /Settings|Profile|Organization/i },
    ];

    for (const p of pages) {
      await page.goto(p.path);
      await page.waitForTimeout(2000);
      await expect(page.getByText(p.expect).first()).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: `test-results/live-${p.name}.png`, fullPage: true });
      console.log(`✓ ${p.name} page loaded`);
    }
  });
});
