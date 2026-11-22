import { expect, test, type Browser } from "@playwright/test";
import { joinRoom, play, confirmColor } from "./helpers/expanded-room";
const turnMs = Number(process.env.BROWSER_TURN_MS ?? 30000);
const upMs = Number(process.env.BROWSER_UP_MS ?? 20000);
test.beforeEach(() => { test.setTimeout(Math.max(45000, turnMs + 25000, upMs + 25000)); });
async function basicPair(browser: Browser) {
  const contexts=await Promise.all([browser.newContext({viewport:{width:1366,height:768}}),browser.newContext({viewport:{width:375,height:812}})]);
  const pages=await Promise.all(contexts.map(context=>context.newPage()));
  try {
    await pages[0]!.goto("/games/uno-basic");await pages[0]!.getByLabel("Mọi người gọi bạn là gì?").fill("Host");await pages[0]!.getByRole("button",{name:"Tạo phòng UNO",exact:true}).click();await expect(pages[0]!).toHaveURL(/room\/[A-Z0-9]{4}$/);
    await pages[1]!.goto(pages[0]!.url());await pages[1]!.getByLabel("Mọi người gọi bạn là gì?").fill("Guest1");await pages[1]!.getByRole("button",{name:"Vào phòng",exact:true}).click();
    await expect(pages[0]!.getByText("2/4 ghế",{exact:true})).toBeVisible();await pages[0]!.getByRole("button",{name:"Bắt đầu ván",exact:true}).click();
    for(const page of pages)await expect(page.getByTestId("uno-board")).toBeVisible();
    return {pages,close:async()=>{await Promise.all(contexts.map(context=>context.close()));}};
  } catch(error) {await Promise.all(contexts.map(context=>context.close()));throw error;}
}
for(const edition of ["basic","expanded"] as const) test(`turn clock: ${edition} warns at five and server passes an idle turn without drawing`,async({browser,request},info)=>{
 await request.post("http://127.0.0.1:5101/scenario/"+(edition==="basic"?"uno":"expanded-accept-rapid"));
 const group=edition==="basic"?await basicPair(browser):await joinRoom(browser);
 try {
  const [a,b]=group.pages;const root=a!.getByTestId(edition==="basic"?"uno-screen":"expanded-screen");const timer=a!.locator(".turn-countdown");
  await expect(timer).toHaveAttribute("data-duration-ms",String(turnMs));const id=await timer.getAttribute("data-clock-id");const deadline=await timer.getAttribute("data-deadline");
  await expect(b!.locator(".turn-countdown")).toHaveAttribute("data-deadline",deadline!);
  const hand=await a!.locator(edition==="basic"?".uno-hand-card":".expanded-hand-card").count();
  await expect(timer).toHaveClass(/is-urgent/, { timeout: turnMs + 5000 });await b!.screenshot({path:info.outputPath(`${edition}-clock-five-mobile.png`)});
  await expect(root).toHaveAttribute("data-revision","1", { timeout: turnMs + 5000 });await expect(timer).not.toHaveAttribute("data-clock-id",id!);
  await expect(a!.locator(edition==="basic"?".uno-hand-card":".expanded-hand-card")).toHaveCount(hand);
  await expect(b!.locator(".turn-countdown")).toHaveAttribute("data-clock-id",(await timer.getAttribute("data-clock-id"))!);
  expect(await b!.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 } finally {await group.close();}
});
test("turn clock: drawing and reconnect preserve remaining time, then keep the card and pass",async({browser,request})=>{
 await request.post("http://127.0.0.1:5101/scenario/expanded-draw");const group=await joinRoom(browser);const [a,b]=group.pages;
 try {
  const timer=a!.locator(".turn-countdown");const deadline=await timer.getAttribute("data-deadline");
  await a!.getByRole("button",{name:"Bốc bài",exact:true}).click();await expect(a!.getByTestId("expanded-board")).toHaveAttribute("data-phase","drawn");await expect(timer).toHaveAttribute("data-deadline",deadline!);
  const url=b!.url();await b!.goto("about:blank");await expect(timer).toHaveClass(/is-paused/);const frozen=await timer.innerText();
  await a!.waitForTimeout(1100);expect(await timer.innerText()).toBe(frozen);
  await b!.goto(url);await expect(b!.getByTestId("expanded-board")).toBeVisible();await expect(timer).not.toHaveClass(/is-paused/);
  expect(Number(await timer.getAttribute("data-deadline"))).toBeGreaterThan(Number(deadline));
  await expect(a!.getByTestId("expanded-screen")).toHaveAttribute("data-revision","2", { timeout: turnMs + 5000 });await expect(a!.getByTestId("expanded-screen")).toHaveAttribute("data-hand-count","3");
  await expect(a!.getByTestId("expanded-board")).toHaveAttribute("data-phase","turn");
 } finally{await group.close();}
});
test("turn clock: an unconfirmed Basic color popup expires without playing its Wild",async({browser,request})=>{
 await request.post("http://127.0.0.1:5101/scenario/wild");const group=await basicPair(browser);const [a]=group.pages;
 try {
  const timer=a!.locator(".turn-countdown");const id=await timer.getAttribute("data-clock-id");
  await a!.locator('[data-card-id="plain-wild"]').click();await a!.getByRole("button",{name:"Đánh lá bài",exact:true}).click();await expect(a!.getByRole("dialog")).toBeVisible();
  await expect(a!.getByTestId("uno-screen")).toHaveAttribute("data-revision","1", { timeout: turnMs + 5000 });await expect(a!.getByRole("dialog")).toHaveCount(0);await expect(timer).not.toHaveAttribute("data-clock-id",id!);
  await expect(a!.locator('[data-card-id="plain-wild"]')).toHaveCount(1);
 }finally{await group.close();}
});
test("turn clock: Up automatically replies without declaring UNO and gives the next player a new clock",async({browser,request})=>{
 await request.post("http://127.0.0.1:5101/scenario/expanded-up");const group=await joinRoom(browser,3);const [a,b]=group.pages;
 try {
  await play(a!,"up");await confirmColor(a!,"Đỏ");
  await expect(b!.locator(".turn-countdown")).toHaveAttribute("data-clock-kind","up");await expect(b!.locator(".turn-countdown")).toHaveAttribute("data-duration-ms",String(upMs));
  await expect(b!.getByTestId("expanded-screen")).toHaveAttribute("data-revision","2", { timeout: upMs + 5000 });await expect(b!.getByTestId("expanded-screen")).toHaveAttribute("data-hand-count","3");
  await expect(a!.getByTestId("up-panel")).toContainText("Đáp số ≥ 5");
  await expect(b!.getByTestId("expanded-screen")).not.toHaveAttribute("data-current-player-id",await b!.getByTestId("expanded-screen").getAttribute("data-self-player-id")??"");
 }finally{await group.close();}
});
