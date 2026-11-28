export const RIVERHAVEN=9;
export const residents=[{id:1,x:112,y:235},{id:3,x:245,y:180},{id:18,x:265,y:345},{id:68,x:180,y:290},{id:8,x:100,y:415},{id:70,x:265,y:420}];
export const buildings=[{x:30,y:120,w:70,h:65,name:'Cottages',art:'hut3'},{x:210,y:105,w:72,h:65,name:'Forge',art:'smith'},{x:30,y:340,w:76,h:65,name:'Tavern',art:'hall'},{x:100,y:180,w:42,h:42,name:'Bakery',art:'market'},{x:155,y:180,w:42,h:42,name:'Market',art:'market'},{x:205,y:290,w:45,h:45,name:'Fishmonger',art:'market'}];
export const venues=[...buildings.filter(b=>b.name!=='Cottages').map(b=>({name:b.name,x:b.x+b.w/2,y:b.y+b.h+10})),{name:'Docks',x:273,y:420},{name:'Notice Board',x:135,y:330},{name:'Village Gate',x:25,y:260}];
export function villageBlocked(x:number,y:number){return (x>290&&!(y>=240&&y<=278))||buildings.some(b=>x>b.x-4&&x<b.x+b.w+4&&y>b.y+b.h*.45&&y<b.y+b.h+4);}
export const fishPrices:Record<string,number>={Common:5,Uncommon:15,Rare:50,Exotic:150,Legendary:1000,Mythic:10000};
export function tradeAmount(owned:number,gold:number,budget:number,price:number,quantity:number,buy:boolean){if(![owned,gold,budget,price,quantity].every(Number.isSafeInteger)||Math.min(owned,gold,budget)<0||price<=0||quantity<=0)return 0;return Math.min(quantity,buy?Math.floor(gold/price):Math.min(owned,Math.floor(budget/price)));}
