import { expect, test, type Page } from "@playwright/test";
import { joinRoom, play, nextRevision } from "./helpers/expanded-room";
test.afterEach(async ({ request }) => { await request.post("http://127.0.0.1:5101/scenario/normal"); });
async function dimensions(page: Page, selectors: string[]) {
 return page.evaluate(selectors => selectors.map(selector => {
  const element = document.querySelector(selector)!; const style = getComputedStyle(element);
  return [parseFloat(style.width),parseFloat(style.height)];
 }), selectors);
}
test("expanded 9C: card, avatar, badges and compact controls match Basic across six screen sizes", async ({ browser, request }, info) => {
 await request.post("http://127.0.0.1:5101/scenario/normal");
 const basic = await browser.newContext(); const guest = await browser.newContext();
 const a = await basic.newPage(), b = await guest.newPage();
 let group: Awaited<ReturnType<typeof joinRoom>> | undefined;
 try {
  await a.goto("/games/uno-basic"); await a.getByLabel("Mọi người gọi bạn là gì?").fill("Basic"); await a.getByRole("button", { name:"Tạo phòng UNO", exact:true }).click(); await expect(a).toHaveURL(/\/room\/[A-Z0-9]{4}$/);
  await b.goto(a.url()); await b.getByLabel("Mọi người gọi bạn là gì?").fill("Other"); await b.getByRole("button", { name:"Vào phòng", exact:true }).click(); await a.getByRole("button", { name:"Bắt đầu ván", exact:true }).click(); await expect(a.getByTestId("uno-board")).toBeVisible();
  group = await joinRoom(browser); const expanded = group.pages[0]!;
  for (const viewport of [{width:1366,height:650},{width:1366,height:768},{width:1920,height:1080},{width:820,height:1180},{width:390,height:844},{width:844,height:390}]) {
   await a.setViewportSize(viewport); await expanded.setViewportSize(viewport);
   const expected = await dimensions(a,[".uno-hand-card", ".discard-stack", ".draw-pile", ".opponent-card-back", ".uno-button", ".opponent-identity", ".opponent-count", ".hand-count", ".action-row>.button"]);
   const actual = await dimensions(expanded,[".expanded-hand-card", ".expanded-discard", ".expanded-draw button", ".opponent-card-back", ".expanded-uno", ".expanded-identity", ".expanded-opponent-count", ".expanded-hand-count", ".expanded-actions>.button"]);
   for (let i=0;i<expected.length;i++) for(let j=0;j<2;j++) { if(i===8 && j===0 && viewport.width<=900) expect(actual[i]![j]!).toBeLessThanOrEqual(expected[i]![j]!); else expect(Math.abs(actual[i]![j]! - expected[i]![j]!),`${viewport.width}x${viewport.height} item ${i}`).toBeLessThan(1); }
   expect(await expanded.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
   expect(await expanded.locator(".expanded-controls").evaluate(element => element.getBoundingClientRect().bottom <= innerHeight + 1)).toBe(true);
   if(viewport.width === 390 || viewport.height === 650 || viewport.width === 1920) await expanded.screenshot({path:info.outputPath(`expanded-${viewport.width}.png`)});
  }
  await group.close();
  await request.post("http://127.0.0.1:5101/scenario/expanded-draw"); group = await joinRoom(browser);
  const active = group.pages[0]!;
  await expect(active.locator(".expanded-hand-card.is-suggested")).toHaveCount(1);
  for (const selector of [".expanded-hand-card.is-suggested", ".expanded-hand-card.is-blocked"]) {
   await expect.poll(() => active.locator(selector).evaluate(element => new DOMMatrix(getComputedStyle(element).transform).b)).toBe(0);
  }
  await active.screenshot({path:info.outputPath("expanded-active-hand.png")});
  expect(group.errors).toEqual([]);
 } finally { await group?.close(); await basic.close(); await guest.close(); }
});
test("expanded 9C: slow manual draw reveals only to its owner before joining the hand; reload never replays", async ({ browser, request }) => {
 await request.post("http://127.0.0.1:5101/scenario/expanded-draw"); const group = await joinRoom(browser); const [a,b] = group.pages;
 try {
  await a!.getByRole("button", {name:"Bốc bài",exact:true}).click(); await nextRevision(a!,1);
  for(const page of group.pages) await expect(page.locator('[data-effect="draw"]')).toHaveCount(1);
  await expect(a!.locator('.expanded-hand-card[data-card-id="draw-red"]')).toHaveCount(0);
  await expect(a!.locator('[data-effect="draw"]')).toHaveAttribute("data-card-visibility","self");
  await expect(b!.locator('[data-effect="draw"]')).toHaveAttribute("data-card-visibility","back");
  await expect(b!.locator('[data-effect="draw"] .expanded-card-face')).toHaveCount(0);
  await expect(a!.locator('[data-effect="draw"]')).toHaveAttribute("data-draw-duration","1.85");
  await expect(a!.locator(".draw-reveal-caption")).toContainText("Vừa bốc");
  await expect(a!.locator('.expanded-hand-card[data-card-id="draw-red"]')).toHaveCount(1);
  await expect(a!.getByTestId("expanded-screen")).toHaveAttribute("data-animating","false");
  await a!.reload(); await expect(a!.getByTestId("expanded-board")).toBeVisible(); await expect(a!.getByTestId("expanded-effects")).toHaveCount(0); expect(group.errors).toEqual([]);
 } finally {await group.close();}
});
test("expanded 9C: +2 flies once, then both clients animate private penalty cards without duplicate notices", async ({ browser, request }) => {
 await request.post("http://127.0.0.1:5101/scenario/expanded-stack"); const group = await joinRoom(browser); const [a,b] = group.pages;
 try {
  await play(a!,"two"); await expect(a!.locator('[data-effect="play"]')).toHaveCount(1);
  await expect(b!.locator('[data-effect="play"]')).toHaveCount(1);
  await expect(a!.locator('[data-discard-card-id="two"]')).toHaveCount(1);
  await expect(a!.locator('[data-effect="badge"]')).toContainText("+2");
  await b!.getByRole("button", {name:"Nhận 2 lá",exact:true}).click();
  for(const page of group.pages) await expect(page.locator('[data-effect="draw"]')).toHaveCount(2);
  await expect(b!.locator('.expanded-hand-card[data-card-id="draw-red"]')).toHaveCount(0);
  await expect(a!.locator('[data-effect="draw"] .expanded-card-face')).toHaveCount(0);
  await expect(a!.locator(".draw-reveal-caption")).toHaveCount(0);
  await expect(b!.getByTestId("expanded-hand-count")).toHaveText("5 lá"); expect(group.errors).toEqual([]);
 } finally {await group.close();}
});
for(const kind of ["skip","reverse"]) test(`expanded 9C: ${kind} keeps its distinct red icon visible for two seconds`, async ({ browser, request }) => {
 await request.post(`http://127.0.0.1:5101/scenario/expanded-effect-${kind}`); const group = await joinRoom(browser);
 try {
  await play(group.pages[0]!,"action");
  await Promise.all(group.pages.map(async page => {
   const badge=page.locator(`[data-effect="badge"].tone-${kind}`);
   await expect(badge).toHaveAttribute("data-effect-color","red");
   await expect.poll(() => badge.evaluate(element => +getComputedStyle(element).opacity)).toBeGreaterThan(.9);
   await page.waitForTimeout(1100); await expect(badge).toBeVisible();
  }));
  expect(group.errors).toEqual([]);
 } finally {await group.close();}
});
