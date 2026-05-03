/**
 * BLACK-BOX E2E: Authentication flows
 */
import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "test@test.com";
const ADMIN_PASSWORD = "test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows login form with email and password fields", async ({ page }) => {
    await expect(page.locator("input[type='email'], input[placeholder*='email' i]").first()).toBeVisible();
    await expect(page.locator("input[type='password']").first()).toBeVisible();
  });

  test("redirects to /dashboard after successful login", async ({ page }) => {
    await page.locator("input[type='email'], input[placeholder*='email' i]").first().fill(ADMIN_EMAIL);
    await page.locator("input[type='password']").first().fill(ADMIN_PASSWORD);
    await page.locator("button[type='submit'], button:has-text('Login'), button:has-text('Sign in')").first().click();
    await page.waitForURL("**/dashboard**", { timeout: 10_000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.locator("input[type='email'], input[placeholder*='email' i]").first().fill("wrong@email.com");
    await page.locator("input[type='password']").first().fill("badpassword");
    await page.locator("button[type='submit'], button:has-text('Login'), button:has-text('Sign in')").first().click();
    // Should NOT navigate to dashboard
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain("/dashboard");
  });

  test("/ redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/login**", { timeout: 8000 });
    expect(page.url()).toContain("/login");
  });
});

test.describe("Auth guard", () => {
  test("dashboard redirects to /login if no token in localStorage", async ({ page }) => {
    // Clear storage first
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/dashboard");
    await page.waitForURL("**/login**", { timeout: 8000 });
    expect(page.url()).toContain("/login");
  });
});
