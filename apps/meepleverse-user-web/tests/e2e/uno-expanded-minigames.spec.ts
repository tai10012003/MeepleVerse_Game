import { expect, test, type Page } from "@playwright/test";
import { joinRoom, play, confirmColor, nextRevision } from "./helpers/expanded-room";
async function startBattle(a: Page) {
  await play(a, "battle"); const dialog = a.getByRole("dialog");
  await dialog.getByRole("button", { name: "Đỏ", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Xác nhận" })).toBeDisabled();
  await dialog.getByRole("button", { name: "Guest1", exact: true }).click();
  await dialog.getByRole("button", { name: "Xác nhận" }).click();
  await expect(a.getByTestId("battle-panel")).toHaveAttribute("data-stage", "select");
}
async function replyUp(page: Page, id: string) {
  await page.getByRole("button", { name: "Hô UNO", exact: true }).click();
  await page.locator(`.expanded-hand-card[data-card-id="${id}"]`).click();
  await page.getByRole("button", { name: "Đáp lá bài", exact: true }).click();
}

test("expanded 9B: Up suggests server-approved 5/7 replies, settles its penalty and never replays feedback after reload", async ({ browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/expanded-up"); const group = await joinRoom(browser, 3); const [a, b, c] = group.pages;
  try {
    await play(a!, "up"); await confirmColor(a!, "Đỏ");
    await expect(b!.getByTestId("up-panel")).toContainText("Mở bằng số Đỏ");
    await expect(b!.locator('[data-card-id="b-low"]')).toBeDisabled(); await expect(b!.getByRole("button", { name: "Bốc bài", exact: true })).toBeDisabled();
    await replyUp(b!, "five"); await expect(c!.getByTestId("up-panel")).toContainText("Đáp số ≥ 5");
    await expect(c!.locator('[data-card-id="seven"]')).toBeEnabled(); await replyUp(c!, "seven");
    await nextRevision(a!, 3);
    // Read the transient result before waiting for all seven cards to finish arriving.
    await expect(a!.getByTestId("mini-feedback")).toContainText("Host bốc 7 lá");
    await expect(a!.getByTestId("expanded-hand-count")).toHaveText("9 lá");
    await expect(b!.getByTestId("expanded-hand-count")).toHaveText("1 lá"); await expect(c!.getByTestId("expanded-hand-count")).toHaveText("1 lá");
    await expect(a!.getByTestId("direction-ring")).toHaveAttribute("data-direction", "1");
    await a!.reload(); await expect(a!.getByTestId("expanded-board")).toHaveAttribute("data-phase", "turn"); await expect(a!.getByTestId("mini-feedback")).toHaveCount(0);
    expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});
test("expanded 9B: Battle keeps choices secret and preserves an unlocked draft when the opponent locks, then restores rewards", async ({ browser, request }, info) => {
  await request.post("http://127.0.0.1:5101/scenario/expanded-battle"); const group = await joinRoom(browser, 3); const [a, b, c] = group.pages;
  try {
    await startBattle(a!);
    for (const observer of [b!, c!]) expect(await observer!.locator("body").innerHTML()).not.toContain('"secret-a"');
    await expect(c!.getByTestId("battle-panel").locator("[data-choice-card-id]")).toHaveCount(0);
    await a!.getByTestId("battle-panel").locator('[data-choice-card-id="secret-a"]').click();
    await b!.getByRole("button", { name: "Hô UNO", exact: true }).click();
    await b!.getByTestId("battle-panel").locator('[data-choice-card-id="secret-b"]').click(); await b!.getByRole("button", { name: "Chọn lá bài", exact: true }).click(); await nextRevision(a!, 2);
    await expect(a!.getByTestId("battle-panel").locator('[data-choice-card-id="secret-a"]')).toHaveAttribute("aria-pressed", "true");
    await expect(b!.getByText("Đã chọn bài của bạn. Đối thủ chưa thấy mặt bài.")).toBeVisible();
    await a!.getByRole("button", { name: "Chọn lá bài", exact: true }).click(); await expect(c!.getByTestId("battle-panel")).toHaveAttribute("data-stage", "reward");
    await expect(c!.locator(".battle-revealed .expanded-card-face")).toHaveCount(2);
    await expect(c!.locator(".battle-penalties")).toContainText("Guest1 bốc 2 lá");
    await a!.reload(); await expect(a!.getByTestId("battle-panel")).toHaveAttribute("data-stage", "reward");
    await expect(a!.getByRole("button", { name: "Hô UNO", exact: true })).toHaveAttribute("aria-pressed", "false");
    await a!.getByTestId("battle-panel").locator('[data-choice-card-id="reward-a"]').click(); await expect(a!.getByRole("button", { name: "Xác nhận bỏ bài thưởng" })).toBeDisabled();
    await a!.getByTestId("battle-panel").locator('[data-choice-card-id="reward-b"]').click(); await a!.getByRole("button", { name: "Hô UNO", exact: true }).click();
    await c!.screenshot({ path: info.outputPath("battle-revealed-mobile.png") });
    await a!.getByRole("button", { name: "Xác nhận bỏ bài thưởng" }).click(); await nextRevision(b!, 6); // includes timed pause/resume revisions
    await expect(a!.getByTestId("expanded-hand-count")).toHaveText("1 lá"); await expect(b!.getByTestId("expanded-hand-count")).toHaveText("3 lá");
    await expect(a!.getByTestId("mini-feedback")).toContainText("Host thắng Battle"); expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});
test("expanded 9B: simultaneous Battle responses work and missing UNO is never filled in for selection or reward", async ({ browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/expanded-battle"); const group = await joinRoom(browser); const [a, b] = group.pages;
  try {
    await startBattle(a!);
    await a!.getByTestId("battle-panel").locator('[data-choice-card-id="secret-a"]').click(); await b!.getByTestId("battle-panel").locator('[data-choice-card-id="secret-b"]').click();
    await Promise.all([a!.getByRole("button", { name: "Chọn lá bài", exact: true }).click(), b!.getByRole("button", { name: "Chọn lá bài", exact: true }).click()]);
    await expect(a!.getByTestId("battle-panel")).toHaveAttribute("data-stage", "reward");
    await a!.getByTestId("battle-panel").locator('[data-choice-card-id="reward-a"]').click(); await a!.getByTestId("battle-panel").locator('[data-choice-card-id="reward-b"]').click();
    await a!.getByRole("button", { name: "Xác nhận bỏ bài thưởng" }).click(); await nextRevision(b!, 4);
    await expect(a!.getByTestId("expanded-hand-count")).toHaveText("3 lá"); await expect(b!.getByTestId("expanded-hand-count")).toHaveText("5 lá"); expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});
test("expanded 9B: Battle timeout is resolved by the server and its reveal is not replayed after reload", async ({ browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/expanded-battle-timeout"); const group = await joinRoom(browser); const a = group.pages[0]!;
  try {
    await expect(a.getByRole("heading", { name: "Bạn thắng rồi!" })).toBeVisible();
    await expect(a.getByTestId("mini-feedback")).toContainText("Host thắng Battle");
    await a.reload(); await expect(a.getByRole("heading", { name: "Bạn thắng rồi!" })).toBeVisible(); await expect(a.getByTestId("mini-feedback")).toHaveCount(0); expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});
test("expanded 9B: four High Five clients wait for the signal, record one response each and see the same last responder", async ({ browser, request }, info) => {
  await request.post("http://127.0.0.1:5101/scenario/expanded-high-five"); const group = await joinRoom(browser, 4); const [a, b, c, d] = group.pages;
  try {
    await a!.getByRole("button", { name: "Hô UNO", exact: true }).click(); await play(a!, "five");
    await expect(b!.getByTestId("high-five-panel")).toHaveAttribute("data-stage", "preparing");
    await expect(b!.getByRole("button", { name: "Đập tay!", exact: true })).toBeDisabled(); await expect(a!.getByRole("button", { name: "Đập tay!", exact: true })).toBeDisabled();
    await expect(b!.getByRole("button", { name: "Đập tay!", exact: true })).toBeEnabled(); await b!.getByRole("button", { name: "Đập tay!", exact: true }).click();
    await a!.getByRole("button", { name: "Đập tay!", exact: true }).click();
    await expect(b!.getByRole("button", { name: "Đập tay!", exact: true })).toBeDisabled();
    await b!.screenshot({ path: info.outputPath("high-five-mobile.png") });
    expect(await b!.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await Promise.all([c!.getByRole("button", { name: "Đập tay!", exact: true }).click(), d!.getByRole("button", { name: "Đập tay!", exact: true }).click()]);
    await expect(a!.getByTestId("expanded-board")).toHaveAttribute("data-phase", "turn");
    const label = await a!.getByTestId("mini-feedback").textContent();
    for (const page of group.pages) await expect(page.getByTestId("mini-feedback")).toHaveText(label!);
    await expect.poll(async () => (await Promise.all([c!, d!].map(async page => parseInt(await page.getByTestId("expanded-hand-count").innerText(), 10)))).sort()).toEqual([2, 4]); await expect(a!.getByTestId("expanded-hand-count")).toHaveText("1 lá"); expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});
test("expanded 9B: High Five reload starts a fresh attempt while keeping earlier responses", async ({ browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/expanded-high-five"); const group = await joinRoom(browser, 3); const [a, b, c] = group.pages;
  try {
    await a!.getByRole("button", { name: "Hô UNO", exact: true }).click(); await play(a!, "five");
    await expect(b!.getByRole("button", { name: "Đập tay!", exact: true })).toBeEnabled(); await b!.getByRole("button", { name: "Đập tay!", exact: true }).click();
    await a!.getByRole("button", { name: "Đập tay!", exact: true }).click();
    const attempt = Number(await b!.getByTestId("high-five-panel").getAttribute("data-attempt")); await c!.reload();
    await expect(c!.getByTestId("high-five-panel")).toHaveAttribute("data-attempt", String(attempt + 1));
    await expect(b!.getByRole("list", { name: "Thứ tự đập tay" })).toContainText("Guest1"); await expect(b!.getByRole("button", { name: "Đập tay!", exact: true })).toBeDisabled();
    await expect(c!.getByRole("button", { name: "Đập tay!", exact: true })).toBeEnabled(); await c!.getByRole("button", { name: "Đập tay!", exact: true }).click();
    await expect(a!.getByTestId("expanded-board")).toHaveAttribute("data-phase", "turn"); await expect(c!.getByTestId("expanded-hand-count")).toHaveText("4 lá"); expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});
test("expanded 9B: missing High Five responses time out once and ordinary controls return", async ({ browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/expanded-high-five-timeout"); const group = await joinRoom(browser, 3); const [a, b, c] = group.pages;
  try {
    await expect(b!.getByTestId("expanded-board")).toHaveAttribute("data-phase", "turn");
    await expect(b!.getByTestId("expanded-hand-count")).toHaveText("4 lá"); await expect(c!.getByTestId("expanded-hand-count")).toHaveText("4 lá");
    await expect(a!.getByTestId("expanded-hand-count")).toHaveText("3 lá");
    await expect(a!.getByTestId("mini-feedback")).toContainText("Guest1 bốc 2 lá"); await expect(b!.getByRole("button", { name: "Bốc bài", exact: true })).toBeEnabled(); expect(group.errors).toEqual([]);
  } finally { await group.close(); }
});

for (const actorFirst of [true,false]) test(`expanded High Five: two players both participate, actor first=${actorFirst}`, async ({ browser, request }, info) => {
 await request.post("http://127.0.0.1:5101/scenario/expanded-high-five"); const group = await joinRoom(browser); const [a,b] = group.pages;
 try {
  await a!.getByRole("button",{name:"Hô UNO",exact:true}).click(); await play(a!,"five");
  for(const page of group.pages) await expect(page.getByRole("button",{name:"Đập tay!",exact:true})).toBeEnabled();
  await b!.screenshot({path:info.outputPath("high-five-dock-mobile.png")});
  const overlap = await b!.evaluate(() => {
   const hand=document.querySelector(".expanded-high-five")!.getBoundingClientRect();
   const uno=document.querySelector(".expanded-uno")!.getBoundingClientRect();
   const play=document.querySelector(".expanded-actions>.button:last-child")!.getBoundingClientRect();
   return hand.right > uno.left || play.right > hand.left || uno.right > innerWidth;
  }); expect(overlap).toBe(false);
  const first = actorFirst ? a! : b!, last = actorFirst ? b! : a!;
  await first.getByRole("button",{name:"Đập tay!",exact:true}).click();
  await expect(first.getByRole("button",{name:"Đập tay!",exact:true})).toBeDisabled();
  await expect(last.getByTestId("expanded-board")).toHaveAttribute("data-phase","high-five");
  await last.getByRole("button",{name:"Đập tay!",exact:true}).click();
  await expect(last.getByTestId("expanded-hand-count")).toHaveText(actorFirst ? "4 lá" : "3 lá");
  await expect(first.getByTestId("expanded-hand-count")).toHaveText(actorFirst ? "1 lá" : "2 lá");
  expect(group.errors).toEqual([]);
 } finally { await group.close(); }
});
test("expanded High Five: nobody responds in the real five-second window, both draw two", async ({ browser, request }) => {
 await request.post("http://127.0.0.1:5101/scenario/expanded-high-five"); const group = await joinRoom(browser); const [a,b] = group.pages;
 try {
  await a!.getByRole("button",{name:"Hô UNO",exact:true}).click(); await play(a!,"five");
  await expect(a!.getByRole("button",{name:"Đập tay!",exact:true})).toBeEnabled();
  await expect(a!.locator(".expanded-high-five .mini-countdown")).toHaveText("5s");
  await expect(a!.getByTestId("expanded-board")).toHaveAttribute("data-phase","turn");
  for(const page of group.pages) {
   await expect(page.getByTestId("mini-feedback")).toContainText("Host bốc 2 lá");
   await expect(page.getByTestId("mini-feedback")).toContainText("Guest1 bốc 2 lá");
  }
  await expect(a!.getByTestId("expanded-hand-count")).toHaveText("3 lá"); await expect(b!.getByTestId("expanded-hand-count")).toHaveText("4 lá");
  expect(group.errors).toEqual([]);
 } finally { await group.close(); }
});
