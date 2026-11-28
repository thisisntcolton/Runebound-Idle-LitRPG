export function fishingTiming(level:number, random=Math.random()) {
 const n=Math.max(0,Math.min(98,level-1));
 return {wait:(4000+6000*Math.max(0,Math.min(1,random)))/(1+n*.0025),window:3000+n*10};
}
export function fishingPhase(now:number,bite:number,end:number){return now>=end?'missed':now>=bite?'hooked':now>=bite-650?'nibble':'waiting';}
