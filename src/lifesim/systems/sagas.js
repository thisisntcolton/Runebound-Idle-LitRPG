import { SAGAS } from '../data/sagas.js';
import { state,clampStat } from '../core/state.js';
import { saveGame } from '../core/save.js';
import { npc } from './life.js';
import { addLog } from './lifecycle.js';
export function journal(c){return c.journal??={arcs:{},history:[],paths:{}};}
export function eligible(c,s){return !c.paths?.sentence&&c.age>=s[2]&&(s[0]!=='legacy'||state.dynasty.generation>1);}
export function startSaga(id){const c=state.character,s=SAGAS.find(x=>x[0]===id);if(!c?.alive||!s||!eligible(c,s)||c.encounter||state.pendingEvents.length||journal(c).arcs[id])return false;const n=npc(c,'Story contact',Math.max(12,c.age+2),60,s[3]);journal(c).arcs[id]={step:0,due:c.year,npc:n.id,choices:[]};return openSaga(id);}
export function openSaga(id){const c=state.character,a=c&&journal(c).arcs[id],s=SAGAS.find(x=>x[0]===id);if(!c?.alive||c.paths?.sentence||!a||!s||a.step>=s[4].length||a.due>c.year||c.encounter||state.pendingEvents.length)return false;c.encounter={kind:'saga',saga:id,label:s[1]};saveGame();return true;}
export function sagaScene(c){const s=SAGAS.find(x=>x[0]===c.encounter.saga),a=journal(c).arcs[s[0]],r=s[4][a.step],n=c.life.people.find(x=>x.id===a.npc);const prior=a.choices.length?s[4][a.step-1][4+a.choices.at(-1)]+' ':'';return {speaker:n?.status==='deceased'?'Your memories':s[3],text:prior+r[1],options:[[r[2]],[r[3]]]};}
export function chooseSaga(i){const c=state.character;if(![0,1].includes(i)||c?.encounter?.kind!=='saga')return;const s=SAGAS.find(x=>x[0]===c.encounter.saga),j=journal(c),a=j.arcs[s[0]],r=s[4][a.step],n=c.life.people.find(x=>x.id===a.npc);a.choices.push(i);const memory={year:c.year,age:c.age,title:r[0],choice:r[2+i],result:r[4+i],npc:a.npc};j.history.push(memory);if(n){(n.memories??=[]).push(memory);if(n.status==='alive')n.score=clampStat(n.score+(i===0?5:1));}if(s[0]==='crowd'&&a.step===1&&i===0)c.flags.underground=true;a.step++;a.due=c.year+3+a.step*2;c.stats.happiness=clampStat(c.stats.happiness+1);addLog(s[1]+': '+memory.result);c.encounter=null;saveGame();}
