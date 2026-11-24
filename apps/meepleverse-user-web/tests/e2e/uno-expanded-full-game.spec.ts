import { expect, test } from "@playwright/test";
import { joinRoom } from "./helpers/expanded-room";
import { expandedSnapshot, settledExpanded, advanceExpandedUi } from "./helpers/expanded-acceptance";
for(const seed of [17,21]) test(`expanded acceptance: public catalog, code and invites lead four browsers through full games and rematch (seed ${seed})`, async ({browser,request},info)=>{
 test.setTimeout(240000);
 await request.post(`http://127.0.0.1:5101/scenario/expanded-full-${seed}`);
 const group=await joinRoom(browser,4,{discover:true,joinByCode:true});const pages=group.pages,host=pages[0]!;const actions:Record<string,number>={};let reconnects=0,steps=0;
 try {
  for(const [i,page] of pages.entries()) {await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize([{width:1440,height:900},{width:1366,height:768},{width:768,height:1024},{width:375,height:812}][i]!);}
  let views=await settledExpanded(pages,202); const match=views[0]!.match;
  for(const view of views) expect(view.cards).toHaveLength(7);
  await host.screenshot({path:info.outputPath('start.png')});
  while(views[0]!.status==='PLAYING' && steps<140) {
   if(steps===3) {
    const page=pages[1]!,before=views[1]!,url=page.url();
    await page.goto('about:blank');
    await expect(host.locator('.expanded-turn-strip')).toContainText('Tạm dừng');
    await page.goto(url);await expect(page.getByTestId('expanded-board')).toBeVisible();
    await expect(host.locator('.expanded-turn-strip')).not.toContainText('Tạm dừng');
    const restored=await expandedSnapshot(page);expect(restored.id).toBe(before.id);expect(restored.match).toBe(match);expect(restored.cards.map(card=>card.id)).toEqual(before.cards.map(card=>card.id));
    views=await settledExpanded(pages,202);reconnects++;
   }
   const revision=views[0]!.revision;
   const action=await advanceExpandedUi(pages,views);actions[action]=(actions[action]??0)+1;steps++;
   await expect.poll(async()=>Number(await host.getByTestId('expanded-screen').getAttribute('data-revision'))).toBeGreaterThan(revision);
   views=await settledExpanded(pages,202);
  }
  expect(steps).toBeLessThan(140);expect(views[0]!.status).toBe('ENDED');expect(reconnects).toBe(1);
  for(const page of pages) await expect(page.getByRole('region',{name:'Kết quả ván'})).toBeVisible();
  const scores=await Promise.all(pages.map(page=>page.locator('.expanded-result-score').innerText()));expect(new Set(scores).size).toBe(1);
  const tables=await Promise.all(pages.map(page=>page.getByRole('list',{name:'Điểm bài còn lại'}).innerText()));expect(new Set(tables).size).toBe(1);
  const winners=await Promise.all(pages.map(page=>page.getByRole('heading',{name:'Bạn thắng rồi!',exact:true}).count()));expect(winners.reduce((sum,n)=>sum+n,0)).toBe(1);
  await host.screenshot({path:info.outputPath('result.png')});
  await host.getByRole('button',{name:'Chơi ván mới',exact:true}).click();
  for(const page of pages) {await expect(page.getByTestId('expanded-board')).toBeVisible();await expect(page.getByTestId('expanded-screen')).not.toHaveAttribute('data-match-id',match);}
  const next=await settledExpanded(pages,202);for(const view of next){expect(view.revision).toBe(0);expect(view.count).toBe(7);}
  expect(group.errors).toEqual([]);
 } finally {
  await info.attach('expanded-full-game-summary',{body:JSON.stringify({seed,players:4,totalCards:202,steps,actions,reconnects,pageErrors:group.errors},null,2),contentType:'application/json'});
  await group.close();
 }
});
