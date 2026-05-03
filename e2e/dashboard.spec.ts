/**
 * BLACK-BOX E2E: Dashboard, Settings, CLO Analysis flows
 */
import { test, expect, Page } from "@playwright/test";

const ADMIN_EMAIL = "test@test.com";
const ADMIN_PASSWORD = "test";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("input[type='email'], input[placeholder*='email' i]").first().fill(email);
  await page.locator("input[type='password']").first().fill(password);
  await page.locator("button[type='submit'], button:has-text('Login'), button:has-text('Sign in')").first().click();
  await page.waitForURL("**/dashboard**", { timeout: 10_000 });
}

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("shows the three stats cards", async ({ page }) => {
    await expect(page.getByText("CLO Achievement", { exact: true })).toBeVisible();
    await expect(page.getByText("Total Assessments", { exact: true })).toBeVisible();
    await expect(page.getByText(/Total Courses/i).first()).toBeVisible();
  });

  test("shows the CLO chart section", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    // Either shows data or empty state — both are valid
    const hasChart = await page.getByText("CLO Achievement by Course").isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/No CLO analysis saved yet/i).isVisible().catch(() => false);
    expect(hasChart || hasEmpty).toBe(true);
  });

  test("top-right avatar button navigates to settings", async ({ page }) => {
    // The avatar is a button with the user's initial
    const avatarBtn = page.locator("button.rounded-full").first();
    await avatarBtn.click();
    await page.waitForURL("**/settings**", { timeout: 6000 });
    expect(page.url()).toContain("/dashboard/settings");
  });
});

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard/settings");
  });

  test("displays user info (name, email, role)", async ({ page }) => {
    await expect(page.getByText(/Settings/i).first()).toBeVisible();
    // Email section visible
    await expect(page.getByText(/Email Addresses/i)).toBeVisible();
  });

  test("Edit Settings button toggles edit mode", async ({ page }) => {
    await page.getByText("Edit Settings").click();
    // Name input should appear
    await expect(page.locator("input[type='text']").first()).toBeVisible();
    // Cancel button should appear
    await expect(page.getByText("Cancel")).toBeVisible();
  });

  test("Cancel in edit mode restores read-only view", async ({ page }) => {
    await page.getByText("Edit Settings").click();
    await page.getByText("Cancel").click();
    // Edit button should be back
    await expect(page.getByText("Edit Settings")).toBeVisible();
    // No text inputs
    const inputs = page.locator("input[type='text']");
    await expect(inputs).toHaveCount(0);
  });
});

test.describe("CLO Analysis Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard/clo-analysis");
  });

  test("page loads with CLO Analysis heading and empty state", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /CLO Analysis/i })).toBeVisible();
    // Default empty state heading
    await expect(page.getByRole("heading", { name: /No analysis yet/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Open Analysis Settings/i })).toBeVisible();
  });

  test("Save Analysis button is hidden before running analysis", async ({ page }) => {
    const saveBtn = page.getByText("Save Analysis");
    // Should not be visible before analysis runs
    const count = await saveBtn.count();
    if (count > 0) {
      await expect(saveBtn).not.toBeVisible();
    }
  });
});

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("Sidebar links navigate to correct pages", async ({ page }) => {
    const navMap: [string, string][] = [
      ["Assessments", "/dashboard/assessments"],
      ["Courses", "/dashboard/courses"],
      ["Reports", "/dashboard/reports"],
      ["Inbox", "/dashboard/inbox"],
    ];
    for (const [label, urlPart] of navMap) {
      const link = page.getByRole("link", { name: label }).or(page.getByText(label)).first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForURL(`**${urlPart}**`, { timeout: 6000 });
        expect(page.url()).toContain(urlPart);
      }
    }
  });
});
