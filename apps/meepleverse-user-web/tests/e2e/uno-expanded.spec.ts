import { expect, test } from "@playwright/test";
import { joinRoom, play, confirmColor, nextRevision } from "./helpers/expanded-room";

test("expanded 9A: internal lobby deals a real 198-card deck, keeps opponent faces private and restores on reload", async ({ browser, request }, info) => {
  await request.post("http://127.0.0.1:5101/scenario/normal"); const group = await joinRoom(browser, 4); const [a, b] = group.pages;
  try {
    for (const page of group.pages) { await expect(page.getByTestId("expanded-hand-count")).toHaveText("7 lá"); await expect(page.getByTestId("uno-screen")).toHaveCount(0); await expect(page.locator(".expanded-opponents .expanded-card-face")).toHaveCount(0); await expect(page.locator(".expanded-draw small")).toHaveText("169 lá bốc"); }
    const matchId = await a!.getByTestId("expanded-screen").getAttribute("data-match-id");
    const turnText = await a!.getByRole("status").textContent();
    const ids = await a!.locator(".expanded-hand-card").evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.cardId));
    await a!.reload(); await expect(a!.getByTestId("expanded-screen")).toHaveAttribute("data-match-id", matchId!);
    await expect(a!.getByTestId("expanded-hand-count")).toHaveText("7 lá"); await expect(a!.getByRole("status")).toHaveText(turnText!);
    expect(await a!.locator(".expanded-hand-card").evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.cardId))).toEqual(ids);
    expect(await b!.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await b!.screenshot({ path: info.outputPath("expanded-mobile.png") }); expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});
