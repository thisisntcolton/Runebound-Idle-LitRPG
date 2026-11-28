export const DRINK_MS=2000, COMBAT_MS=10000;
export function waterCapacity(bucket:boolean,tier=0){return (bucket?20:0)+([0,5,10,20,40][tier]??0);}
export function collectWater(current:number,capacity:number){return Math.max(0,Math.min(5,capacity-current));}
export function canDrink(thirst:number,now:number,ready:number,combatUntil:number){return thirst<100&&now>=ready&&now>=combatUntil;}
