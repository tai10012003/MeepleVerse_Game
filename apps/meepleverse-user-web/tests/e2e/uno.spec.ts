import { expect, test, type Page, type Browser, type BrowserContext } from "@playwright/test";
test.beforeEach(async ({ request }) => { await request.post("http://127.0.0.1:5101/scenario/normal"); });
test.afterEach(async ({ request }) => { await request.post("http://127.0.0.1:5101/scenario/normal"); });
async function party(page: Page, browser: Browser, count = 2) {
  await page.goto("/");
  await page.getByLabel("Mọi người gọi bạn là gì?").fill("Tai");
  await page.getByRole("button", { name: "Tạo phòng UNO" }).click();
  await expect(page).toHaveURL(/\/room\/[A-Z0-9]{4}$/);
  const contexts: BrowserContext[] = [];
  const pages = [page];
  for (let i = 1; i < count; i++) {
    const context = await browser.newContext(); contexts.push(context);
    const guest = await context.newPage(); pages.push(guest);
    await guest.goto(page.url());
    await guest.getByLabel("Mọi người gọi bạn là gì?").fill(["Tai", "Linh", "Mai", "Lan"][i]!);
    await guest.getByRole("button", { name: "Vào phòng", exact: true }).click();
    await expect(page.getByText(["Tai", "Linh", "Mai", "Lan"][i]!, { exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "Bắt đầu ván", exact: true }).click();
  for (const guest of pages) await expect(guest.getByTestId("uno-board")).toBeVisible();
  return { pages, close: async () => { await Promise.all(contexts.map(context => context.close())); } };
}
async function play(page: Page, id?: string) {
  await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
  const uno = page.getByRole("button", { name: "Hô UNO", exact: true });
  if (await uno.getAttribute("aria-disabled") === "false") await uno.click();
  const chosen = id ? page.locator('[data-card-id="' + id + '"]') : page.locator(".uno-hand-card:not(:disabled)").first();
  const kind = await chosen.getAttribute("data-card-kind");
  await chosen.click();
  await page.getByRole("button", { name: "Đánh lá bài", exact: true }).click();
  if (kind === "wild" || kind === "wild-draw-four") {
    await expect(page.getByRole("dialog", { name: "Đổi sang màu nào?" })).toBeVisible();
    await page.getByRole("button", { name: "Đỏ", exact: true }).click();
  }
}
test("two real browsers play a whole game and rematch", async ({ page, browser }, info) => {
  test.setTimeout(180000);
  const group = await party(page, browser);
  try {
    const [a, b] = group.pages as [Page, Page];
    const screen = a.getByTestId("uno-screen");
    const oldMatch = await screen.getAttribute("data-match-id");
    const opponent = await a.locator(".opponent-top").boundingBox();
    const pile = await a.locator(".draw-pile").boundingBox();
    expect(pile!.x + pile!.width).toBeLessThan(opponent!.x);
    await expect(a.locator(".pile-area .draw-pile")).toHaveCount(0);
    await a.screenshot({ path: info.outputPath("uno-desktop.png"), fullPage: true });
    let steps = 0;
    while (await screen.getAttribute("data-status") === "PLAYING" && steps++ < 700) {
      const actor = await a.getByTestId("uno-board").getAttribute("data-my-turn") === "true" ? a : b;
      await expect(actor.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
      await expect(actor.locator(".turn-message")).not.toHaveText("Đang chờ xác nhận…");
      const board = actor.getByTestId("uno-board");
      const phase = await board.getAttribute("data-phase");
      const revision = Number(await actor.getByTestId("uno-screen").getAttribute("data-revision"));
      if (phase === "choose-color") await actor.getByRole("button", { name: "Đỏ", exact: true }).click();
      else if (phase === "draw-four") await actor.getByRole("button", { name: "Chấp nhận +4" }).click();
      else if (await actor.locator(".uno-hand-card:not(:disabled)").count()) await play(actor);
      else await actor.getByRole("button", { name: phase === "drawn" ? "Bỏ lượt" : "Bốc bài", exact: true }).click();
      for (const client of group.pages) await expect(client.getByTestId("uno-screen")).toHaveAttribute("data-revision", String(revision + 1));
      await expect(actor.locator(".board-error")).toHaveCount(0);
    }
    expect(steps).toBeLessThan(700);
    await expect(screen).toHaveAttribute("data-status", "ENDED");
    await expect(a.getByRole("region", { name: "Kết quả ván" })).toBeVisible();
    await expect(b.getByRole("region", { name: "Kết quả ván" })).toBeVisible();
    await a.screenshot({ path: info.outputPath("uno-results.png"), fullPage: true });
    await a.getByRole("button", { name: "Chơi ván mới" }).click();
    await expect(a.getByTestId("uno-board")).toBeVisible();
    await expect(screen).not.toHaveAttribute("data-match-id", oldMatch!);
    await expect(a.locator(".uno-hand-card")).toHaveCount(7);
  } finally { await group.close(); }
});
test("drawn-card-only restriction, pass, and reload preserve the real hand", async ({ page, browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/draw");
  const group = await party(page, browser);
  try {
    await page.getByRole("button", { name: "Bốc bài", exact: true }).click();
    await expect(page.getByTestId("uno-board")).toHaveAttribute("data-phase", "drawn");
    await expect(page.locator('[data-card-id="old-red"]')).toBeDisabled();
    await expect(page.locator('[data-card-id="draw-red"]')).toBeEnabled();
    await expect(page.locator('[data-card-id="draw-red"]')).toHaveClass(/is-suggested/);
    await expect(page.locator('[data-card-id="old-red"]')).toHaveClass(/is-blocked/);
    const before = await page.locator(".uno-hand-card").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-card-id")));
    await page.reload();
    await expect(page.getByTestId("uno-board")).toHaveAttribute("data-phase", "drawn");
    expect(await page.locator(".uno-hand-card").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-card-id")))).toEqual(before);
    await page.getByRole("button", { name: "Bỏ lượt", exact: true }).click();
    await expect(group.pages[1]!.getByTestId("uno-board")).toHaveAttribute("data-my-turn", "true");
    await expect(page.getByRole("button", { name: "Bốc bài", exact: true })).toBeDisabled();
  } finally { await group.close(); }
});
test("Wild color picker can cancel, challenge evidence is private and persists", async ({ page, browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/challenge");
  const group = await party(page, browser, 3);
  try {
    await page.getByRole("button", { name: "Hô UNO", exact: true }).click();
    await page.locator('[data-card-id="four"]').click();
    await page.getByRole("button", { name: "Đánh lá bài", exact: true }).click();
    await page.getByRole("button", { name: "Chọn lá khác" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator('[data-card-id="four"]')).toBeVisible();
    await page.getByRole("button", { name: "Đánh lá bài", exact: true }).click();
    await page.getByRole("button", { name: "Xanh lá", exact: true }).click();
    const challenger = group.pages[1]!;
    await challenger.getByRole("button", { name: "Thách thức +4", exact: true }).click();
    const evidence = challenger.getByRole("complementary", { name: "Bằng chứng thách thức +4" });
    await expect(evidence).toBeVisible();
    await expect(evidence.getByText("Đỏ 7", { exact: true })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Bằng chứng thách thức +4" })).toHaveCount(0);
    await expect(group.pages[2]!.getByRole("complementary", { name: "Bằng chứng thách thức +4" })).toHaveCount(0);
    await play(challenger, "green");
    await expect(evidence).toBeVisible();
    await evidence.getByRole("button", { name: "Đóng" }).click();
    await expect(evidence).toHaveCount(0);
  } finally { await group.close(); }
});
test("UNO button arms one play, stays visible and gives no automatic declaration", async ({ page, browser, request }, info) => {
  await request.post("http://127.0.0.1:5101/scenario/uno");
  const group = await party(page, browser);
  try {
    const uno = page.getByRole("button", { name: "Hô UNO", exact: true });
    await expect(uno).toHaveClass(/is-ready/);
    await expect(uno).toHaveAttribute("aria-pressed", "false");
    await expect(uno).toHaveCSS("opacity", "1");
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    await uno.click();
    await expect(uno).toHaveAttribute("aria-pressed", "true");
    await page.screenshot({ path: info.outputPath("uno-armed.png") });
    await play(page, "play-red");
    await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    await expect(page.getByTestId("my-hand-count")).toHaveText("1 lá");
    await expect(uno).toHaveAttribute("aria-pressed", "false");
    await expect(uno).not.toHaveClass(/is-ready/);
    await expect(uno).toBeVisible();
    await expect(uno).toHaveCSS("opacity", "1");
    await expect(group.pages[1]!.getByRole("button", { name: /Bắt quên UNO/ })).toHaveCount(0);
  } finally { await group.close(); }
});

test("forgetting UNO automatically draws two without any opponent action", async ({ page, browser, request }, info) => {
  await request.post("http://127.0.0.1:5101/scenario/uno");
  const group = await party(page, browser);
  try {
    await page.locator('[data-card-id="play-red"]').click();
    await page.getByRole("button", { name: "Đánh lá bài", exact: true }).click();
    await expect(page.locator('.draw-reveal-caption')).toContainText("Quên hô UNO");
    await expect(page.locator('[data-effect="draw"][data-card-visibility="self"]')).toHaveCount(2);
    await page.screenshot({ path: info.outputPath("uno-auto-penalty.png") });
    await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    await expect(page.getByTestId("my-hand-count")).toHaveText("3 lá");
    await expect(group.pages[1]!.getByTestId("uno-board")).toHaveAttribute("data-my-turn", "true");
    for (const client of group.pages) await expect(client.getByRole("button", { name: /Bắt quên UNO|Hô UNO!/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Hô UNO", exact: true })).toHaveCSS("opacity", "1");
    await page.reload();
    await expect(page.getByTestId("my-hand-count")).toHaveText("3 lá");
    await expect(page.getByRole("button", { name: "Hô UNO", exact: true })).toHaveAttribute("aria-pressed", "false");
  } finally { await group.close(); }
});

test("four-player mobile table fits and controls pause while another player reloads", async ({ page, browser }, info) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const group = await party(page, browser, 4);
  try {
    await expect(page.locator(".opponent")).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await page.screenshot({ path: info.outputPath("uno-mobile.png"), fullPage: true });
    const guest = group.pages[1]!;
    const url = guest.url();
    await guest.goto("about:blank");
    await expect(page.locator(".turn-message")).toContainText("Tạm dừng");
    await expect(page.locator(".uno-hand-card:not(:disabled)")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Bốc bài", exact: true })).toBeDisabled();
    await guest.goto(url);
    await expect(guest.getByTestId("uno-board")).toBeVisible();
    await expect(page.locator(".turn-message")).not.toContainText("Tạm dừng");
    await page.setViewportSize({ width: 812, height: 375 });
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    const box = await page.getByRole("button", { name: "Đánh lá bài", exact: true }).boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(375);
    await page.screenshot({ path: info.outputPath("uno-landscape.png"), fullPage: true });
  } finally { await group.close(); }
});
