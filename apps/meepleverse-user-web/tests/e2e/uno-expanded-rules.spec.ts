import { expect, test, type Page } from "@playwright/test";
import { expandedSnapshot, playExpandedCard } from "./helpers/expanded-acceptance";
const label = "Luật chơi UNO Mở rộng";
const viewports = [{ name: "laptop", width: 1366, height: 768 }, { name: "mobile", width: 375, height: 812 }];
async function openGuide(page: Page) {
  const trigger = page.getByRole("button", { name: label, exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: label, exact: true });
  await expect(dialog).toBeVisible();
  return { trigger, dialog };
}
for (const viewport of viewports) {
  test(`expanded guide: ${viewport.name} introduction explains 15 active groups including Card Swap`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.locator('article[data-game-id="uno-expanded"]').getByRole("button", { name: label, exact: true }).click();
    await expect(page.getByRole("dialog", { name: label, exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.goto("/games/uno-expanded");
    await expect(page.getByText("Khác Cơ bản ở đâu?", { exact: true })).toBeVisible();
    await expect(page.locator("form")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Tạo phòng UNO Mở rộng", exact: true })).toBeEnabled();
    const { trigger, dialog } = await openGuide(page);
    await expect(dialog.getByRole("table")).toHaveAccessibleName("Thành phần bộ 202 lá");
    await expect(dialog.locator("[data-rule-group]")).toHaveCount(15);
    const preview = dialog.locator('[data-rule-group="15"]');
    await expect(preview).toHaveAttribute("data-rule-status", "active");
    await expect(preview).toContainText("Card Swap · 4 lá");
    await expect(preview).toContainText("Nhận tay một lá không bị phạt UNO");
    await expect(preview).toContainText("bạn thắng ngay và không đổi bài");
    await expect(dialog).not.toContainText("Xem trước");
    await expect(preview).toContainText("người đánh chọn màu bất kỳ");
    await preview.scrollIntoViewIfNeeded();
    await expect(preview.locator("svg[data-card-kind=wild-card-swap]")).toBeVisible();
    await preview.screenshot({path:info.outputPath(`card-swap-${viewport.name}.png`)});
    if (viewport.name === "laptop") {
      const face = preview.locator('[data-card-preview="card-swap"]');
      await face.evaluate(element => element.setAttribute("style", "width:240px; position:fixed; left:20px; top:20px; z-index:10000"));
      await face.screenshot({path:info.outputPath("card-swap-artwork-large.png")});
      await face.evaluate(element => element.removeAttribute("style"));
    }
    await expect(dialog).toContainText("112 lá số thuần + 32 chức năng nền + 58 lá mở rộng = 202 lá");
    await expect(dialog).toContainText("không xóa phạt");
    await expect(dialog).toContainText("Không nhân tổng cộng dồn");
    await expect(dialog).toContainText("9 vẫn đáp được bằng 9");
    await expect(dialog).toContainText("kể cả người đánh lá");
    await expect(dialog).toContainText("không tạm dừng ván hay đồng hồ mini-game");
    const metrics = await dialog.evaluate(element => {
      const box = element.getBoundingClientRect();
      const texts = Array.from(element.querySelectorAll("p, li, h4, th, td, caption"));
      return { fits: box.x >= 0 && box.right <= innerWidth && box.y >= 0 && box.bottom <= innerHeight,
        overflows: element.scrollWidth > element.clientWidth,
        minFont: Math.min(...texts.map(text => parseFloat(getComputedStyle(text).fontSize))) };
    });
    expect(metrics).toEqual({ fits: true, overflows: false, minFont: 13 });
    await page.screenshot({ path: info.outputPath(`expanded-guide-${viewport.name}.png`) });
    await dialog.getByRole("link", { name: "Chức năng", exact: true }).click();
    await expect(dialog.getByRole("heading", { name: "3. Nhận diện chức năng", exact: true })).toBeInViewport();
    const body = dialog.getByLabel("Nội dung hướng dẫn luật chơi");
    await body.evaluate(element => { element.scrollTop = element.scrollHeight; });
    await expect(dialog.getByRole("button", { name: "Đóng hướng dẫn luật chơi" })).toBeInViewport();
    await page.screenshot({ path: info.outputPath(`expanded-guide-end-${viewport.name}.png`) });
    await dialog.getByRole("button", { name: "Đã hiểu, vào bàn thôi" }).click();
    await expect(trigger).toBeFocused();
    await trigger.click();
    expect(await body.evaluate(element => element.scrollTop)).toBe(0);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
  test(`expanded guide: ${viewport.name} lobby and live table retain room updates`, async ({ browser, request }, info) => {
    await request.post("http://127.0.0.1:5101/scenario/expanded-accept-rapid");
    const contexts = await Promise.all([browser.newContext({ viewport }), browser.newContext({ viewport })]);
    const [host, guest] = await Promise.all(contexts.map(context => context.newPage()));
    const errors: string[] = [];
    for (const page of [host!, guest!]) page.on("pageerror", error => errors.push(error.message));
    try {
      await host!.goto("/dev/uno-expanded/play");
      await openGuide(host!); await host!.keyboard.press("Escape");
      await host!.getByLabel("Mọi người gọi bạn là gì?").fill("Host");
      await host!.getByRole("button", { name: "Tạo phòng UNO Mở rộng", exact: true }).click();
      await expect(host!.getByTestId("expanded-lobby")).toBeVisible();
      const room = host!.url();
      const lobbyGuide = await openGuide(host!);
      await guest!.goto(room);
      await guest!.getByLabel("Mọi người gọi bạn là gì?").fill("Guest1");
      await guest!.getByRole("button", { name: "Vào phòng", exact: true }).click();
      await expect(host!.getByText("2/4 ghế", { exact: true })).toHaveText("2/4 ghế");
      await expect(lobbyGuide.dialog).toBeVisible();
      await lobbyGuide.dialog.getByRole("button", { name: "Đóng hướng dẫn luật chơi" }).click();
      await host!.getByRole("button", { name: "Bắt đầu ván", exact: true }).click();
      await expect(guest!.getByTestId("expanded-board")).toBeVisible();
      const before = await expandedSnapshot(guest!);
      const liveGuide = await openGuide(guest!);
      const hand = (await expandedSnapshot(host!)).cards;
      await playExpandedCard(host!, hand.find(card => card.id === "activate")!, hand);
      await expect(guest!.getByTestId("expanded-screen")).toHaveAttribute("data-revision", "1");
      await expect(liveGuide.dialog).toBeVisible();
      await guest!.screenshot({ path: info.outputPath(`expanded-guide-live-${viewport.name}.png`) });
      await guest!.keyboard.press("Escape");
      await expect(liveGuide.trigger).toBeFocused();
      await expect(guest!.getByTestId("expanded-screen")).toHaveAttribute("data-animating", "false");
      const after = await expandedSnapshot(guest!);
      expect(after.match).toBe(before.match);
      expect(after.cards.map(card => card.id)).toEqual(before.cards.map(card => card.id));
      expect(after.current).toBe(before.id);
      await expect(guest!.getByRole("button", { name: "Bốc bài", exact: true })).toBeEnabled();
      expect(guest!.url()).toBe(room);
      expect(await guest!.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]);
    } finally { await Promise.all(contexts.map(context => context.close())); }
  });
}