test("expanded 9A: draw allows only the drawn card and reload clears a stale selection", async ({ browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/expanded-draw"); const group = await joinRoom(browser); const a = group.pages[0]!;
  try {
    await a.getByRole("button", { name: "Bốc bài", exact: true }).click(); await nextRevision(a, 1);
    await expect(a.getByTestId("expanded-board")).toHaveAttribute("data-phase", "drawn");
    await expect(a.locator('[data-card-id="old-red"]')).toBeDisabled(); await expect(a.locator('[data-card-id="draw-red"]')).toBeEnabled();
    await a.locator('[data-card-id="draw-red"]').click(); await a.reload(); await expect(a.getByRole("button", { name: "Đánh lá bài", exact: true })).toBeDisabled();
    await play(a, "draw-red"); await nextRevision(a, 2); await expect(a.getByTestId("expanded-hand-count")).toHaveText("2 lá");
    expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});
test("expanded 9A: Shield transfers debt, blocks direct +2 and +4 author selects color before acceptance", async ({ browser, request }, info) => {
  await request.post("http://127.0.0.1:5101/scenario/expanded-stack"); const group = await joinRoom(browser); const [a, b] = group.pages;
  try {
    await play(a!, "two"); await nextRevision(b!, 1); await expect(b!.getByRole("button", { name: "Nhận 2 lá", exact: true })).toBeEnabled();
    await play(b!, "shield"); await confirmColor(b!, "Xanh lá"); await nextRevision(a!, 2);
    await expect(a!.locator('[data-card-id="two-held"]')).toBeDisabled(); await expect(a!.locator('[data-card-id="four"]')).toBeEnabled();
    await play(a!, "four"); await confirmColor(a!, "Xanh dương"); await nextRevision(b!, 3);
    for (const page of group.pages) await expect(page.getByTestId("direction-ring")).toHaveAttribute("data-color", "blue");
    await b!.screenshot({ path: info.outputPath("expanded-shield-debt.png") });
    await b!.getByRole("button", { name: "Nhận 6 lá", exact: true }).click(); await nextRevision(a!, 4);
    await expect(b!.getByTestId("expanded-hand-count")).toHaveText("8 lá"); await expect(a!.getByRole("button", { name: "Bốc bài", exact: true })).toBeEnabled(); expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});
test("expanded 9A: target +4 commits color and a non-adjacent target atomically, with explicit UNO", async ({ browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/expanded-target"); const group = await joinRoom(browser, 3); const [a, b, c] = group.pages;
  try {
    await a!.getByRole("button", { name: "Hô UNO", exact: true }).click(); await play(a!, "target");
    let dialog = a!.getByRole("dialog"); await dialog.getByRole("button", { name: "Vàng", exact: true }).click(); await expect(dialog.getByRole("button", { name: "Xác nhận đánh bài" })).toBeDisabled();
    await dialog.getByRole("button", { name: "Chọn lá khác" }).click(); await nextRevision(a!, 0);
    await expect(a!.getByRole("button", { name: "Hô UNO", exact: true })).toHaveAttribute("aria-pressed", "true");
    await a!.getByRole("button", { name: "Đánh lá bài", exact: true }).click(); dialog = a!.getByRole("dialog");
    await dialog.getByRole("button", { name: "Guest2", exact: true }).click(); await dialog.getByRole("button", { name: "Xác nhận đánh bài" }).click();
    await nextRevision(c!, 1); await expect(a!.getByTestId("expanded-hand-count")).toHaveText("1 lá");
    await expect(b!.getByRole("button", { name: "Nhận 4 lá", exact: true })).toBeDisabled();
    await c!.getByRole("button", { name: "Nhận 4 lá", exact: true }).click(); await nextRevision(a!, 2);
    await expect(c!.getByTestId("expanded-hand-count")).toHaveText("6 lá"); await expect(a!.getByTestId("direction-ring")).toHaveAttribute("data-color", "yellow");
    await expect(a!.getByRole("button", { name: "Bốc bài", exact: true })).toBeEnabled(); expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});
for (const declareUno of [true, false]) test(`expanded 9A: divide selection is exact, private and UNO is explicit (${declareUno})`, async ({ browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/expanded-divide"); const group = await joinRoom(browser); const [a, b] = group.pages;
  try {
    await play(a!, "divide");
    if (declareUno) { await a!.getByRole("dialog").getByRole("button", { name: "Xanh lá", exact: true }).click(); await a!.reload(); await expect(a!.getByTestId("expanded-board")).toBeVisible(); await expect(a!.getByRole("dialog")).toHaveCount(0); await expect(a!.getByRole("button", { name: "Hô UNO", exact: true })).toHaveAttribute("aria-pressed", "false"); await play(a!, "divide"); }
    const dialog = a!.getByRole("dialog"); await dialog.getByRole("button", { name: "Xanh lá", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Xác nhận đánh bài" })).toBeDisabled(); await dialog.locator('[data-choice-card-id="return-blue"]').click();
    await expect(dialog.locator('[data-choice-card-id="keep-red"]')).toBeDisabled();
    if (declareUno) await dialog.getByRole("button", { name: "Hô UNO", exact: true }).click();
    await dialog.getByRole("button", { name: "Xác nhận đánh bài" }).click(); await nextRevision(b!, 1);
    await expect(a!.getByTestId("expanded-hand-count")).toHaveText(`${declareUno ? 1 : 3} lá`);
    await expect(b!.locator('[data-card-id="return-blue"]')).toHaveCount(0); await expect(a!.locator('[data-card-id="b-green"]')).toHaveCount(0);
    await expect(a!.getByTestId("direction-ring")).toHaveAttribute("data-color", "green"); expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});
test("expanded 9A: color discard finishes and host rematches with a new match ID", async ({ browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/expanded-discard"); const group = await joinRoom(browser); const [a, b] = group.pages;
  try {
    const matchId = await a!.getByTestId("expanded-screen").getAttribute("data-match-id"); await play(a!, "discard");
    await expect(a!.getByRole("heading", { name: "Bạn thắng rồi!" })).toBeVisible(); await expect(b!.getByRole("region", { name: "Kết quả ván" })).toBeVisible();
    await a!.getByRole("button", { name: "Chơi ván mới" }).click(); await expect(a!.getByTestId("expanded-board")).toBeVisible();
    await expect(a!.getByTestId("expanded-screen")).not.toHaveAttribute("data-match-id", matchId!); await expect(a!.getByTestId("expanded-hand-count")).toHaveText("2 lá"); expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});

test("expanded 9A: an older Basic-only API explains how to enable Expanded instead of reporting a missing room", async ({ page }) => {
  await page.route("**/matchmake/create/uno-expanded", route => route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ code: 520, error: 'provided room name "uno-expanded" not defined' }) }));
  await page.goto("/dev/uno-expanded/play");
  await page.getByLabel("Mọi người gọi bạn là gì?").fill("Host");
  await page.getByRole("button", { name: "Tạo phòng UNO Mở rộng", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "API đang chạy chưa bật UNO Mở rộng" })).toHaveText("API đang chạy chưa bật UNO Mở rộng. Dừng API rồi chạy lại npm run dev:api.");
  await expect(page.getByRole("button", { name: "Tạo phòng UNO Mở rộng", exact: true })).toBeEnabled();
});
