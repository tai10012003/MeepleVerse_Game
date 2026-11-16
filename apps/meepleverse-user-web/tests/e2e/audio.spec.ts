import { test, expect, type Page } from "@playwright/test";
type Probe = Window & { audioStarts: { loop: boolean; duration: number }[]; audioStops: number; activeLoops: number; musicGain: GainNode | null };
async function probe(page: Page) {
  await page.addInitScript(() => {
    const target = window as unknown as Probe;
    target.audioStarts = []; target.audioStops = 0; target.activeLoops = 0; target.musicGain = null;
    const gains = new WeakMap<AudioNode, GainNode>();
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(this: AudioNode, ...args: unknown[]) {
      if (this instanceof AudioBufferSourceNode && args[0] instanceof GainNode) gains.set(this, args[0]);
      return Reflect.apply(connect, this, args);
    } as typeof connect;
    const looping = new WeakSet<AudioBufferSourceNode>();
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(...args: Parameters<typeof start>) {
      if (this.loop) { looping.add(this); target.activeLoops++; target.musicGain = gains.get(this) ?? null; }
      target.audioStarts.push({ loop: this.loop, duration: this.buffer?.duration ?? 0 });
      return start.apply(this, args);
    };
    const stop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.stop = function(...args: Parameters<typeof stop>) { if (looping.delete(this)) target.activeLoops--; target.audioStops++; return stop.apply(this, args); };
  });
}
async function create(page: Page) {
  await page.goto("/games/uno-basic");
  await page.getByLabel("Mọi người gọi bạn là gì?").fill("Tai");
  await page.getByRole("button", { name: "Tạo phòng UNO" }).click();
  await expect(page.getByRole("heading", { name: "Đợi bạn, đủ vui." })).toBeVisible();
}
const starts = (page: Page) => page.evaluate(() => (window as unknown as Probe).audioStarts);
test("audio: music plays after interaction, sliders persist, hidden tab pauses and leaving stops", async ({ page }) => {
  await probe(page);
  await page.goto("/");
  expect(await starts(page)).toHaveLength(0);
  await create(page);
  await expect.poll(() => page.evaluate(() => (window as unknown as Probe).activeLoops)).toBe(1);
  expect((await starts(page)).some(sound => sound.loop && Math.abs(sound.duration - 64 * 60 / 124) < .001)).toBe(true);
  await page.getByRole("button", { name: "Cài đặt âm thanh" }).click();
  const music = page.getByRole("slider", { name: "Âm lượng nhạc nền" });
  const effects = page.getByRole("slider", { name: "Âm lượng hiệu ứng" });
  await music.fill("17"); await effects.fill("38");
  await page.getByRole("button", { name: "Nghe thử hiệu ứng" }).click();
  await expect.poll(async () => (await starts(page)).filter(sound => Math.abs(sound.duration - .9) < .001).length).toBe(1);
  await expect.poll(() => page.evaluate(() => (window as unknown as Probe).musicGain?.gain.value ?? 1)).toBeLessThan(.1);
  await expect.poll(() => page.evaluate(() => (window as unknown as Probe).musicGain?.gain.value ?? 0)).toBeCloseTo(.17, 2);
  await expect(music).toHaveValue("17");
  await page.getByRole("checkbox", { name: "Nhạc nền", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "Hiệu ứng", exact: true }).uncheck();
  await expect(page.getByRole("button", { name: "Nghe thử hiệu ứng" })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Đợi bạn, đủ vui." })).toBeVisible();
  expect(await starts(page)).toHaveLength(0);
  await page.getByRole("button", { name: "Cài đặt âm thanh" }).click();
  await expect(music).toHaveValue("17"); await expect(effects).toHaveValue("38");
  await expect(page.getByRole("checkbox", { name: "Nhạc nền", exact: true })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Hiệu ứng", exact: true })).not.toBeChecked();
  await page.getByRole("checkbox", { name: "Nhạc nền", exact: true }).check();
  await expect.poll(() => page.evaluate(() => (window as unknown as Probe).activeLoops)).toBe(1);
  const before = await page.evaluate(() => (window as unknown as Probe).audioStops);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: true, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect.poll(() => page.evaluate(() => (window as unknown as Probe).audioStops)).toBeGreaterThan(before);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: false, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect.poll(() => page.evaluate(() => (window as unknown as Probe).activeLoops)).toBe(1);
  await page.getByRole("button", { name: "Đóng cài đặt âm thanh" }).click();
  await page.getByRole("button", { name: /Rời phòng/ }).click();
  await page.getByRole("button", { name: "Xác nhận rời phòng" }).click();
  await expect(page).toHaveURL("http://localhost:3100/");
  await expect.poll(() => page.evaluate(() => (window as unknown as Probe).audioStops)).toBeGreaterThan(before + 1);
});
test("audio: settings fit mobile and malformed saved preferences recover safely", async ({ page }, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => localStorage.setItem("meepleverse.audio.v1", '{"musicVolume":900,"effectsVolume":-9,"music":"bad"}'));
  await create(page);
  await page.getByRole("button", { name: "Cài đặt âm thanh" }).click();
  await expect(page.getByRole("slider", { name: "Âm lượng nhạc nền" })).toHaveValue("100");
  await expect(page.getByRole("slider", { name: "Âm lượng hiệu ứng" })).toHaveValue("0");
  const bounds = await page.getByRole("dialog", { name: "Âm thanh", exact: true }).boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
  for (const name of ["Âm lượng nhạc nền", "Âm lượng hiệu ứng"]) {
    const slider = page.getByRole("slider", { name });
    await slider.focus(); await page.keyboard.press("Home");
    await expect(slider).toHaveValue("0");
    const box = (await slider.boundingBox())!;
    await slider.click({ position: { x: box.width - 1, y: box.height / 2 } });
    await expect(slider).toHaveValue("100");
    expect(await slider.evaluate(element => getComputedStyle(element).padding)).toBe("0px");
    expect(await slider.evaluate(element => getComputedStyle(element).getPropertyValue("--audio-level").trim())).toBe("100%");
    await page.keyboard.press("ArrowLeft"); await expect(slider).toHaveValue("99");
    await page.keyboard.press("End"); await expect(slider).toHaveValue("100");
  }
  await page.screenshot({ path: info.outputPath("audio-volume-100-mobile.png") });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Âm thanh", exact: true })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Cài đặt âm thanh" })).toBeFocused();
});

