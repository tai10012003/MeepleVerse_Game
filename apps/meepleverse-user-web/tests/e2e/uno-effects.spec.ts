import { expect, test, type Page, type Browser, type BrowserContext } from "@playwright/test";
async function setup(page: Page, browser: Browser, count = 2) {
  await page.goto("/games/uno-basic");
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
  return { pages, close: () => Promise.all(contexts.map(context => context.close())) };
}
async function play(page: Page, id: string, wild = false) {
  await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
  const uno = page.getByRole("button", { name: "Hô UNO", exact: true });
  if (await uno.getAttribute("aria-disabled") === "false") await uno.click();
  await page.locator('[data-card-id="' + id + '"]').click();
  await page.getByRole("button", { name: "Đánh lá bài", exact: true }).click();
  if (wild && await page.getByRole("dialog").count()) await page.getByRole("button", { name: "Xanh lá", exact: true }).click();
}
async function expectSlowDraw(pages: Page[], recipient: Page, count: number) {
  // Synchronize with the reveal before collecting assertions, rather than spending its dwell time on round trips.
  await expect(recipient.locator('[data-effect="draw"]')).toHaveCount(count);
  await expect.poll(() => recipient.locator('[data-effect="draw"]').first().evaluate(element => Number(getComputedStyle(element).opacity)), { intervals: [30, 50] }).toBeGreaterThan(.95);
  const check = async () => {
    for (const page of pages) {
      const state = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-effect="draw"]'));
        return {
          count:cards.length, durations:cards.map(card => card.dataset.drawDuration),
          faces:cards.filter(card => card.dataset.cardVisibility === "self").length,
          backs:cards.filter(card => card.dataset.cardVisibility === "back").length,
          sharedBacks:document.querySelectorAll('[data-effect="draw"] > .uno-card-back').length,
          deckBacks:document.querySelectorAll('.draw-pile > .uno-card-back').length,
          opponents:document.querySelectorAll('.opponent-card-back').length,
          opponentBacks:document.querySelectorAll('.opponent-card-back > .uno-card-back').length,
          captions:Array.from(document.querySelectorAll('.draw-reveal-caption')).map(element => element.textContent),
          animating:document.querySelector('[data-testid="uno-screen"]')?.getAttribute('data-animating'),
        };
      });
      expect(state.count).toBe(count); expect(state.durations).toEqual(Array(count).fill("1.85"));
      expect(state.faces).toBe(page === recipient ? count : 0);
      expect(state.backs).toBe(page === recipient ? 0 : count);
      expect(state.sharedBacks).toBe(page === recipient ? 0 : count);
      expect(state.deckBacks).toBe(1); expect(state.opponents).toBeGreaterThan(0);
      expect(state.opponentBacks).toBe(state.opponents); expect(state.animating).toBe("true");
      if (page === recipient) expect(state.captions.join(" ")).toContain(count === 1 ? "Vừa bốc" : "vừa bốc " + count + " lá");
      else expect(state.captions).toEqual([]);
    }
    await expect(recipient.locator(".uno-hand-card.is-new")).toHaveCount(0);
  };
  await check();
  await recipient.waitForTimeout(650);
  await check();
}

