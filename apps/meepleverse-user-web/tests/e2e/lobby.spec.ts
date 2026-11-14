import { expect, test, type Page } from "@playwright/test";
async function create(page: Page, name = "Tai") {
  await page.goto("/");
  await page.getByLabel("Mọi người gọi bạn là gì?").fill(name);
  await page.getByRole("button", { name: "Tạo phòng UNO" }).click();
  await expect(page).toHaveURL(/\/room\/[A-Z0-9]{4}$/);
  await expect(page.getByRole("heading", { name: "Đợi bạn, đủ vui." })).toBeVisible();
}
test("two browsers join through an invite, copy it, then start together", async ({ page, browser }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await create(page);
  await expect(page.getByRole("button", { name: "Bắt đầu ván", exact: true })).toBeDisabled();
  const url = page.url();
  const other = await browser.newContext();
  try {
    const guest = await other.newPage();
    await guest.goto(url);
    await guest.getByLabel("Mọi người gọi bạn là gì?").fill("Linh");
    await guest.getByRole("button", { name: "Vào phòng", exact: true }).click();
    await expect(guest.getByRole("heading", { name: "Đợi bạn, đủ vui." })).toBeVisible();
    await expect(page.getByText("Linh", { exact: true })).toBeVisible();
    await expect(guest.getByText("Tai", { exact: true })).toBeVisible();
    await expect(guest.getByRole("button", { name: "Chờ chủ phòng bắt đầu" })).toBeDisabled();
    await page.getByRole("button", { name: "Sao chép link mời" }).click();
    await expect(page.getByRole("button", { name: /Đã sao chép link/ }).or(page.getByLabel("Link mời phòng"))).toBeVisible();
    if (await page.getByLabel("Link mời phòng").isVisible()) await expect(page.getByLabel("Link mời phòng")).toHaveValue(url);
    await page.screenshot({ path: info.outputPath("lobby-desktop.png"), fullPage: true });
    await page.getByRole("button", { name: "Bắt đầu ván", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ván chơi đã bắt đầu." })).toBeVisible();
    await expect(guest.getByRole("heading", { name: "Ván chơi đã bắt đầu." })).toBeVisible();
    expect(errors).toEqual([]);
  } finally { await other.close(); }
});
test("join by lowercase code, restore after reload, and transfer host after leaving", async ({ page, browser }) => {
  await create(page);
  const url = page.url();
  const code = url.split("/").at(-1)!;
  const hostName = page.getByText("Tai", { exact: true });
  await page.reload();
  await expect(hostName).toBeVisible();
  await expect(page.getByText("1/4 ghế", { exact: true })).toBeVisible();
  const other = await browser.newContext();
  try {
    const guest = await other.newPage();
    await guest.goto("/");
    await guest.getByRole("button", { name: "Vào bằng mã", exact: true }).click();
    await guest.getByLabel("Mọi người gọi bạn là gì?").fill("Mai");
    await guest.getByLabel("Mã phòng", { exact: true }).fill(code.toLowerCase());
    await guest.getByRole("button", { name: "Vào phòng", exact: true }).click();
    await expect(guest).toHaveURL(url);
    await expect(page.getByText("Mai", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Rời phòng/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Ở lại", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.getByRole("button", { name: /Rời phòng/ }).click();
    await page.getByRole("button", { name: "Xác nhận rời phòng" }).click();
    await expect(page).toHaveURL("http://localhost:3100/");
    await expect(guest.getByText("Chủ phòng", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("meepleverse.room-session.v1"))).toBeNull();
    await expect(guest.getByRole("button", { name: "Bắt đầu ván", exact: true })).toBeDisabled();
  } finally { await other.close(); }
});
test("a nonexistent room gives an error and allows another attempt", async ({ page }) => {
  await page.goto("/room/0000");
  await page.getByLabel("Mọi người gọi bạn là gì?").fill("Guest");
  await page.getByRole("button", { name: "Vào phòng", exact: true }).click();
  await expect(page.locator(".error-message[role=alert]")).toBeVisible();
  await expect(page.getByRole("button", { name: "Vào phòng", exact: true })).toBeEnabled();
});
test("mobile entry and lobby fit a narrow viewport", async ({ page }, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Vào bằng mã", exact: true }).click();
  await expect(page.getByLabel("Mã phòng", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tạo phòng", exact: true }).click();
  await page.screenshot({ path: info.outputPath("home-mobile.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await create(page, "Một cái tên hơi dài");
  await expect(page.getByRole("button", { name: "Sao chép link mời" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("lobby-mobile.png"), fullPage: true });
});
test("leaving during a started game warns and updates the other browser", async ({ page, browser }) => {
  await create(page);
  const other = await browser.newContext();
  try {
    const guest = await other.newPage();
    await guest.goto(page.url());
    await guest.getByLabel("Mọi người gọi bạn là gì?").fill("Lan");
    await guest.getByRole("button", { name: "Vào phòng", exact: true }).click();
    await expect(page.getByText("Lan", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Bắt đầu ván", exact: true }).click();
    await expect(guest.getByRole("heading", { name: "Ván chơi đã bắt đầu." })).toBeVisible();
    await guest.getByRole("button", { name: /Rời phòng/ }).click();
    await expect(guest.getByText("Rời phòng sẽ kết thúc ván hiện tại của nhóm.")).toBeVisible();
    await guest.getByRole("button", { name: "Xác nhận rời phòng" }).click();
    await expect(page.getByRole("region", { name: "Kết quả ván" })).toBeVisible();
  } finally { await other.close(); }
});
test("network failure is shown without getting stuck on submit", async ({ page }) => {
  await page.route("http://localhost:5100/matchmake/**", route => route.abort("failed"));
  await page.goto("/");
  await page.getByLabel("Mọi người gọi bạn là gì?").fill("Offline");
  await page.getByRole("button", { name: "Tạo phòng UNO" }).click();
  await expect(page.locator(".error-message[role=alert]")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo phòng UNO" })).toBeEnabled();
});
