import {Resource,Stock,spend} from './Economy';
export const skills=['Woodcutting','Mining','Hunting','Combat','Leatherworking','Smithing','Construction','Cooking','Fishing'] as const;
export type Skill=typeof skills[number];
export const threshold=(level:number)=>Math.round(10000000*Math.pow((level-1)/98,3.5));
export function level(xp:number){let l=1;while(l<99&&xp>=threshold(l+1))l++;return l;}
export const gear=[
 {id:'hood',name:'Leather Hood',slot:'head',leather:8,wood:10,iron:0,armor:2,skill:'Leatherworking'},
 {id:'chest',name:'Leather Chestplate',slot:'chest',leather:20,wood:25,iron:0,armor:5,skill:'Leatherworking'},
 {id:'legs',name:'Leather Leggings',slot:'legs',leather:15,wood:20,iron:0,armor:4,skill:'Leatherworking'},
 {id:'boots',name:'Leather Boots',slot:'feet',leather:10,wood:10,iron:0,armor:2,skill:'Leatherworking'},
 {id:'gloves',name:'Leather Gloves',slot:'hands',leather:6,wood:10,iron:0,armor:1,skill:'Leatherworking'},
 {id:'belt',name:'Leather Belt',slot:'waist',leather:5,wood:5,iron:0,armor:1,skill:'Leatherworking'},
 {id:'club',name:'Crude Club',slot:'weapon',leather:0,wood:25,iron:0,armor:0,skill:'Smithing'},
 {id:'sword',name:'Iron Sword',slot:'weapon',leather:5,wood:20,iron:30,armor:0,skill:'Smithing'},
 {id:'battleaxe',name:'Iron Battle Axe',slot:'weapon',leather:8,wood:40,iron:50,armor:0,skill:'Smithing'},
 {id:'shield',name:'Wooden Shield',slot:'offhand',leather:5,wood:75,iron:10,armor:3,skill:'Smithing'},
] as const;
export interface Recruit {id:number;name:string;rarity:string;job:Resource;trait:string;relationship:number}
export interface Progression {xp:Partial<Record<Skill,number>>;owned:string[];equipped:Record<string,string>;discoveries:string[];recruits:Recruit[];visitor?:Recruit;nextVisitor:number;era:number}
export function freshProgression():Progression{return {xp:{},owned:[],equipped:{},discoveries:[],recruits:[],nextVisitor:Date.now()+1800000,era:1};}
export function restoreProgression(raw?:Progression):Progression{const p=freshProgression();if(!raw)return p;for(const s of skills){const x=raw.xp?.[s];if(typeof x==='number'&&Number.isFinite(x))p.xp[s]=Math.max(0,Math.min(10000000,x));}p.owned=gear.filter(g=>raw.owned?.includes(g.id)).map(g=>g.id);for(const g of gear)if(p.owned.includes(g.id)&&raw.equipped?.[g.slot]===g.id)p.equipped[g.slot]=g.id;if(p.equipped.weapon==='battleaxe')delete p.equipped.offhand;p.discoveries=Array.isArray(raw.discoveries)?raw.discoveries.filter(x=>typeof x==='string').slice(0,500):[];p.recruits=Array.isArray(raw.recruits)?raw.recruits.filter(r=>r&&typeof r.name==='string'&&['wood','stone','iron','food'].includes(r.job)):[];p.visitor=raw.visitor;p.nextVisitor=Number.isFinite(raw.nextVisitor)?raw.nextVisitor:p.nextVisitor;p.era=Math.max(1,Math.min(3,Math.floor(raw.era||1)));return p;}
export function equip(p:Progression,id:string){const g=gear.find(g=>g.id===id);if(!g||!p.owned.includes(id))return;if(p.equipped[g.slot]===id){delete p.equipped[g.slot];return;}if(id==='shield'&&p.equipped.weapon==='battleaxe')delete p.equipped.weapon;if(id==='battleaxe')delete p.equipped.offhand;p.equipped[g.slot]=id;}
export function armor(p:Progression){return gear.reduce((a,g)=>a+(p.equipped[g.slot]===g.id?g.armor:0),0);}
export function weapon(p:Progression){return p.equipped.weapon==='sword'?{damage:12,interval:900,stamina:3}:p.equipped.weapon==='battleaxe'?{damage:24,interval:1600,stamina:5}:p.equipped.weapon==='club'?{damage:5,interval:1000,stamina:2}:{damage:5,interval:1000,stamina:2};}
export function visitor(now:number):Recruit{const r=Math.random(),rarity=r<.0005?'Legendary':r<.005?'Epic':r<.03?'Rare':r<.15?'Uncommon':'Common';return {id:now,name:rarity==='Legendary'?'Gromm Ironhand':['Krag','Morga','Thrak','Vasha','Brok'][Math.floor(Math.random()*5)]+' '+['Oakbreaker','Stonehand','Ashwalker','Ironroot'][Math.floor(Math.random()*4)],rarity,job:'wood',trait:rarity==='Common'?'Steady':rarity==='Legendary'?'Ancestral knowledge':'Hardworking',relationship:0};}
