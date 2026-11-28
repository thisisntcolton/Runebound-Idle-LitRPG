export const RIVERHAVEN=9;
export const residents=[{id:1,x:105,y:248},{id:3,x:253,y:175},{id:18,x:270,y:350},{id:68,x:155,y:285},{id:8,x:100,y:410},{id:70,x:240,y:410}];
export const buildings=[{x:30,y:150,w:70,h:60,name:'Cottages'},{x:210,y:112,w:72,h:45,name:'Forge'},{x:30,y:345,w:76,h:45,name:'Tavern'},{x:100,y:190,w:42,h:28,name:'Bakery'},{x:155,y:190,w:42,h:28,name:'Market'},{x:205,y:300,w:45,h:28,name:'Fishmonger'}];
export function villageBlocked(x:number,y:number){return (x>290&&!(y>=240&&y<=278))||buildings.some(b=>x>b.x-4&&x<b.x+b.w+4&&y>b.y+b.h*.45&&y<b.y+b.h+4);}