test.afterEach(async ({ request }) => { await request.post("http://127.0.0.1:5101/scenario/normal"); });
test("effects: number card flies, lands, announces the next player and never replays on reload", async ({ page, browser, request }, info) => {
  await request.post("http://127.0.0.1:5101/scenario/uno");
  const group = await setup(page, browser);
  try {
    await play(page, "play-red");
    await expect(page.locator('[data-discard-card-id="play-red"]')).toHaveCount(0);
    const actor = await page.getByTestId("uno-screen").getAttribute("data-self-player-id");
    await expect(group.pages[1]!.locator('[data-effect="badge"][data-player-id="' + actor + '"]')).toContainText("Tai đánh Đỏ 5");
    await expect(page.locator('[data-effect="play"]')).toHaveCount(1);
    const landingHeight = await page.locator('.discard-stack').evaluate(element => element.getBoundingClientRect().height);
    const flightHeight = await page.locator('[data-effect="play"]').evaluate(element => Number.parseFloat(getComputedStyle(element).height));
    expect(Math.abs(flightHeight - landingHeight)).toBeLessThan(1);
    await expect(group.pages[1]!.locator('[data-effect="play"]')).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Đánh lá bài", exact: true })).toBeDisabled();
    await expect(page.locator('[data-effect="impact"]')).toHaveCount(1);
    await expect(page.locator('[data-effect="turn"]')).toContainText("Linh");
    const notice = group.pages[1]!.locator('[data-effect="badge"][data-player-id="' + actor + '"]');
    const turnNotice = page.locator('[data-effect="turn"]');
    await expect.poll(() => notice.evaluate(element => Number(getComputedStyle(element).opacity)), { intervals: [25, 50], timeout: 6000 }).toBeGreaterThan(.99);
    await page.waitForTimeout(1200);
    await expect.poll(() => notice.evaluate(element => Number(getComputedStyle(element).opacity)), { timeout: 500 }).toBeGreaterThan(.95);
    await expect.poll(() => turnNotice.evaluate(element => Number(getComputedStyle(element).opacity)), { timeout: 500 }).toBeGreaterThan(.95);
    await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    await expect(page.locator(".discard-layer")).toHaveCount(2);
    await expect(page.locator('[data-discard-card-id="play-red"]')).toHaveCount(1);
    await page.reload();
    await expect(page.getByTestId("uno-board")).toBeVisible();
    await expect(page.locator('[data-effect="play"]')).toHaveCount(0);
    await expect(page.locator(".discard-layer")).toHaveCount(2);
    await page.screenshot({ path: info.outputPath("animation-board.png"), fullPage: true });
  } finally { await group.close(); }
});
test("effects: Skip lands on exactly the next opponent", async ({ page, browser, request }, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await request.post("http://127.0.0.1:5101/scenario/effect-skip");
  const group = await setup(page, browser, 3);
  try {
    const target = await group.pages[1]!.getByTestId("uno-screen").getAttribute("data-self-player-id");
    await play(page, "special");
    const badge = page.locator('[data-effect="badge"][data-symbol="⊘"]');
    await expect(badge).toHaveAttribute("data-player-id", target!);
    await expect.poll(() => badge.evaluate(element => Number(getComputedStyle(element).opacity)).catch(() => 0), { intervals: [16, 24, 32, 50], timeout: 3500 }).toBeGreaterThan(.7);
    const box = await badge.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    await page.screenshot({ path: info.outputPath("skip-effect.png"), fullPage: true });
    await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    await expect(group.pages[2]!.getByTestId("uno-board")).toHaveAttribute("data-my-turn", "true");
  } finally { await group.close(); }
});
test("effects: Draw Two sends two cards, shows their faces only to the recipient", async ({ page, browser, request }, info) => {
  await request.post("http://127.0.0.1:5101/scenario/effect-two");
  const group = await setup(page, browser);
  try {
    const recipient = group.pages[1]!;
    await play(page, "special");
    await expect(recipient.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    await recipient.getByRole("button", { name: "Nhận 2 lá", exact: true }).click();
    await expectSlowDraw(group.pages, recipient, 2);
    await expect(recipient.locator('[data-effect="draw"]')).toHaveCount(2);
    await expect(recipient.locator('[data-effect="draw"][data-card-visibility="self"]')).toHaveCount(2);
    await expect(page.locator('[data-effect="draw"][data-card-visibility="back"]')).toHaveCount(2);
    await expect(recipient.locator('.effect-badge.tone-draw')).toHaveCount(0);
    await expect(recipient.locator('.draw-reveal-caption')).toHaveCount(1);
    await expect(recipient.locator('.effect-badge')).toHaveCount(0);
    await expect(recipient.locator('[data-effect="turn"]')).toHaveCSS("opacity", "0");
    await recipient.screenshot({ path: info.outputPath("draw-two-effect.png"), fullPage: true });
    await page.screenshot({ path: info.outputPath("draw-two-observer.png"), fullPage: true });
    await expect.poll(() => recipient.locator('[data-effect="turn"]').evaluate(element => Number(getComputedStyle(element).opacity)), { timeout: 6000 }).toBeGreaterThan(.9);
    await expect(recipient.locator('.draw-reveal-caption')).toHaveCSS("opacity", "0");
    await expect(recipient.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    await expect(recipient.getByTestId("my-hand-count")).toHaveText("4 lá");
  } finally { await group.close(); }
});
test("effects: Draw Four waits for acceptance before four cards fly to the target", async ({ page, browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/effect-four");
  const group = await setup(page, browser);
  try {
    const recipient = group.pages[1]!;
    await play(page, "special", true);
    await expect(recipient.locator('[data-effect="badge"][data-symbol="+4"]')).toHaveCount(1);
    await expect(recipient.locator('[data-effect="draw"]')).toHaveCount(0);
    await expect(recipient.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    await recipient.getByRole("button", { name: "Nhận 4 lá", exact: true }).click();
    await expect(recipient.locator('[data-effect="draw"]')).toHaveCount(4);
    await expect(recipient.locator('[data-effect="draw"][data-card-visibility="self"]')).toHaveCount(4);
    await expect(page.locator('[data-effect="draw"][data-card-visibility="back"]')).toHaveCount(4);
    await expectSlowDraw(group.pages, recipient, 4);
    await expect(recipient.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    await expect(recipient.getByTestId("my-hand-count")).toHaveText("6 lá");
    await expect(recipient.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "Đổi sang màu nào?" })).toBeVisible();
    await page.getByRole("button", { name: "Xanh lá", exact: true }).click();
  } finally { await group.close(); }
});
test("effects: a voluntary +4 acceptance returns the color picker to the +4 author after the reveal", async ({ page, browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/effect-four");
  const group = await setup(page, browser);
  try {
    const recipient = group.pages[1]!;
    await play(page, "special", true);
    await expect(recipient.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    await recipient.getByRole("button", { name: "Nhận 4 lá", exact: true }).click();
    await expect(recipient.locator('[data-effect="draw"]')).toHaveCount(4);
    await expect(recipient.getByRole("dialog")).toHaveCount(0);
    await expect(recipient.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(recipient.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Đỏ", exact: true }).click();
    await expect(page.getByTestId("uno-board")).toHaveAttribute("data-my-turn", "true");
  } finally { await group.close(); }
});

test("effects: two-player Reverse has its own symbol and explains playing again", async ({ page, browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/effect-reverse");
  const group = await setup(page, browser);
  try {
    await play(page, "special");
    await expect(page.locator('[data-effect="badge"][data-symbol="⊘"]')).toHaveCount(0);
    for (const client of group.pages) {
      await expect(client.locator('[data-effect="badge"][data-symbol="⇄"]')).toContainText("được chơi tiếp");
      await expect(client.locator(".tone-reverse .reverse-mark")).toHaveCount(1);
      await expect(client.locator(".tone-skip")).toHaveCount(0);
    }
    await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    await expect(page.getByTestId("uno-board")).toHaveAttribute("data-my-turn", "true");
  } finally { await group.close(); }
});
test("effects: reduced motion keeps feedback and game state without flying cards", async ({ page, browser, request }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await request.post("http://127.0.0.1:5101/scenario/effect-two");
  const group = await setup(page, browser);
  try {
    await page.evaluate(() => {
      const record: string[] = [];
      (window as Window & { animationProbe?: string[] }).animationProbe = record;
      const observer = new MutationObserver(() => {
        document.querySelectorAll('[data-effect="play"],[data-effect="draw"]').forEach(element => record.push(element.getAttribute("data-effect")!));
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
    await play(page, "special");
    await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-revision", "1");
    await expect(page.locator(".direction-ring-orbit")).toHaveCSS("animation-name", "none");
    await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    expect(await page.evaluate(() => (window as Window & { animationProbe?: string[] }).animationProbe)).toEqual([]);
  } finally { await group.close(); }
});


test("effects: a manual draw pauses to reveal its face and marks the new card in hand", async ({ page, browser, request }, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await request.post("http://127.0.0.1:5101/scenario/draw");
  const group = await setup(page, browser);
  try {
    await page.getByRole("button", { name: "Bốc bài", exact: true }).click();
    const reveal = page.locator(".draw-reveal-caption");
    await expect(reveal).toContainText("Đỏ 2");
    await expect.poll(() => reveal.evaluate(element => Number(getComputedStyle(element).opacity)), { intervals: [30, 50], timeout: 3000 }).toBeGreaterThan(.95);
    await page.screenshot({ path: info.outputPath("manual-draw-reveal.png") });
    await page.waitForTimeout(650);
    await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-animating", "true");
    await expect(reveal).toBeVisible();
    await expect(page.locator('[data-card-id="draw-red"]')).toHaveCount(0);
    await expect(page.getByTestId("my-hand-count")).toHaveText("2 lá");
    await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    const card = page.locator('[data-card-id="draw-red"]');
    await expect(card).toHaveClass(/is-new/);
    await expect(card).toContainText("Vừa bốc");
    await group.pages[0]!.getByRole("button", { name: "Bỏ lượt", exact: true }).click();
    const other = group.pages[1]!;
    await other.getByRole("button", { name: "Bốc bài", exact: true }).click();
    await expectSlowDraw(group.pages, other, 1);
    await expect(other.locator(".draw-reveal-caption")).toContainText("Xanh dương 1");
    await page.screenshot({ path: info.outputPath("manual-draw-hand.png") });
  } finally { await group.close(); }
});


test("effects: three-player Reverse changes direction without a Skip badge", async ({ page, browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/effect-reverse");
  const group = await setup(page, browser, 3);
  try {
    await play(page, "special");
    for (const client of group.pages) {
      await expect(client.locator('.tone-reverse')).toContainText("Đảo chiều!");
      await expect(client.locator('.tone-skip')).toHaveCount(0);
    }
    await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    await expect(group.pages[2]!.getByTestId("uno-board")).toHaveAttribute("data-my-turn", "true");
    await expect(group.pages[1]!.getByTestId("uno-board")).toHaveAttribute("data-my-turn", "false");
  } finally { await group.close(); }
});


for (const viewport of [{ width:1920, height:1080 }, { width:1366, height:768 }, { width:375, height:812 }]) {
for (const kind of ["skip", "reverse"] as const) {
  test("green " + kind + " matches its card, badge and direction ring at " + viewport.width, async ({ page, browser, request }, info) => {
    await page.setViewportSize(viewport);
    await request.post("http://127.0.0.1:5101/scenario/effect-" + kind + "-green");
    const group = await setup(page, browser, 3);
    try {
      const measure = (svg: Element) => {
        const face = svg.closest(".uno-card-face")!.getBoundingClientRect();
        const shape = svg.querySelector("[data-symbol-shape]")!.getBoundingClientRect();
        return { width:shape.width / face.width, height:shape.height / face.height, dx:Math.abs(shape.x + shape.width / 2 - face.x - face.width / 2), dy:Math.abs(shape.y + shape.height / 2 - face.y - face.height / 2) };
      };
      const handSymbol = page.locator('[data-card-id="special"] .card-symbol-art');
      const handRatio = await handSymbol.evaluate(measure);
      expect(handRatio.width).toBeGreaterThan(.35); expect(handRatio.width).toBeLessThan(.8);
      expect(handRatio.dx).toBeLessThan(3); expect(handRatio.dy).toBeLessThan(3);
      await play(page, "special");
      await expect(page.locator('.played-flight .card-symbol-art')).toHaveCount(1);
      for (const client of group.pages) {
        const badge = client.locator(".effect-badge.tone-" + kind);
        await expect(badge).toHaveAttribute("data-effect-color", "green");
        await expect(badge.locator("strong")).toHaveCSS("background-color", "rgb(53, 170, 54)");
      }
      await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
      const symbol = page.locator('[data-discard-card-id="special"] .card-symbol-art');
      const pileRatio = await symbol.evaluate(measure);
      expect(pileRatio.width).toBeGreaterThan(.35); expect(pileRatio.width).toBeLessThan(.8);
      expect(pileRatio.height).toBeGreaterThan(.25); expect(pileRatio.height).toBeLessThan(.7);
      expect(Math.abs(pileRatio.width - handRatio.width)).toBeLessThan(.2);
      expect(pileRatio.dx).toBeLessThan(3); expect(pileRatio.dy).toBeLessThan(3);
      const ring = page.getByTestId("direction-ring");
      await expect(ring).toHaveAttribute("data-color", "green");
      await expect(ring).toHaveAttribute("data-direction", kind === "reverse" ? "-1" : "1");
      await expect(ring).toHaveCSS("color", "rgb(53, 170, 54)");
      await expect(ring.locator(".direction-ring-orbit")).toHaveCSS("animation-direction", kind === "reverse" ? "reverse" : "normal");
      await page.screenshot({ path: info.outputPath("green-" + kind + ".png") });
    } finally { await group.close(); }
  });
}
}


test("recommendations lift legal cards only for the active player and clear on turn change", async ({ page, browser, request }, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await request.post("http://127.0.0.1:5101/scenario/uno");
  const group = await setup(page, browser);
  try {
    const guest = group.pages[1]!;
    const red = page.locator('[data-card-id="play-red"]');
    const blue = page.locator('[data-card-id="stay-blue"]');
    await expect(red).toHaveClass(/is-suggested/);
    await expect(red).toHaveCSS("outline-style", "none");
    await red.hover();
    await expect(red).toHaveCSS("outline-style", "none");
    const spacing = await page.locator(".hand-list").evaluate(element => getComputedStyle(element).gap);
    expect(spacing).toBe("8px");
    await red.click();
    await expect(red).toHaveClass(/is-selected/);
    await expect(red).toHaveCSS("outline-color", "rgb(255, 213, 74)");
    await expect(red).toHaveCSS("outline-width", "3px");
    await expect(blue).toHaveClass(/is-blocked/);
    await expect(blue.locator(".uno-card-face")).toHaveCSS("filter", "brightness(0.38)");
    await expect(guest.locator(".is-suggested,.is-blocked")).toHaveCount(0);
    await expect(guest.locator(".uno-hand-card .uno-card-face").first()).toHaveCSS("filter", "none");
    await page.screenshot({ path: info.outputPath("suggested-mobile.png") });
    await play(page, "play-red");
    await expect(guest.locator('[data-card-id="other-red"]')).toHaveClass(/is-suggested/);
    await expect(guest.locator('[data-card-id="other-green"]')).toHaveClass(/is-blocked/);
    await expect(page.locator(".is-suggested,.is-blocked")).toHaveCount(0);
    await expect(blue.locator(".uno-card-face")).toHaveCSS("filter", "none");
    await guest.screenshot({ path: info.outputPath("suggested-desktop.png") });
  } finally { await group.close(); }
});


test("table: draw stock stays outside the center, discards stay scattered and arrows orbit", async ({ page, browser, request }, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await request.post("http://127.0.0.1:5101/scenario/table");
  const group = await setup(page, browser, 4);
  try {
    await expect(page.locator(".discard-layer")).toHaveCount(8);
    await expect(page.locator(".game-announcement,.discard-count,.active-color,.hand-label")).toHaveCount(0);
    for (const seat of await page.locator(".opponent").all()) {
      const count = Number(await seat.locator(".opponent-hand").getAttribute("data-count"));
      await expect(seat.locator(".opponent-card-back")).toHaveCount(count);
      await expect(seat.locator(".opponent-count")).toHaveText(String(count));
      await expect(seat.locator(".uno-card-face")).toHaveCount(0);
      const bounds = await seat.locator(".opponent-card-back").evaluateAll(elements => elements.map(element => ({ left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right })));
      for (const box of bounds) { expect(box.left).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(await page.evaluate(() => innerWidth)); }
    }
    await expect(page.locator(".pile-area .draw-pile")).toHaveCount(0);
    const deck = await page.locator(".draw-pile").boundingBox();
    const center = await page.locator(".pile-area").boundingBox();
    expect(deck!.y + deck!.height).toBeLessThan(center!.y);
    const orbit = page.locator(".direction-ring-orbit");
    await expect(orbit).toHaveCSS("animation-name", "uno-orbit");
    const oldTransform = await orbit.evaluate(element => getComputedStyle(element).transform);
    await page.waitForTimeout(250);
    expect(await orbit.evaluate(element => getComputedStyle(element).transform)).not.toBe(oldTransform);
    const oldStyles = await page.locator(".discard-layer").evaluateAll(elements => Object.fromEntries(elements.map(element => [element.getAttribute("data-discard-card-id"), element.getAttribute("style")])));
    expect(new Set(Object.values(oldStyles)).size).toBeGreaterThan(4);
    await play(page, "play-red");
    await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    const newStyles = await page.locator(".discard-layer").evaluateAll(elements => Object.fromEntries(elements.map(element => [element.getAttribute("data-discard-card-id"), element.getAttribute("style")])));
    for (const [id, style] of Object.entries(oldStyles)) {
      if (id in newStyles) {
        // Layer order changes as old cards leave the visible window; placement stays identical.
        expect(String(newStyles[id]).replace(/z-index:[^;]+;?/, "")).toBe(String(style).replace(/z-index:[^;]+;?/, ""));
      }
    }
    const verifySeating = async () => {
      const layout = await page.evaluate(() => {
        const mid = (element: Element) => { const r = element.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
        const felt = mid(document.querySelector(".table-ring")!);
        const orbit = mid(document.querySelector(".pile-area")!);
        const pileElement = document.querySelector(".discard-stack")!;
        const pile = mid(pileElement);
        const pileHeight = pileElement.getBoundingClientRect().height;
        const seats = Array.from(document.querySelectorAll(".opponent")).map(seat => ({ identity: mid(seat.querySelector(".opponent-identity")!), hand: mid(seat.querySelector(".opponent-hand")!), identityBounds: seat.querySelector(".opponent-identity")!.getBoundingClientRect().toJSON(), handStyle: { translate: getComputedStyle(seat.querySelector(".opponent-hand")!).translate, transform: getComputedStyle(seat.querySelector(".opponent-hand")!).transform, position: getComputedStyle(seat.querySelector(".opponent-hand")!).position }, cardBounds: Array.from(seat.querySelectorAll(".opponent-card-back")).map(card => card.getBoundingClientRect().toJSON()) }));
        const handStyle = getComputedStyle(document.querySelector(".uno-hand-card")!);
        const handHeight = Number.parseFloat(handStyle.height);
        const handWidth = Number.parseFloat(handStyle.width);
        const pileWidth = pileElement.getBoundingClientRect().width;
        return { felt, orbit, pile, pileHeight, pileWidth, handHeight, handWidth, seats };
      });
      expect(Math.abs(layout.pileHeight - layout.handHeight)).toBeLessThan(.5);
      expect(Math.abs(layout.pileWidth - layout.handWidth)).toBeLessThan(.5);
      for (const center of [layout.orbit, layout.pile]) {
        expect(Math.abs(center.x - layout.felt.x)).toBeLessThan(1);
        expect(Math.abs(center.y - layout.felt.y)).toBeLessThan(1);
      }
      for (const seat of layout.seats) {
        expect(Math.abs(seat.identity.y - seat.hand.y)).toBeLessThan(1);
        for (const card of seat.cardBounds) {
          const gap = Math.max(seat.identityBounds.left - card.right, card.left - seat.identityBounds.right);
          expect(gap, JSON.stringify({ seat, card })).toBeGreaterThan(5);
        }
      }
    };
    for (const viewport of [{ width:1920, height:1080 }, { width:1366, height:768 }, { width:1024, height:1366 }, { width:768, height:1024 }, { width:375, height:812 }, { width:375, height:667 }, { width:812, height:375 }]) {
      await page.setViewportSize(viewport);
      await verifySeating();
      await page.screenshot({ path: info.outputPath("compact-table-" + viewport.width + "x" + viewport.height + ".png") });
    }
    await page.reload();
    await expect(page.locator(".discard-layer")).toHaveCount(8);
  } finally { await group.close(); }
});
