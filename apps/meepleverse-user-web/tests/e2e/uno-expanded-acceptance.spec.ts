import { expect,test } from "@playwright/test";
import { joinRoom } from "./helpers/expanded-room";
import { settledExpanded, playExpandedCard, majorityColor } from "./helpers/expanded-acceptance";
const cases=["swap","tornado","random-number","random-function","multiply","divide","discard-color","wild-discard","seven-left","seven-right","skip-two","target","stack","uno","rapid","final-six","skip","reverse"];
for(const scenario of cases) test(`expanded acceptance: ${scenario} settles across four clients and conserves 202 cards`,async({browser,request},info)=>{
 test.setTimeout(60000);await request.post(`http://127.0.0.1:5101/scenario/expanded-accept-${scenario}`);
 const group=await joinRoom(browser,4);const pages=group.pages,a=pages[0]!;
 try {
  const before=await settledExpanded(pages,202);const color=majorityColor(before[0]!.cards);
  await playExpandedCard(a,before[0]!.cards.find(card=>card.id==='activate')!,before[0]!.cards,scenario!=='uno',{target:scenario==='target'?'Guest3':undefined,rapid:scenario==='rapid'});
  if(scenario.startsWith('random')) for(const page of pages) await expect(page.locator('[data-effect="badge"]')).toContainText(scenario==='random-number'?'Lật Vàng · 3':'Lật +8');
  let after=await settledExpanded(pages,202);expect(after[0]!.revision).toBe(1);
  if(['random-number','random-function','tornado','multiply'].includes(scenario)) {
   const amount=scenario==='random-function'?1:scenario==='multiply'?before[1]!.count:4;
   expect(after[1]!.count).toBe(before[1]!.count+amount);expect(after[0]!.stock).toBe(before[0]!.stock-amount);expect(after[0]!.current).toBe(before[2]!.id);expect(after[0]!.debt).toBe(0);
   if(scenario==='tornado') expect(after[1]!.cards.some(card=>card.id==='storm-stop')).toBe(true);
   if(scenario.startsWith('random')) expect(after[1]!.cards.some(card=>card.id==='random-reveal')).toBe(true);
  } else if(scenario==='swap') {
   expect(after[0]!.cards.map(card=>card.id)).toEqual(before[1]!.cards.map(card=>card.id));
   expect(after[1]!.cards.map(card=>card.id)).toEqual(before[0]!.cards.filter(card=>card.id!=='activate').map(card=>card.id));
   for(const seat of [2,3]) expect(after[seat]!.cards).toEqual(before[seat]!.cards);
   expect(after[0]!.current).toBe(before[1]!.id);expect(after[0]!.color).toBe(color);
   expect(after[0]!.stock).toBe(before[0]!.stock);expect(after[0]!.discards).toBe(before[0]!.discards+1);
  } else if(scenario==='divide') {
   expect(after[0]!.count).toBe(1);expect(after[0]!.stock).toBe(before[0]!.stock+1);expect(after[0]!.discards).toBe(2);
   expect(after[0]!.cards.map(card=>card.id)).toEqual(['keep-b']);
  } else if(scenario==='discard-color'||scenario==='wild-discard') {
   expect(after[0]!.count).toBe(1);expect(after[0]!.discards).toBe(4);expect(after[0]!.top).toBe('activate');expect(after[0]!.current).toBe(before[1]!.id);
   expect(after[1]!.count).toBe(before[1]!.count);expect(after[0]!.stock).toBe(before[0]!.stock);
  } else if(scenario.startsWith('seven-')) {
   const direction=scenario==='seven-left'?1:-1;expect(after[0]!.direction).toBe(String(direction));
   for(let seat=0;seat<4;seat++) {const source=(seat-direction+4)%4;expect(after[seat]!.cards.map(card=>card.id)).toEqual(before[source]!.cards.filter(card=>card.id!=='activate').map(card=>card.id));}
   expect(after[0]!.current).toBe(before[direction===1?1:3]!.id);
  } else if(scenario==='skip-two'||scenario==='skip'||scenario==='reverse') {
   expect(after[0]!.current).toBe(before[scenario==='skip'?2:3]!.id);expect(after[0]!.direction).toBe(scenario==='reverse'?'-1':'1');
   expect(after[0]!.stock).toBe(before[0]!.stock);
  } else if(scenario==='target') {
   expect(after[0]!.current).toBe(before[3]!.id);expect(after[0]!.debt).toBe(4);expect(after[0]!.color).toBe(color);
   await pages[3]!.getByRole('button',{name:'Nhận 4 lá',exact:true}).click();after=await settledExpanded(pages,202);
   expect(after[3]!.count).toBe(before[3]!.count+4);expect(after[0]!.current).toBe(before[0]!.id);
  } else if(scenario==='stack') {
   let previousDebt=2;
   for(const [seat,id,debt] of [[1,'four',6],[2,'six',12],[3,'eight',20],[0,'shield',20]] as const) {
    expect(after[0]!.debt).toBe(previousDebt);
    const held=after[seat]!.cards.find(card=>card.id===id)!;await playExpandedCard(pages[seat]!,held,after[seat]!.cards);after=await settledExpanded(pages,202);expect(after[0]!.debt).toBe(debt);previousDebt=debt;
   }
   expect(after[0]!.current).toBe(before[1]!.id);await expect(pages[1]!.locator('[data-card-id="held-two"]')).toBeDisabled();
   await pages[1]!.getByRole('button',{name:'Nhận 20 lá',exact:true}).click();after=await settledExpanded(pages,202);
   expect(after[1]!.count).toBe(before[1]!.count-1+20);expect(after[0]!.debt).toBe(0);expect(after[0]!.current).toBe(before[2]!.id);
  } else if(scenario==='uno') {
   expect(after[0]!.count).toBe(3);expect(after[0]!.stock).toBe(before[0]!.stock-2);expect(after[0]!.current).toBe(before[1]!.id);
  } else if(scenario==='rapid') {
   expect(after[0]!.count).toBe(before[0]!.count-1);expect(after[0]!.current).toBe(before[1]!.id);expect(after[0]!.color).toBe(color);
  } else if(scenario==='final-six') {
   expect(after[0]!.status).toBe('ENDED');expect(after[1]!.count).toBe(before[1]!.count+6);await expect(a.getByRole('heading',{name:'Bạn thắng rồi!',exact:true})).toBeVisible();
  }
  expect(group.errors).toEqual([]);
  await info.attach('acceptance-transition',{body:JSON.stringify({scenario,before:before.map(v=>({revision:v.revision,count:v.count,stock:v.stock})),after:after.map(v=>({revision:v.revision,count:v.count,stock:v.stock,current:v.current,phase:v.phase}))},null,2),contentType:'application/json'});
 }finally{await group.close();}
});
