import {sheet,hpOf,setHP,xpThresholds} from './rules.js';
import {spellList,slots,slotMax} from './spells.js';
import {classes,items} from '../data/content.js';
export const KEY='adventurersguild-save-v1';
export function hero(type,id){return {id,type,name:['Rowan','Seren','Kael','Lyra','Mira'][Object.keys(classes).indexOf(type)],level:1,xp:0,scores:classes[type].stats.slice(),hp:100,gear:{}};}
export function fresh(){return {version:1,stabilityVersion:2,gold:150,reputation:0,heroes:[hero('Fighter',1),hero('Cleric',2),hero('Ranger',3)],party:[1,2,3],inventory:[],buildings:{Hall:1,Temple:1,Blacksmith:1},run:null,lastSeen:0};}
export function stats(h){const a=classes[h.type].stats;return {max:50+a[2]*3+h.level*8,attack:8+Math.max(a[0],a[1],a[3],a[4])+h.level*2+(items[h.gear.weapon]?.bonus||0),def:Math.floor(a[2]/2)+(items[h.gear.armor]?.bonus||0),speed:a[1],attributes:a};}
export function migrate(s){for(const h of s.heroes){h.scores??=classes[h.type].stats.slice();h.gear??={};if(!s.stabilityVersion)h.xp=(xpThresholds[h.level-1]||0)+h.xp;setHP(h,h.dead?0:hpOf(h));}const b=s.run?.battle;if(b){b.time??=0;for(const u of b.units){u.pos??=u.side?15:0;u.move??=30;u.range??=5;if(!u.side){const h=s.heroes.find(h=>h.id===u.id);if(h){const t=sheet(h);Object.assign(u,{attack:t.attack,ac:t.ac,dice:t.dice,damage:t.damage,weapon:t.weapon,range:t.range});u.slots??=slots(h);u.spells??=spellList(h);u.slotMax??=slotMax(h);u.spellMod??=t.m[h.type==='Wizard'?3:4];u.pb??=t.p;u.level??=h.level;u.success??=0;u.fail??=0;}}}}s.stabilityVersion=2;return s;}
export function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s?.version===1&&Array.isArray(s.heroes)&&Array.isArray(s.party)&&s.heroes.every(h=>classes[h.type]))return migrate(s);}catch{}return {...fresh(),gold:0,heroes:[],party:[],tutorial:{stage:'create'}};}
export function save(s){s.lastSeen=Date.now();localStorage.setItem(KEY,JSON.stringify(s));}
