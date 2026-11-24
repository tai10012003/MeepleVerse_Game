import { expect, test, type Page } from "@playwright/test";
import { joinRoom, play } from "./helpers/expanded-room";
const screen = (page:Page) => page.getByTestId("expanded-screen");
async function choose(page:Page, nickname:string, card="swap") {
  await play(page,card);
  const dialog=page.getByRole("dialog");
  await dialog.getByRole("button",{name:new RegExp(nickname)}).click();
  await dialog.getByRole("button",{name:"Đỏ",exact:true}).click();
  return dialog;
}
test.afterEach(async({request})=>{await request.post("http://127.0.0.1:5101/scenario/normal");});
for (const count of [2,4]) test(`Card Swap: ${count} players confirm a private exchange with two face-down flights`,async({browser,request},info)=>{
  expect((await request.post("http://127.0.0.1:5101/scenario/expanded-swap")).ok()).toBe(true);
  const group=await joinRoom(browser,count);const a=group.pages[0]!,target=group.pages[count-1]!;
  try {
    const clock=await a.locator(".turn-countdown").getAttribute("data-clock-id");
    await play(a,"swap");const dialog=a.getByRole("dialog");
    await expect(dialog.getByRole("button",{name:"Xác nhận",exact:true})).toBeDisabled();
    await dialog.getByRole("button",{name:"Đỏ",exact:true}).click();
    await expect(dialog.getByRole("button",{name:"Xác nhận",exact:true})).toBeDisabled();
    await dialog.getByRole("button",{name:new RegExp(`Guest${count-1}`)}).click();
    await expect(dialog).toContainText("Nhận tay một lá không bị phạt UNO");
    await expect(dialog).toContainText("Sau nước đánh: còn 1 lá");
    await expect(a.locator(".turn-countdown")).toHaveAttribute("data-clock-id",clock!);
    await expect(screen(a)).toHaveAttribute("data-revision","0");
    await dialog.screenshot({path:info.outputPath("swap-choice.png")});
    await dialog.getByRole("button",{name:"Xác nhận",exact:true}).click();
    await expect(screen(a)).toHaveAttribute("data-revision","1");
    // Incoming faces wait until arrival; flying packets are always backs for every viewer.
    await expect(a.locator('.expanded-hand-card[data-card-id="target-secret"]')).toHaveCount(0);
    for(const page of group.pages){
      await expect(page.locator('[data-effect="swap"]')).toHaveCount(2);
      await expect(page.locator('[data-effect="swap"] .expanded-card-face')).toHaveCount(0);
      await expect(page.locator('[data-effect="swap"][data-card-visibility="back"]')).toHaveCount(2);
    }
    await expect(screen(a)).toHaveAttribute("data-swap-stage","flying");
    await expect(a.locator(".expanded-hand-list")).toHaveCSS("visibility","hidden");
    await a.screenshot({path:info.outputPath("swap-flight.png")});
    await expect(screen(a)).toHaveAttribute("data-animating","false");
    await expect(a.locator(".expanded-hand-card")).toHaveCount(1);
    await expect(a.locator('.expanded-hand-card[data-card-id="target-secret"]')).toHaveCount(1);
    await expect(target.locator(".expanded-hand-card")).toHaveCount(2);
    await expect(target.locator('.expanded-hand-card[data-card-id="actor-red"]')).toHaveCount(1);
    await expect(a.locator(".expanded-hand-list")).toHaveCSS("visibility","visible");
    for(const page of group.pages){
      await expect(screen(page)).toHaveAttribute("data-active-color","red");
      await expect(page.locator(".expanded-hand-card.is-new")).toHaveCount(0);
      await expect(page.locator("[data-transferring=true]")).toHaveCount(0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
    if(count===4) await expect(group.pages[1]!.locator(".expanded-hand-card")).toHaveCount(2);
    await target.screenshot({path:info.outputPath("swap-target-mobile.png")});
    expect(group.errors).toEqual([]);
  }finally{await group.close();}
});
test("Card Swap: cancel changes nothing and a two-card actor needs no UNO declaration",async({browser,request},info)=>{
  expect((await request.post("http://127.0.0.1:5101/scenario/expanded-swap-two")).ok()).toBe(true);const group=await joinRoom(browser);const a=group.pages[0]!;
  try{
    await a.setViewportSize({width:390,height:844});
    let dialog=await choose(a,"Guest1");
    expect(await dialog.evaluate(element=>{const r=element.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight;})).toBe(true);
    await dialog.screenshot({path:info.outputPath("swap-choice-mobile.png")});
    await expect(dialog.getByRole("button",{name:/UNO/})).toHaveCount(0);
    await dialog.getByRole("button",{name:"Chọn lá khác",exact:true}).click();
    await expect(screen(a)).toHaveAttribute("data-revision","0");await expect(a.locator(".expanded-hand-card")).toHaveCount(2);
    dialog=await choose(a,"Guest1");await dialog.getByRole("button",{name:"Xác nhận",exact:true}).click();
    await expect(screen(a)).toHaveAttribute("data-animating","false");await expect(screen(a)).toHaveAttribute("data-revision","1");
    await expect(screen(a)).toHaveAttribute("data-hand-count","1");await expect(screen(group.pages[1]!)).toHaveAttribute("data-hand-count","1");
    await expect(a.locator("[data-effect=draw]")).toHaveCount(0);await expect(a.locator(".expanded-error")).toHaveCount(0);expect(group.errors).toEqual([]);
  }finally{await group.close();}
});
test("Card Swap: final card wins without selecting a target or exchanging hands",async({browser,request})=>{
  expect((await request.post("http://127.0.0.1:5101/scenario/expanded-swap-final")).ok()).toBe(true);const group=await joinRoom(browser);const a=group.pages[0]!;
  try{
    await play(a,"swap");const dialog=a.getByRole("dialog");
    await expect(dialog).toContainText("bạn thắng ngay, không đổi tay bài");
    await expect(dialog.getByRole("region",{name:"Chọn người đổi bài"})).toHaveCount(0);
    await dialog.getByRole("button",{name:"Đỏ",exact:true}).click();await dialog.getByRole("button",{name:"Xác nhận",exact:true}).click();
    await expect(screen(a)).toHaveAttribute("data-status","ENDED");
    for(const page of group.pages)await expect(page.locator('[data-effect="swap"]')).toHaveCount(0);
    await expect(screen(a)).toHaveAttribute("data-animating","false");
    await expect(screen(group.pages[1]!)).toHaveAttribute("data-hand-count","1");expect(group.errors).toEqual([]);
  }finally{await group.close();}
});
test("Card Swap: reduced motion updates all three viewers without flights; reload never replays",async({browser,request})=>{
  expect((await request.post("http://127.0.0.1:5101/scenario/expanded-swap")).ok()).toBe(true);const group=await joinRoom(browser,3);const a=group.pages[0]!;
  try{
    for(const page of group.pages)await page.emulateMedia({reducedMotion:"reduce"});
    const dialog=await choose(a,"Guest2");await dialog.getByRole("button",{name:"Xác nhận",exact:true}).click();
    await expect(screen(a)).toHaveAttribute("data-revision","1");
    for(const page of group.pages)await expect(page.locator('[data-effect="swap"]')).toHaveCount(0);
    await expect(a.locator('.expanded-hand-card[data-card-id="target-secret"]')).toHaveCount(1);
    await expect(screen(a)).toHaveAttribute("data-animating","false");
    await a.reload();await expect(a.getByTestId("expanded-board")).toBeVisible();
    await expect(a.locator('.expanded-hand-card[data-card-id="target-secret"]')).toHaveCount(1);
    await expect(a.getByTestId("expanded-effects")).toHaveCount(0);expect(group.errors).toEqual([]);
  }finally{await group.close();}
});
test("Card Swap: resize during exchange reveals the final hands and never leaves them hidden",async({browser,request})=>{
  expect((await request.post("http://127.0.0.1:5101/scenario/expanded-swap")).ok()).toBe(true);const group=await joinRoom(browser);const a=group.pages[0]!;
  try{
    const dialog=await choose(a,"Guest1");await dialog.getByRole("button",{name:"Xác nhận",exact:true}).click();
    await expect(screen(a)).toHaveAttribute("data-swap-stage","flying");await a.setViewportSize({width:390,height:844});
    await expect(screen(a)).toHaveAttribute("data-animating","false");
    await expect(a.locator(".expanded-hand-list")).toHaveCSS("visibility","visible");
    await expect(a.locator('.expanded-hand-card[data-card-id="target-secret"]')).toHaveCount(1);
    await expect(a.locator("[data-transferring=true]")).toHaveCount(0);expect(group.errors).toEqual([]);
  }finally{await group.close();}
});
test("Card Swap: a freshly drawn Swap opens the same target/color confirmation",async({browser,request})=>{
  expect((await request.post("http://127.0.0.1:5101/scenario/expanded-swap-drawn")).ok()).toBe(true);const group=await joinRoom(browser);const a=group.pages[0]!;
  try{
    await a.getByRole("button",{name:"Bốc bài",exact:true}).click();await expect(screen(a)).toHaveAttribute("data-animating","false");
    const dialog=await choose(a,"Guest1","drawn-swap");await dialog.getByRole("button",{name:"Xác nhận",exact:true}).click();
    await expect(screen(a)).toHaveAttribute("data-revision","2");await expect(screen(a)).toHaveAttribute("data-animating","false");
    await expect(a.locator('.expanded-hand-card[data-card-id="target-secret"]')).toHaveCount(1);expect(group.errors).toEqual([]);
  }finally{await group.close();}
});

test("Card Swap: reconnect cancels unfinished options and restores received cards without replay",async({browser,request})=>{
  expect((await request.post("http://127.0.0.1:5101/scenario/expanded-swap")).ok()).toBe(true);
  const group=await joinRoom(browser,3);const a=group.pages[0]!,target=group.pages[2]!;
  try{
    await choose(a,"Guest2");const url=target.url();await target.goto("about:blank");
    await expect(a.locator(".expanded-turn-strip")).toContainText("Tạm dừng");
    await expect(a.getByRole("dialog")).toHaveCount(0);await expect(screen(a)).toHaveAttribute("data-revision","0");
    await target.goto(url);await expect(target.getByTestId("expanded-board")).toBeVisible();
    await expect(a.locator(".expanded-turn-strip")).not.toContainText("Tạm dừng");
    await play(a,"swap");const dialog=a.getByRole("dialog");
    await expect(dialog.getByRole("button",{name:"Xác nhận",exact:true})).toBeDisabled();
    await dialog.getByRole("button",{name:/Guest2/}).click();await dialog.getByRole("button",{name:"Đỏ",exact:true}).click();
    await dialog.getByRole("button",{name:"Xác nhận",exact:true}).click();await expect(screen(target)).toHaveAttribute("data-revision","1");
    await expect(screen(target)).toHaveAttribute("data-animating","false");await target.reload();
    await expect(target.getByTestId("expanded-board")).toBeVisible();
    await expect(target.locator('.expanded-hand-card[data-card-id="actor-red"]')).toHaveCount(1);
    await expect(target.getByTestId("expanded-effects")).toHaveCount(0);
    await expect(target.locator("[data-transferring=true]")).toHaveCount(0);expect(group.errors).toEqual([]);
  }finally{await group.close();}
});
