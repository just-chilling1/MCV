import { test, expect } from "@playwright/test";

test("GET /api/articles without a user session returns 401", async ({ request }) => {
  const res = await request.get("/api/articles");
  expect(res.status()).toBe(401);
});

test("login redirects to the vault when local auth bypass is on", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText("Mobile Cash Vault").first()).toBeVisible();
});

test("shell fits the brand on a phone width", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/dashboard");
  const brand = page.locator("header.mobile-header-glass").getByRole("link", { name: "Mobile Cash Vault" });
  await expect(brand).toBeVisible();
  const box = await brand.boundingBox();
  expect(box?.width ?? 0).toBeLessThan(300);
  await page.screenshot({ path: "tests/e2e/screenshots/mobile-320.png", fullPage: true });
});

test("desktop shell shows the sidebar", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/dashboard");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await page.screenshot({ path: "tests/e2e/screenshots/desktop.png", fullPage: false });
});
