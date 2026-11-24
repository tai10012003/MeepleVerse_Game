import { expect, test } from "@playwright/test";
import { joinRoom } from "./helpers/expanded-room";
import { playExpandedCard, settledExpanded } from "./helpers/expanded-acceptance";

for (const scenario of ["tornado", "random-number", "random-function"]) {
  test(`public draws: ${scenario} reveals the actual cards to every client`, async ({ browser, request }) => {
    test.setTimeout(60000);
    expect((await request.post(`http://127.0.0.1:5101/scenario/expanded-accept-${scenario}`)).ok()).toBe(true);
    const group = await joinRoom(browser, 3);
    try {
      const { pages } = group;
      const before = await settledExpanded(pages, 202);
      await playExpandedCard(pages[0]!, before[0]!.cards.find(card => card.id === "activate")!, before[0]!.cards);
      const ids = scenario === "tornado" ? ["storm-first", "storm-wild", "storm-third", "storm-stop"] : ["random-reveal"];
      for (const [index, id] of ids.entries()) {
        await Promise.all(pages.map(async page => {
          const reveal = page.locator('[data-effect="public-reveal"]');
          await expect(reveal).toHaveAttribute("data-card-id", id);
          await expect(reveal).toHaveAttribute("data-public-index", String(index));
          await expect(reveal).toHaveCount(1);
          await expect(page.locator(`.expanded-hand-card[data-card-id="${id}"]`)).toHaveCount(0);
        }));
      }
      if (scenario === "random-number") {
        await Promise.all(pages.map(async page => {
          const extras = page.locator('[data-effect="draw"]');
          await expect(extras.first()).toBeVisible();
          for (const extra of await extras.all()) await expect(extra).toHaveAttribute("data-card-visibility", "back");
          await expect(extras.locator('.expanded-card-face')).toHaveCount(0);
          await expect(page.locator('[data-effect="public-reveal"]')).toHaveCount(0);
        }));
      }
      const after = await settledExpanded(pages, 202);
      const amount = scenario === "random-function" ? 1 : 4;
      expect(after[1]!.count).toBe(before[1]!.count + amount);
      expect(after[0]!.stock).toBe(before[0]!.stock - amount);
      expect(after[0]!.current).toBe(before[2]!.id);
      expect(after[0]!.debt).toBe(0);
      for (const id of ids) expect(after[1]!.cards.some(card => card.id === id)).toBe(true);
      expect(group.errors).toEqual([]);
    } finally { await group.close(); }
  });
}

test("public draws: reduced motion preserves sequential public information", async ({ browser, request }) => {
  test.setTimeout(60000);
  expect((await request.post("http://127.0.0.1:5101/scenario/expanded-accept-tornado")).ok()).toBe(true);
  const group = await joinRoom(browser, 2, { reducedMotion: "reduce" });
  try {
    const before = await settledExpanded(group.pages, 202);
    await playExpandedCard(group.pages[0]!, before[0]!.cards.find(card => card.id === "activate")!, before[0]!.cards);
    for (const id of ["storm-first", "storm-wild", "storm-third", "storm-stop"]) {
      await Promise.all(group.pages.map(async page => {
        const reveal = page.locator('[data-effect="public-reveal"]');
        await expect(reveal).toHaveAttribute("data-card-id", id);
        await expect(reveal.locator('.expanded-card-face')).toBeVisible();
        await expect(reveal.locator('.public-draw-flipper')).toHaveCount(0);
      }));
    }
    await settledExpanded(group.pages, 202);
    expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});

test("public draws: exhausted Tornado shows the final draw before ending", async ({ browser, request }) => {
  test.setTimeout(60000);
  expect((await request.post("http://127.0.0.1:5101/scenario/expanded-tornado-exhaust")).ok()).toBe(true);
  const group = await joinRoom(browser);
  try {
    const before = await settledExpanded(group.pages);
    await playExpandedCard(group.pages[0]!, before[0]!.cards.find(card => card.id === "storm")!, before[0]!.cards);
    for (const id of ["storm-blue", "storm-black", "old-wild"]) {
      await Promise.all(group.pages.map(page => expect(page.locator('[data-effect="public-reveal"]')).toHaveAttribute("data-card-id", id)));
    }
    await expect(group.pages[0]!.locator('[data-effect="public-caption"]')).toContainText("Hết bài bốc");
    const after = await settledExpanded(group.pages);
    expect(after[0]!.status).toBe("ENDED");
    expect(after[1]!.count).toBe(before[1]!.count + 3);
    for (const page of group.pages) await expect(page.locator('[data-effect="public-reveal"]')).toHaveCount(0);
    expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});

test("public draws: Random zero reveals one card and adds no extra draw", async ({ browser, request }) => {
  test.setTimeout(60000);
  expect((await request.post("http://127.0.0.1:5101/scenario/expanded-random-zero")).ok()).toBe(true);
  const group = await joinRoom(browser);
  try {
    const before = await settledExpanded(group.pages);
    await playExpandedCard(group.pages[0]!, before[0]!.cards.find(card => card.id === "random")!, before[0]!.cards);
    await Promise.all(group.pages.map(async page => {
      await expect(page.locator('[data-effect="public-reveal"]')).toHaveAttribute("data-card-id", "random-zero");
      await expect(page.locator('[data-effect="public-caption"]')).toContainText("Bốc thêm 0 lá úp");
    }));
    const after = await settledExpanded(group.pages);
    expect(after[1]!.count).toBe(before[1]!.count + 1);
    expect(after[0]!.debt).toBe(0);
    expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});


test("public draws: resize cancels safely and reload does not replay public faces", async ({ browser, request }, info) => {
  test.setTimeout(60000);
  expect((await request.post("http://127.0.0.1:5101/scenario/expanded-accept-tornado")).ok()).toBe(true);
  const group = await joinRoom(browser);
  try {
    const before = await settledExpanded(group.pages, 202);
    await playExpandedCard(group.pages[0]!, before[0]!.cards.find(card => card.id === "activate")!, before[0]!.cards);
    const page = group.pages[1]!;
    await expect(page.locator('[data-effect="public-reveal"]')).toHaveAttribute("data-card-id", "storm-first");
    await expect.poll(() => page.locator('.public-draw-flipper').evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m11), { intervals: [20, 40] }).toBeLessThan(-.95);
    await page.screenshot({ path: info.outputPath("public-reveal-mobile.png") });
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-effect="public-reveal"]')).toHaveCount(0);
    await settledExpanded(group.pages, 202);
    await page.reload();
    await expect(page.getByTestId('expanded-board')).toBeVisible();
    await expect(page.locator('[data-effect="public-reveal"]')).toHaveCount(0);
    expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});
