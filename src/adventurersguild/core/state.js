import {classes,items} from '../data/content.js';
export const KEY='adventurersguild-save-v1';
export function hero(type,id){return {id,type,name:['Rowan','Seren','Kael','Lyra','Mira'][Object.keys(classes).indexOf(type)],level:1,xp:0,hp:100,gear:{}};}
export function fresh(){return {version:1,gold:150,reputation:0,heroes:[hero('Fighter',1),hero('Cleric',2),hero('Ranger',3)],party:[1,2,3],inventory:[],buildings:{Hall:1,Temple:1,Blacksmith:1},run:null,lastSeen:0};}
export function stats(h){const a=classes[h.type].stats;return {max:50+a[2]*3+h.level*8,attack:8+Math.max(a[0],a[1],a[3],a[4])+h.level*2+(items[h.gear.weapon]?.bonus||0),def:Math.floor(a[2]/2)+(items[h.gear.armor]?.bonus||0),speed:a[1],attributes:a};}
export function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s?.version===1&&Array.isArray(s.heroes)&&Array.isArray(s.party)&&s.heroes.every(h=>classes[h.type]))return s;}catch{}return {...fresh(),gold:0,heroes:[],party:[],tutorial:{stage:'create'}};}
export function save(s){s.lastSeen=Date.now();localStorage.setItem(KEY,JSON.stringify(s));}
