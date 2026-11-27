export const resources = ['wood','stone','iron','food'] as const;
export type Resource = typeof resources[number];
export type Stock = Record<Resource,number>;
export const empty = ():Stock => ({wood:0,stone:0,iron:0,food:0});
export const nodes = {wood:{hp:5,yield:3,respawn:900000,action:'CHOP'},stone:{hp:8,yield:3,respawn:1500000,action:'MINE'},iron:{hp:12,yield:2,respawn:2700000,action:'MINE'},food:{hp:3,yield:2,respawn:600000,action:'GATHER'}};
export const buildings = {hut:{wood:300},stockpile:{wood:500},yard:{wood:100},mill:{wood:750,stone:150},quarry:{wood:500,stone:500},farm:{wood:600,stone:100},tower:{wood:800,stone:600},barracks:{wood:1500,stone:750,iron:100},smith:{wood:1000,stone:1500,iron:250},hall:{wood:5000,stone:3000,iron:500},fortress:{wood:15000,stone:20000,iron:5000}} satisfies Record<string,Partial<Stock>>;
export type Building=keyof typeof buildings;
export const affordable=(s:Stock,c:Partial<Stock>)=>resources.every(r=>s[r]>=(c[r]??0));
export function spend(s:Stock,c:Partial<Stock>){if(!affordable(s,c))return false;for(const r of resources)s[r]-=c[r]??0;return true;}
export const costText=(c:Partial<Stock>)=>resources.filter(r=>c[r]).map(r=>`${c[r]} ${r}`).join(' + ');
export const tiers=['Crude','Stone','Iron','Steel','Orcish Forged','Mithril','Adamantite'];
export const toolName=(l:number)=>`${tiers[Math.floor((l-1)/10)]} ${((l-1)%10)+1}`;
// Continuous progression shared by axe and pickaxe. Tier gates remain intact.
export function toolCost(l:number):Partial<Stock>|null {
 if(l>=70)return null;
 const tier=Math.floor(l/10);
 return {wood:Math.round(150*1.5**Math.min(l-1,8)*1.12**Math.max(0,l-9)),...(tier>=1?{stone:100*(l-9)}:{}),...(tier>=2?{iron:50*(l-19)}:{})};
}
// Fixed node health and yield; upgrades affect cadence only, capped at 3x.
export const efficiency=(l:number)=>Math.min(3,1+Math.max(0,l-1)*0.05);
export const damage=(_l:number,_hp:number)=>1;
export const cooldown=(l:number)=>Math.ceil(1000/efficiency(l));
export const bonusYield=(_l:number)=>0;
