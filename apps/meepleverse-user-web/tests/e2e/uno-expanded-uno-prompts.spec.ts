import { expect, test } from "@playwright/test";
import { joinRoom, play } from "./helpers/expanded-room";
import { settledExpanded } from "./helpers/expanded-acceptance";
for (const kind of ["discard-color", "wild-discard"] as const) for (const declareUno of [true,false]) test(`expanded UNO prompt: ${kind} previews one card and explicit declaration=${declareUno}`,async({browser,request},info)=>{
 await request.post(`http://127.0.0.1:5101/scenario/expanded-accept-${kind}`);
 const group=await joinRoom(browser);const [a,b]=group.pages;
 try {
  if(kind==="wild-discard" && declareUno) await a!.setViewportSize({width:375,height:812});
  await play(a!,"activate");const dialog=a!.getByRole("dialog");await expect(dialog).toBeVisible();
  if(kind==="wild-discard") {
   await expect(dialog.getByTestId("uno-choice-prompt")).toHaveCount(0);
   await dialog.getByRole("button",{name:"Xanh dương",exact:true}).click();await expect(dialog.getByTestId("uno-choice-prompt")).toHaveCount(0);
   await dialog.getByRole("button",{name:"Đỏ",exact:true}).click();
  }
  await expect(dialog.getByTestId("uno-choice-prompt")).toContainText("bạn còn 1 lá");
  const uno=dialog.getByRole("button",{name:"Hô UNO cho lựa chọn",exact:true});await expect(uno).toBeEnabled();
  if(declareUno) {await uno.click();await expect(uno).toHaveAttribute("aria-pressed","true");}
  const box=(await dialog.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(a!.viewportSize()!.width);
  expect(await dialog.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  await expect(uno).toBeInViewport();await expect(dialog.getByRole("button",{name:"Xác nhận",exact:true})).toBeInViewport();
  await a!.screenshot({path:info.outputPath(`${kind}-uno-prompt.png`)});
  await dialog.getByRole("button",{name:"Xác nhận",exact:true}).click();await expect(dialog).toHaveCount(0);
  const views=await settledExpanded(group.pages,202);expect(views[0]!.count).toBe(declareUno?1:3);expect(views[1]!.count).toBe(2);
  await expect(b!.locator(".expanded-opponent .expanded-card-face")).toHaveCount(0);expect(group.errors).toEqual([]);
 }finally{await group.close();}
});
test("expanded UNO prompt: Skip Two gives the same player a fresh turn in a two-player room",async({browser,request})=>{
 await request.post("http://127.0.0.1:5101/scenario/expanded-accept-skip-two");const group=await joinRoom(browser);
 try {
  const before=await settledExpanded(group.pages,202);const clock=await group.pages[0]!.locator(".turn-countdown").getAttribute("data-clock-id");
  await play(group.pages[0]!,"activate");const after=await settledExpanded(group.pages,202);
  expect(after[0]!.current).toBe(before[0]!.id);expect(after[0]!.count).toBe(before[0]!.count-1);expect(after[1]!.count).toBe(before[1]!.count);
  await expect(group.pages[0]!.locator(".turn-countdown")).not.toHaveAttribute("data-clock-id",clock!);
  expect(group.errors).toEqual([]);
 }finally{await group.close();}
});