test("audio: accepted card sounds on both clients, turn cue only for next player, reload never replays", async ({ page, browser, request }) => {
  await request.post("http://127.0.0.1:5101/scenario/uno");
  const other = await browser.newContext();
  try {
    await probe(page); await create(page);
    const guest = await other.newPage(); await probe(guest);
    await guest.goto(page.url());
    await guest.getByLabel("Mọi người gọi bạn là gì?").fill("Linh");
    await guest.getByRole("button", { name: "Vào phòng", exact: true }).click();
    await expect(page.getByText("Linh", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Bắt đầu ván", exact: true }).click();
    for (const client of [page, guest]) {
      await expect(client.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
      // Make the test independent of device audio unlock timing.
      await client.getByRole("button", { name: "Cài đặt âm thanh" }).click();
      await client.getByRole("button", { name: "Đóng cài đặt âm thanh" }).click();
    }
    await page.getByRole("button", { name: "Hô UNO", exact: true }).click();
    await page.locator('[data-card-id="play-red"]').click();
    await page.getByRole("button", { name: "Đánh lá bài", exact: true }).click();
    const count = async (client: Page, duration: number) => (await starts(client)).filter(sound => Math.abs(sound.duration - duration) < .001).length;
    for (const client of [page, guest]) await expect.poll(() => count(client, .24)).toBe(1);
    await expect.poll(() => count(guest, .72)).toBe(1);
    expect(await count(page, .72)).toBe(0);
    await expect(page.getByTestId("uno-screen")).toHaveAttribute("data-animating", "false");
    await page.reload();
    await expect(page.getByTestId("uno-board")).toBeVisible();
    await page.getByRole("button", { name: "Cài đặt âm thanh" }).click();
    await page.getByRole("button", { name: "Đóng cài đặt âm thanh" }).click();
    expect(await count(page, .24)).toBe(0);
    expect(await count(page, .72)).toBe(0);
  } finally { await other.close(); await request.post("http://127.0.0.1:5101/scenario/normal"); }
});
