import { expect, test, type Page } from "@playwright/test";
import { joinRoom, play } from "./helpers/expanded-room";
async function noMiniPopup(page: Page) {
  await expect(page.getByRole("region",{name:"Kết quả ván",exact:true})).toBeVisible();
  await expect(page.getByTestId("mini-feedback")).toHaveCount(0);
  await expect(page.getByTestId("battle-panel")).toHaveCount(0);
  await expect(page.getByTestId("high-five-panel")).toHaveCount(0);
}
for(const kind of ["battle","high-five"] as const) test(`expanded ending: a final number never remounts dismissed ${kind} feedback`,async({browser,request},info)=>{
 test.setTimeout(60000);
 await request.post(`http://127.0.0.1:5101/scenario/expanded-${kind === "battle" ? "battle-last" : kind}`);const group=await joinRoom(browser);const [a,b]=group.pages;
 try {
  for(const page of group.pages)await page.emulateMedia({reducedMotion:"reduce"});
  if(kind==="battle") {
   await play(a!,"battle");const dialog=a!.getByRole("dialog");await dialog.getByRole("button",{name:"Đỏ",exact:true}).click();await dialog.getByRole("button",{name:"Guest1",exact:true}).click();await dialog.getByRole("button",{name:"Xác nhận",exact:true}).click();
   await a!.getByTestId("battle-panel").locator('[data-choice-card-id="secret-a"]').click();await a!.getByRole("button",{name:"Chọn lá bài",exact:true}).click();
   await b!.getByTestId("battle-panel").getByRole("button",{name:"Hô UNO cho lựa chọn",exact:true}).click();await b!.getByTestId("battle-panel").locator('[data-choice-card-id="secret-b"]').click();await b!.getByRole("button",{name:"Chọn lá bài",exact:true}).click();
   await a!.getByTestId("battle-panel").locator('[data-choice-card-id="reward-a"]').click();await a!.getByTestId("battle-panel").locator('[data-choice-card-id="reward-b"]').click();await a!.getByTestId("battle-panel").getByRole("button",{name:"Hô UNO cho lựa chọn",exact:true}).click();await a!.getByRole("button",{name:"Xác nhận bỏ bài thưởng",exact:true}).click();
  } else {
   await a!.getByRole("button",{name:"Hô UNO",exact:true}).click();await play(a!,"five");
   await expect(a!.getByRole("button",{name:"Đập tay!",exact:true})).toBeEnabled();await a!.getByRole("button",{name:"Đập tay!",exact:true}).click();await b!.getByRole("button",{name:"Đập tay!",exact:true}).click();
  }
  for(const page of group.pages)await expect(page.getByTestId("mini-feedback")).toBeVisible();
  for(const page of group.pages)await expect(page.getByTestId("mini-feedback")).toHaveCount(0,{timeout:8000});
  await play(b!,"draw-red");
  const match=await a!.getByTestId("expanded-screen").getAttribute("data-match-id");
  // Watch from the last action through the result transition, not only after a popup could expire.
  await a!.evaluate(()=>{
   const audit={ended:false,leaked:false};(window as unknown as {endingAudit:typeof audit}).endingAudit=audit;
   const observer=new MutationObserver(()=>{const root=document.querySelector('[data-testid="expanded-screen"]');if(root?.getAttribute('data-status')==='ENDED')audit.ended=true;if(audit.ended&&document.querySelector('[data-testid="mini-feedback"]'))audit.leaked=true;});
   observer.observe(document.body,{childList:true,subtree:true,attributes:true});
  });
  await play(a!,kind==="high-five"?"a-keep":"keep-a");
  for(const page of group.pages)await noMiniPopup(page);
  expect(await a!.evaluate(()=>(window as unknown as {endingAudit:{ended:boolean;leaked:boolean}}).endingAudit)).toEqual({ended:true,leaked:false});
  await a!.screenshot({path:info.outputPath(`finished-after-${kind}.png`)});
  await a!.reload();await noMiniPopup(a!);
  await a!.getByRole("button",{name:"Chơi ván mới",exact:true}).click();
  for(const page of group.pages){await expect(page.getByTestId("expanded-board")).toBeVisible();await expect(page.getByTestId("expanded-screen")).not.toHaveAttribute("data-match-id",match!);await expect(page.getByTestId("mini-feedback")).toHaveCount(0);}
  expect(group.errors).toEqual([]);
 }finally{await group.close();}
});
test("expanded ending: a final High Five wins without opening a new mini-game",async({browser,request})=>{
 await request.post("http://127.0.0.1:5101/scenario/expanded-accept-final-high-five");const group=await joinRoom(browser);
 try{await play(group.pages[0]!,"activate");for(const page of group.pages)await noMiniPopup(page);expect(group.errors).toEqual([]);}finally{await group.close();}
});
