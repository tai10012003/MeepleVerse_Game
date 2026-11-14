import { expect, test } from "@playwright/test";

test("home discovers two UNO editions and only basic opens a room entry", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Chọn một game. Mở cả vũ trụ vui." })).toBeVisible();
  await expect(page.locator(".catalog-game")).toHaveCount(2);
  await expect(page.locator('[data-game-id="uno-basic"]')).toContainText("Đang mở bàn");
  const expanded = page.locator('[data-game-id="uno-expanded"]');
  await expect(expanded).toContainText("Đang phát triển");
  await expect(page.getByRole("button", { name: "Tạo phòng UNO" })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("meepleverse-home-desktop.png"), fullPage: true });
  await expanded.getByRole("link", { name: "Xem giới thiệu" }).click();
  await expect(page).toHaveURL(/\/games\/uno-expanded$/);
  await expect(page.getByRole("heading", { name: "UNO Mở rộng", exact: true })).toBeVisible();
  await expect(page.getByText("Đang phát triển", { exact: true })).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Tạo phòng|Vào phòng/ })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("uno-expanded-preview.png"), fullPage: true });
  await page.getByRole("link", { name: "Chơi UNO Cơ bản" }).click();
  await expect(page).toHaveURL(/\/games\/uno-basic$/);
  await expect(page.getByRole("heading", { name: "UNO Cơ bản", exact: true })).toBeVisible();
  await expect(page.getByLabel("Mọi người gọi bạn là gì?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo phòng UNO" })).toBeEnabled();
  expect(errors).toEqual([]);
});

test("mobile universe, catalog and expanded preview fit without horizontal overflow", async ({ page }, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ["/", "/games", "/games/uno-expanded", "/games/uno-basic"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
    await page.screenshot({ path: info.outputPath(path === "/" ? "meepleverse-home-mobile.png" : path.replaceAll("/", "-") + ".png"), fullPage: true });
  }
  await page.goto("/");
  await page.getByRole("link", { name: "Có mã phòng? Vào đây" }).click();
  await expect(page).toHaveURL(/\/games\/uno-basic#play$/);
  await page.getByRole("button", { name: "Vào bằng mã", exact: true }).click();
  await expect(page.getByLabel("Mã phòng", { exact: true })).toBeVisible();
});

test("catalog navigation works and an unknown game returns 404", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Khám phá game" }).click();
  await expect(page).toHaveURL(/\/games$/);
  await page.getByRole("link", { name: "Chơi ngay", exact: true }).click();
  await expect(page).toHaveURL(/\/games\/uno-basic#play$/);
  await expect(page.getByRole("region", { name: "Tạo hoặc vào phòng" })).toBeVisible();
  const response = await page.goto("/games/not-a-game");
  expect(response?.status()).toBe(404);
});

test("a player can return to the same room through the universe home", async ({ page }) => {
  await page.goto("/games/uno-basic");
  await page.getByLabel("Mọi người gọi bạn là gì?").fill("Tai");
  await page.getByRole("button", { name: "Tạo phòng UNO" }).click();
  await expect(page).toHaveURL(/\/room\/[A-Z0-9]{4}$/);
  const roomUrl = page.url();
  await page.getByRole("link", { name: "MeepleVerse — trang chủ" }).click();
  await expect(page).toHaveURL("http://localhost:3100/");
  await page.getByRole("link", { name: "Vào phòng", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Bạn đã có phòng." })).toBeVisible();
  await page.getByRole("link", { name: /Trở lại phòng/ }).click();
  await expect(page).toHaveURL(roomUrl);
  await expect(page.getByText("1/4 ghế", { exact: true })).toBeVisible();
});
