import { expect, type Page } from "@playwright/test";
export const colorLabels = { red:"Đỏ", yellow:"Vàng", green:"Xanh lá", blue:"Xanh dương" } as const;
export interface HeldCard { id:string; kind:string; color:string; value:number|null; playable:boolean }
export async function expandedSnapshot(page:Page) {
 return page.evaluate(() => {
  const root=document.querySelector<HTMLElement>('[data-testid="expanded-screen"]')!;
  const cards=Array.from(document.querySelectorAll<HTMLElement>('.expanded-hand-card')).map(card => ({ id:card.dataset.cardId!, kind:card.dataset.cardKind!,
   color:card.querySelector('svg')?.getAttribute('data-card-color') ?? 'wild', value:card.dataset.cardKind==='number' ? Number(card.getAttribute('aria-label')?.split(' · ').at(-1)) : card.dataset.cardKind==='high-five' ? 5 : card.dataset.cardKind?.startsWith('seven-change') ? 7 : null,
   playable:card.dataset.playable==='true' }));
  return { id:root.dataset.selfPlayerId!, revision:Number(root.dataset.revision), match:root.dataset.matchId!, status:root.dataset.status!, phase:root.dataset.phase!, current:root.dataset.currentPlayerId!,
   animating:root.dataset.animating==='true', stock:Number(root.dataset.stockCount), discards:Number(root.dataset.discardCount), count:Number(root.dataset.handCount), debt:Number(root.dataset.pendingDraw),
   color:root.dataset.activeColor, direction:root.dataset.direction, cards,
   top:Array.from(document.querySelectorAll<HTMLElement>('[data-discard-card-id]')).at(-1)?.dataset.discardCardId,
   opponents:Array.from(document.querySelectorAll<HTMLElement>('.expanded-opponent')).map(player => ({id:player.dataset.playerId!,count:Number(player.querySelector('.expanded-opponent-count')?.textContent)})),
   privateChoices:Array.from(document.querySelectorAll<HTMLElement>('[data-choice-card-id]')).map(card => card.dataset.choiceCardId!),
   leakedFaces:document.querySelectorAll('.expanded-opponent .expanded-card-face').length,
   error:document.querySelector('.expanded-error')?.textContent ?? '',
  };
 });
}
export type ExpandedSnapshot = Awaited<ReturnType<typeof expandedSnapshot>>;
export async function settledExpanded(pages:Page[], total?:number) {
 let views:ExpandedSnapshot[]=[];
 await expect.poll(async () => {
  views=await Promise.all(pages.map(expandedSnapshot));
  return views.every(view => !view.animating && view.revision===views[0]!.revision && view.phase===views[0]!.phase && view.status===views[0]!.status);
 }, {timeout:20000, intervals:[50,100,200]}).toBe(true);
 for(const view of views) {
  expect(view.error).toBe(''); expect(view.leakedFaces).toBe(0); expect(view.match).toBe(views[0]!.match);
  for(const key of ['stock','discards','debt','color','direction','current'] as const) expect(view[key],key).toBe(views[0]![key]);
  if(view.status!=='PLAYING') continue;
  expect(view.count).toBe(view.cards.length); expect(view.opponents).toHaveLength(pages.length-1);
  for(const other of views.filter(other=>other.id!==view.id)) {
   expect(view.opponents.find(player=>player.id===other.id)?.count).toBe(other.count);
   const foreign=new Set(other.cards.map(card=>card.id));
   expect([...view.cards.map(card=>card.id),...view.privateChoices].some(id=>foreign.has(id))).toBe(false);
  }
  expect(view.top).toBe(views[0]!.top);
 }
 const ids=views.flatMap(view=>view.cards.map(card=>card.id)); expect(new Set(ids).size).toBe(ids.length);
 if(total!==undefined) expect(views.reduce((sum,view)=>sum+view.count,0)+views[0]!.stock+views[0]!.discards).toBe(total);
 return views;
}
export async function armExpandedUno(page:Page) {
 const button=page.getByRole('button',{name:'Hô UNO',exact:true});
 if(await button.getAttribute('aria-disabled')==='false' && await button.getAttribute('aria-pressed')!=='true') await button.click();
}
export function majorityColor(cards:HeldCard[]) {
 return (Object.keys(colorLabels) as Array<keyof typeof colorLabels>).reduce((best,color) => cards.filter(card=>card.color===color).length>cards.filter(card=>card.color===best).length?color:best,'red');
}
export async function playExpandedCard(page:Page, card:HeldCard, cards:HeldCard[], declareUno=true, options: {target?:string; rapid?:boolean} = {}) {
 await page.locator(`.expanded-hand-card[data-card-id="${card.id}"]`).click();
 if(declareUno) await armExpandedUno(page);
 await page.getByRole('button',{name:/^(Đánh lá bài|Đáp lá bài)$/}).click();
 const coloredUno = card.kind==='discard-color' && cards.filter(held=>held.id!==card.id && held.color!==card.color).length===1;
 if(card.color!=='wild' && !coloredUno) return;
 const dialog=page.getByRole('dialog'); await expect(dialog).toBeVisible();
 if(card.color==='wild') await expect(dialog.getByRole('button',{name:'Xác nhận',exact:true})).toBeDisabled();
 if(card.color==='wild') await dialog.getByRole('button',{name:colorLabels[majorityColor(cards)],exact:true}).click();
 const targets=dialog.locator('.expanded-targets button'); if(await targets.count()) {if(options.target) await dialog.getByRole("button",{name:options.target,exact:true}).click();else await targets.first().click();}
 if(card.kind==='wild-divide-two') {
  const required=Math.floor((cards.length-1)/2);
  const choices=await dialog.locator('[data-choice-card-id]').all();
  for(const choice of choices.slice(0,required)) await choice.click();
 }
 const uno=dialog.locator('.expanded-choice-uno button');
 if(declareUno && await uno.count() && await uno.getAttribute('aria-pressed')!=='true') await uno.click();
 const confirm=dialog.getByRole('button',{name:'Xác nhận',exact:true});
 if(options.rapid) await confirm.evaluate(element=>{(element as HTMLButtonElement).click();(element as HTMLButtonElement).click();}); else await confirm.click();
 await expect(dialog).toHaveCount(0);
}
export async function advanceExpandedUi(pages:Page[], views:ExpandedSnapshot[]) {
 const phase=views[0]!.phase;
 if(phase==='high-five') {
  if(await pages[0]!.getByTestId('high-five-panel').getAttribute('data-stage')==='preparing') {
   await expect(pages[0]!.getByTestId('high-five-panel')).toHaveAttribute('data-stage','active'); return 'high-five:open';
  }
  for(const page of pages) {const button=page.getByRole('button',{name:'Đập tay!',exact:true}); if(await button.isEnabled()) {await button.click();return 'high-five:reply';}}
  throw new Error('No High Five responder');
 }
 if(phase==='battle-select'||phase==='battle-discard') {
  for(const page of pages) {
   const panel=page.getByTestId('battle-panel'),choices=panel.locator('[data-choice-card-id]:not(:disabled)');
   if(!await choices.count()) continue;
   const reward=phase==='battle-discard';
   const text=reward ? await panel.locator('h3').innerText() : '';
   const required=reward ? Number(text.match(/Chọn (\d+)/)?.[1]) : 1;
   if(!required) continue;
   const pick=await choices.all(); for(const choice of pick.slice(0,required)) await choice.click();
   await armExpandedUno(page);
   await panel.getByRole('button',{name:reward?'Xác nhận bỏ bài thưởng':'Chọn lá bài',exact:true}).click();
   return reward?'battle:reward':'battle:select';
  }
  // The server can settle a stage immediately when neither player has an eligible card.
  await expect.poll(async()=> (await expandedSnapshot(pages[0]!)).phase).not.toBe(phase); return 'battle:auto';
 }
 const index=views.findIndex(view=>view.current===view.id); expect(index).toBeGreaterThanOrEqual(0);
 const page=pages[index]!,view=views[index]!, color=majorityColor(view.cards);
 const score=(card:HeldCard)=>card.kind==='wild-discard'||card.kind==='discard-color'?1+view.cards.filter(held=>held.id!==card.id && held.color===(card.color==='wild'?color:card.color)).length:card.kind==='wild-divide-two'?1+Math.floor((view.cards.length-1)/2):1;
 const card=view.cards.filter(card=>card.playable).sort((a,b)=>score(b)-score(a))[0];
 if(card) {await playExpandedCard(page,card,view.cards);return 'play:'+card.kind;}
 await page.getByRole('button',{name:phase==='draw-stack'?`Nhận ${view.debt} lá`:phase==='drawn'?'Bỏ lượt':'Bốc bài',exact:true}).click();
 return phase==='draw-stack'?'accept-debt':phase==='drawn'?'pass':'draw';
}
