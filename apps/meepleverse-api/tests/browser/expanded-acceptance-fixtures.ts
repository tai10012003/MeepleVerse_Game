import type { UnoExpandedCard as Card } from "@meepleverse/contracts/uno-expanded";
import { createExpandedDeck, type UnoExpandedGame } from "../../src/modules/games/uno-expanded/index.js";
export const ACCEPTANCE_CASES = ["tornado","random-number","random-function","multiply","divide","discard-color","wild-discard","seven-left","seven-right","skip-two","target","stack","uno","rapid","final-six","skip","reverse"] as const;
export const ACCEPTANCE_SCENARIOS = ACCEPTANCE_CASES.map(name => "expanded-accept-"+name);
/** Test-only arrangements use all 198 real card faces; nothing enters production bootstraps. */
export function expandedAcceptanceFixture(ids:readonly string[],scenario:string):UnoExpandedGame {
 const name=scenario.replace("expanded-accept-","");
 if(!ACCEPTANCE_CASES.includes(name as typeof ACCEPTANCE_CASES[number])) throw new Error("Unknown acceptance fixture");
 const deck=createExpandedDeck().map((card,i)=>({...card,id:"pool-"+i}));
 function take(id:string,kind:Card["kind"],color?:Card["color"],value?:number):Card {
  const index=deck.findIndex(card=>card.kind===kind && (color===undefined||card.color===color) && (value===undefined||"value" in card&&card.value===value));
  if(index<0) throw new Error(`Unavailable fixture card: ${id}/${kind}/${color}/${value}`);
  return {...deck.splice(index,1)[0]!,id} as Card;
 }
 const number=(id:string,color:Exclude<Card["color"],null>="red",value=1)=>take(id,"number",color,value);
 const black=(id:string,kind:Card["kind"])=>take(id,kind,null);
 const top=number("top",name==="seven-right"?"blue":"red",5);
 let activation:Card;
 switch(name) {
  case "tornado":activation=take("activate","tornado","red");break;
  case "random-number":case "random-function":activation=black("activate","wild-random");break;
  case "multiply":activation=black("activate","wild-multiply-two");break;
  case "divide":activation=black("activate","wild-divide-two");break;
  case "discard-color":activation=take("activate","discard-color","red");break;
  case "wild-discard":activation=black("activate","wild-discard");break;
  case "seven-left":activation=take("activate","seven-change-left","red");break;
  case "seven-right":activation=take("activate","seven-change-right","blue");break;
  case "skip-two":activation=take("activate","skip-two","red");break;
  case "target":activation=black("activate","wild-target-four");break;
  case "stack":activation=take("activate","draw-two","red");break;
  case "uno":activation=number("activate","red",6);break;
  case "final-six":activation=black("activate","wild-draw-six");break;
  case "skip":case "reverse":activation=take("activate",name,"red");break;
  default:activation=black("activate","wild");
 }
 const hands:Card[][]=[[activation,number("keep-a","blue",1),number("keep-b","green",2)],[],[],[]];
 const prefix:Card[]=[];
 if(name==="discard-color"||name==="wild-discard") {
  deck.push(hands[0]![2]!);
  hands[0]=[activation,number("side-number","red",6),take("side-skip","skip","red"),hands[0]![1]!];
 }
 if(name==="uno") {deck.push(hands[0]!.pop()!);}
 if(name==="final-six") {deck.push(...hands[0]!.splice(1));}
 if(name==="stack") {
  hands[0]!.push(black("shield","wild-shield"));
  hands[1]=[black("four","wild-draw-four"),take("held-two","draw-two","blue")];
  hands[2]=[black("six","wild-draw-six")];hands[3]=[black("eight","wild-draw-eight")];
 }
 const sizes=name.startsWith("seven-")?[3,3,4,5]:name==="stack"?[4,4,3,3]:[hands[0]!.length,2,2,2];
 for(let seat=1;seat<ids.length;seat++) {
  while(hands[seat]!.length<sizes[seat]!) hands[seat]!.push(take(`${seat}-held-${hands[seat]!.length}`,"number"));
 }
 if(name==="tornado") prefix.push(number("storm-first","green",1),black("storm-wild","wild"),number("storm-third","blue",6),number("storm-stop","red",4));
 if(name==="random-number") prefix.push(number("random-reveal","yellow",3),number("random-extra-1","green",1),number("random-extra-2","blue",3),number("random-extra-3","yellow",2));
 if(name==="random-function") prefix.push(black("random-reveal","wild-draw-eight"));
 const game:UnoExpandedGame={gameId:"uno-expanded",rulesVersion:"uno-expanded-v1",revision:0,phase:"turn",players:ids.map((id,i)=>({id,hand:hands[i]!})),dealerIndex:ids.length-1,currentIndex:0,direction:1,
  activeColor:top.color!,drawPile:[...prefix,...deck].reverse(),discardPile:[top],drawnCardId:null,pendingDraw:0,blockedTurns:0,result:null,effectSequence:0,effect:null};
 const all=[...game.drawPile,...game.discardPile,...game.players.flatMap(player=>player.hand)];
 if(all.length!==198||new Set(all.map(card=>card.id)).size!==198) throw new Error("Acceptance fixture lost physical cards");
 return game;
}
