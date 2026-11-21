import { expect, type Browser, type Page } from "@playwright/test";
export async function joinRoom(browser: Browser, count = 2) {
  const contexts = await Promise.all(Array.from({ length: count }, (_, index) => browser.newContext({ viewport: index === 0 ? { width: 1366, height: 900 } : { width: 375, height: 812 } })));
  const pages = await Promise.all(contexts.map(context => context.newPage())); const errors: string[] = [];
  pages.forEach(page => page.on("pageerror", error => errors.push(error.message)));
  try {
    await pages[0]!.goto("/dev/uno-expanded/play"); await pages[0]!.getByLabel("Mọi người gọi bạn là gì?").fill("Host");
    await pages[0]!.getByRole("button", { name: "Tạo phòng UNO Mở rộng", exact: true }).click(); await expect(pages[0]!).toHaveURL(/\/room\/[A-Z0-9]{4}$/);
    for (let i = 1; i < count; i++) { await pages[i]!.goto(pages[0]!.url()); await pages[i]!.getByLabel("Mọi người gọi bạn là gì?").fill(`Guest${i}`); await pages[i]!.getByRole("button", { name: "Vào phòng", exact: true }).click(); await expect(pages[i]!.getByTestId("expanded-lobby")).toBeVisible(); }
    await expect(pages[0]!.getByText(`${count}/4 ghế`, { exact: true })).toBeVisible();
    await expect(pages[1]!.getByRole("button", { name: "Chờ chủ phòng bắt đầu" })).toBeDisabled();
    await pages[0]!.getByRole("button", { name: "Bắt đầu ván", exact: true }).click();
    for (const page of pages) await expect(page.getByTestId("expanded-screen")).toBeVisible();
    return { pages, errors, close: async () => { await Promise.all(contexts.map(context => context.close())); } };
  } catch (error) { await Promise.all(contexts.map(context => context.close())); throw error; }
}
export async function play(page: Page, id: string) {
  await page.locator(`.expanded-hand-card[data-card-id="${id}"]`).click(); await page.getByRole("button", { name: "Đánh lá bài", exact: true }).click();
}
export async function confirmColor(page: Page, name: string) { const dialog = page.getByRole("dialog"); await dialog.getByRole("button", { name, exact: true }).click(); await dialog.getByRole("button", { name: "Xác nhận" }).click(); await expect(dialog).toHaveCount(0); }
export async function nextRevision(page: Page, revision: number) { await expect(page.getByTestId("expanded-screen")).toHaveAttribute("data-revision", String(revision)); }
