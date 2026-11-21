import { chooseAndConfirmColor } from "./helpers/color-picker";
import { expect, test, type Page } from "@playwright/test";
const colors = { red: "Đỏ", yellow: "Vàng", green: "Xanh lá", blue: "Xanh dương" };
async function snapshot(page: Page) {
  return page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-testid="uno-screen"]')!;
    return {
      id: root.dataset.selfPlayerId!, revision: Number(root.dataset.revision), match: root.dataset.matchId,
      status: root.dataset.status, phase: document.querySelector<HTMLElement>('[data-testid="uno-board"]')?.dataset.phase,
      hand: Array.from(document.querySelectorAll<HTMLElement>('.uno-hand-card')).map(card => card.dataset.cardId!),
      opponents: Array.from(document.querySelectorAll<HTMLElement>('.opponent')).map(player => ({ id: player.dataset.playerId!, count: Number(player.querySelector('.opponent-count')?.textContent) })),
      color: document.querySelector('.direction-ring')?.getAttribute('data-color'),
      direction: document.querySelector('.direction-label')?.textContent,
      top: Array.from(document.querySelectorAll<HTMLElement>('[data-discard-card-id]')).at(-1)?.dataset.discardCardId,
      stock: document.querySelector('.draw-dock small')?.textContent,
      debt: document.querySelector('[data-testid="draw-debt"]')?.textContent ?? '',
      debtTarget: document.querySelector('[data-testid="draw-debt"]')?.getAttribute('data-player-id') ?? '',
    };
  });
}
async function synchronized(pages: Page[]) {
  for (const client of pages) await expect(client.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
  const views = await Promise.all(pages.map(snapshot));
  for (const view of views) {
    expect(view.revision).toBe(views[0]!.revision); expect(view.match).toBe(views[0]!.match); expect(view.status).toBe(views[0]!.status);
    if (view.status !== "PLAYING") continue;
    for (const field of ["phase", "color", "direction", "top", "stock", "debt", "debtTarget"] as const) expect(view[field], field).toBe(views[0]![field]);
    expect(view.opponents).toHaveLength(3);
    for (const other of views.filter(other => other.id !== view.id)) expect(view.opponents.find(player => player.id === other.id)?.count).toBe(other.hand.length);
  }
  if (views[0]!.status === "PLAYING") {
    const cards = views.flatMap(view => view.hand);
    expect(new Set(cards).size).toBe(cards.length);
  }
  return views;
}

test("four independent browsers finish a full 108-card game, keep synchronized after every move, reconnect and rematch", async ({ browser, request }, info) => {
  test.setTimeout(600000);
  await request.post("http://127.0.0.1:5101/scenario/normal");
  const contexts = await Promise.all([{ width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 768, height: 1024 }, { width: 375, height: 812 }].map(viewport => browser.newContext({ viewport, reducedMotion: "reduce" })));
  const errors: string[] = [];
  const pages = await Promise.all(contexts.map(async context => { const page = await context.newPage(); page.on("pageerror", error => errors.push(error.message)); return page; }));
  const actions: Record<string, number> = {};
  let steps = 0;
  let reconnects = 0;
  try {
    const host = pages[0]!;
    await host.goto("/games/uno-basic"); await host.getByLabel("Mọi người gọi bạn là gì?").fill("Tai");
    await host.getByRole("button", { name: "Tạo phòng UNO" }).click();
    await expect(host).toHaveURL(/\/room\/[A-Z0-9]{4}$/);
    for (let i = 1; i < pages.length; i++) {
      const page = pages[i]!; await page.goto(host.url());
      await page.getByLabel("Mọi người gọi bạn là gì?").fill(["Tai", "Linh", "Mai", "Lan"][i]!);
      await page.getByRole("button", { name: "Vào phòng", exact: true }).click();
    }
    await expect(host.getByText("4/4 ghế", { exact: true })).toBeVisible();
    await host.getByRole("button", { name: "Bắt đầu ván", exact: true }).click();
    for (const page of pages) await expect(page.getByTestId("uno-board")).toBeVisible();
    const first = await synchronized(pages);
    for (const view of first) expect(view.hand).toHaveLength(7);
    const match = first[0]!.match;
    while (await host.getByTestId("uno-screen").getAttribute("data-status") === "PLAYING" && steps < 350) {
      const turns = await Promise.all(pages.map(page => page.getByTestId("uno-board").getAttribute("data-my-turn")));
      expect(turns.filter(turn => turn === "true")).toHaveLength(1);
      const actor = pages[turns.indexOf("true")]!;
      if (steps === 4) {
        const before = await snapshot(actor);
        await actor.reload(); await expect(actor.getByTestId("uno-board")).toBeVisible();
        const after = await snapshot(actor);
        expect(after.id).toBe(before.id); expect(after.hand).toEqual(before.hand); expect(after.revision).toBe(before.revision); expect(after.match).toBe(before.match);
        for (const page of pages) await expect(page.locator('.turn-message')).not.toContainText("Tạm dừng");
        reconnects++;
      }
      const revision = Number(await actor.getByTestId("uno-screen").getAttribute("data-revision"));
      const phase = await actor.getByTestId("uno-board").getAttribute("data-phase");
      let action: string;
      if (phase === "penalty-color" || phase === "choose-color") {
        action = "choose-color";
        await chooseAndConfirmColor(actor, "Đỏ");
      } else {
        const legal = actor.locator('.uno-hand-card:not(:disabled)');
        if (await legal.count()) {
          const uno = actor.getByRole("button", { name: "Hô UNO", exact: true });
          if (await uno.getAttribute("aria-disabled") === "false") await uno.click();
          const card = legal.first(); action = "play:" + await card.getAttribute("data-card-kind");
          await card.click(); await actor.getByRole("button", { name: "Đánh lá bài", exact: true }).click();
          if (action === "play:wild") await chooseAndConfirmColor(actor, colors.red);
        } else {
          action = phase === "draw-stack" ? "accept-debt" : phase === "drawn" ? "pass" : "draw";
          await actor.getByRole("button", { name: phase === "draw-stack" ? /^Nhận \d+ lá$/ : phase === "drawn" ? "Bỏ lượt" : "Bốc bài", exact: true }).click();
        }
      }
      actions[action] = (actions[action] ?? 0) + 1; steps++;
      for (const page of pages) await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-revision", String(revision + 1));
      await synchronized(pages);
      for (const page of pages) await expect(page.locator('.board-error')).toHaveCount(0);
    }
    expect(steps).toBeLessThan(350);
    for (const page of pages) await expect(page.getByRole("region", { name: "Kết quả ván" })).toBeVisible();
    const scores = await Promise.all(pages.map(page => page.locator('.score-list').innerText()));
    expect(new Set(scores).size).toBe(1);
    const points = await Promise.all(pages.map(page => page.locator('.winner-score strong').innerText()));
    expect(new Set(points).size).toBe(1);
    const winners = await Promise.all(pages.map(page => page.getByRole("heading", { name: "Bạn thắng rồi!", exact: true }).count()));
    expect(winners.reduce((sum, count) => sum + count, 0)).toBe(1);
    await host.screenshot({ path: info.outputPath("four-player-result.png") });
    await host.getByRole("button", { name: "Chơi ván mới" }).click();
    for (const page of pages) { await expect(page.getByTestId("uno-board")).toBeVisible(); await expect(page.getByTestId("uno-screen")).not.toHaveAttribute("data-match-id", match!); }
    const next = await synchronized(pages);
    for (const view of next) { expect(view.hand).toHaveLength(7); expect(view.revision).toBe(0); }
    expect(errors).toEqual([]);
    await info.attach("four-player-game-summary", { body: JSON.stringify({ players: 4, steps, actions, reconnects, score: points[0], rematch: true, pageErrors: errors }, null, 2), contentType: "application/json" });
  } finally { await Promise.all(contexts.map(context => context.close())); }
});
