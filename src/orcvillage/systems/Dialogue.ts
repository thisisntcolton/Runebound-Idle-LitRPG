/** Pure dialogue evaluation. Content contains data only; game state is supplied by the caller. */
export type DialogueCondition =
 | {kind:'flag'; id:string; value:boolean}
 | {kind:'completed'; id:string; value:boolean}
 | {kind:'relationship'; minimum:number}
 | {kind:'story'; field:'fire'|'urga'|'hall'|'huts'; minimum:number}
 | {kind:'quest'; minimum:number}
 | {kind:'resource'; resource:'wood'|'stone'|'iron'|'food'; minimum:number};
export type DialogueEffect = {kind:'flag'; id:string; value:boolean};
export interface DialogueResponse {id:string; text:string; next?:string; conditions?:DialogueCondition[]; effects?:DialogueEffect[]; action?:'merchant'}
export interface DialogueNode {id:string; speaker:'npc'|'gruk'; text:string; responses:DialogueResponse[]}
export interface DialogueDefinition {id:string; npc:string; priority:number; once:boolean; entry:string; conditions?:DialogueCondition[]; nodes:DialogueNode[]}
export interface NarrativeState {flags:Record<string,boolean>; completed:Record<string,boolean>; history:string[]}
export interface DialogueContext {state:NarrativeState; relationship:number; story:{fire:boolean;urga:boolean;hall:number;huts:number}; quest:number; resources:Record<'wood'|'stone'|'iron'|'food',number>}
export function freshNarrative():NarrativeState{return {flags:{},completed:{},history:[]};}
export function restoreNarrative(value:unknown):NarrativeState {
 const v=value && typeof value==='object' && !Array.isArray(value)?value as Partial<NarrativeState>:{};
 const flags=(x:unknown):Record<string,boolean>=>Object.fromEntries(x&&typeof x==='object'&&!Array.isArray(x)?Object.entries(x).filter(([k,v])=>k.length<=100&&v===true):[]);
 return {flags:flags(v.flags),completed:flags(v.completed),history:Array.isArray(v.history)?v.history.filter((x):x is string=>typeof x==='string'&&x.length<=100).slice(-200):[]};
}
export function matches(conditions:DialogueCondition[]|undefined,c:DialogueContext):boolean{return (conditions??[]).every(x=>{switch(x.kind){case 'flag':return !!c.state.flags[x.id]===x.value;case 'completed':return !!c.state.completed[x.id]===x.value;case 'relationship':return c.relationship>=x.minimum;case 'quest':return c.quest>=x.minimum;case 'resource':return c.resources[x.resource]>=x.minimum;case 'story':return Number(c.story[x.field])>=x.minimum;default:return false;}});}
export function chooseDialogue(defs:DialogueDefinition[],npc:string,c:DialogueContext){return defs.filter(d=>d.npc===npc&&(!d.once||!c.state.completed[d.id])&&matches(d.conditions,c)).sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id))[0];}
export function available(node:DialogueNode,c:DialogueContext){return node.responses.filter(r=>matches(r.conditions,c));}
export function applyResponse(def:DialogueDefinition,nodeId:string,responseId:string,c:DialogueContext):{next?:string;action?:'merchant'}|null{
 if(def.once&&c.state.completed[def.id])return null;const node=def.nodes.find(n=>n.id===nodeId),response=node&&available(node,c).find(r=>r.id===responseId);if(!response)return null;
 for(const effect of response.effects??[])if(effect.kind==='flag')c.state.flags[effect.id]=effect.value;
 if(!response.next){c.state.completed[def.id]=true;if(!c.state.history.includes(def.id))c.state.history.push(def.id);c.state.history=c.state.history.slice(-200);}
 return {next:response.next,action:response.action};
}
export function validateDialogue(defs:DialogueDefinition[]):string[]{
 const errors:string[]=[],ids=new Set<string>();
 const id=(x:unknown):x is string=>typeof x==='string'&&/^[a-zA-Z0-9._:-]{1,100}$/.test(x);
 const obj=(x:unknown):x is Record<string,any>=>!!x&&typeof x==='object'&&!Array.isArray(x);
 if(!Array.isArray(defs))return ['Definitions must be an array'];
 for(const raw of defs as unknown[]){
  if(!obj(raw)){errors.push('Invalid dialogue definition');continue;}
  const d=raw,label=String(d.id??'?');
  if(!id(d.id)||ids.has(d.id))errors.push(label+': invalid or duplicate dialogue ID');else ids.add(d.id);
  if(!(d.npc==='urga'||(typeof d.npc==='string'&&/^(?:[1-9]|[1-9][0-9]|100)$/.test(d.npc))))errors.push(label+': invalid NPC');
  if(!Number.isFinite(d.priority)||typeof d.once!=='boolean'||!id(d.entry))errors.push(label+': invalid metadata');
  const check=(value:unknown)=>{if(value===undefined)return;if(!Array.isArray(value)){errors.push(label+': invalid conditions');return;}for(const c of value){if(!obj(c)){errors.push(label+': invalid condition');continue;}const num=typeof c.minimum==='number'&&Number.isFinite(c.minimum)&&c.minimum>=0;switch(c.kind){case 'flag':case 'completed':if(!id(c.id)||typeof c.value!=='boolean')errors.push(label+': invalid flag condition');break;case 'relationship':if(!num||c.minimum>100)errors.push(label+': invalid relationship');break;case 'quest':if(!num||!Number.isInteger(c.minimum)||c.minimum>10)errors.push(label+': invalid quest');break;case 'story':if(!['fire','urga','hall','huts'].includes(c.field)||!num||!Number.isInteger(c.minimum)||(c.field==='fire'||c.field==='urga')&&c.minimum>1||c.field==='hall'&&c.minimum>5)errors.push(label+': invalid story condition');break;case 'resource':if(!['wood','stone','iron','food'].includes(c.resource)||!num||!Number.isSafeInteger(c.minimum))errors.push(label+': invalid resource');break;default:errors.push(label+': unsupported condition');}}};
  check(d.conditions);if(!Array.isArray(d.nodes)||!d.nodes.length){errors.push(label+': invalid nodes');continue;}
  const nodes=new Map<string,Record<string,any>>();
  for(const n of d.nodes){if(!obj(n)){errors.push(label+': invalid node');continue;}if(!id(n.id)||nodes.has(n.id)){errors.push(label+': invalid or duplicate node');continue;}nodes.set(n.id,n);if(!['npc','gruk'].includes(n.speaker)||typeof n.text!=='string'||!n.text.trim()||!Array.isArray(n.responses)||!n.responses.length){errors.push(label+': invalid node '+n.id);continue;}const responseIds=new Set<string>();for(const r of n.responses){if(!obj(r)){errors.push(label+': invalid response');continue;}if(!id(r.id)||responseIds.has(r.id)||typeof r.text!=='string'||!r.text.trim())errors.push(label+': invalid response');responseIds.add(r.id);if(r.next!==undefined&&!id(r.next))errors.push(label+': invalid next');if(r.action!==undefined&&(r.action!=='merchant'||r.next!==undefined||!['1','3','18','8'].includes(d.npc)))errors.push(label+': invalid action');check(r.conditions);if(r.effects!==undefined&&!Array.isArray(r.effects))errors.push(label+': invalid effects');else for(const e of r.effects??[])if(!obj(e)||e.kind!=='flag'||!id(e.id)||typeof e.value!=='boolean')errors.push(label+': invalid effect');}}
  if(!nodes.has(d.entry))errors.push(label+': missing entry');
  const seen=new Set<string>(),visiting=new Set<string>(),terminates=new Set<string>();
  const walk=(key:string)=>{if(visiting.has(key)){errors.push(label+': dialogue loop');return false;}if(seen.has(key))return terminates.has(key);const node=nodes.get(key);if(!node){errors.push(label+': missing node '+key);return false;}seen.add(key);visiting.add(key);let terminal=false;for(const r of Array.isArray(node.responses)?node.responses:[]){if(!obj(r))continue;if(r.next===undefined)terminal=true;else if(typeof r.next==='string'&&walk(r.next))terminal=true;}visiting.delete(key);if(terminal)terminates.add(key);else errors.push(label+': no terminal path from '+key);return terminal;};
  if(typeof d.entry==='string'&&nodes.has(d.entry))walk(d.entry);for(const key of nodes.keys())if(!seen.has(key))errors.push(label+': unreachable node '+key);
 }
 return errors;
}
/** In-memory sessions restart at the entry after interruption. Applied flags persist. */
export interface DialogueSession {definition:DialogueDefinition; node:string; revision:number; closed:boolean}
export function startDialogue(definition:DialogueDefinition,c:DialogueContext):DialogueSession|null {
 if ((definition.once&&c.state.completed[definition.id])||!matches(definition.conditions,c)||!definition.nodes.some(n=>n.id===definition.entry)) return null;
 return {definition,node:definition.entry,revision:0,closed:false};
}
export function advanceDialogue(session:DialogueSession,expectedRevision:number,responseId:string,c:DialogueContext):{next?:string;action?:'merchant'}|null {
 if(session.closed||session.revision!==expectedRevision)return null;
 const result=applyResponse(session.definition,session.node,responseId,c);if(!result)return null;
 session.revision++;if(result.next)session.node=result.next;else session.closed=true;return result;
}
export function closeDialogue(session:DialogueSession){session.closed=true;session.revision++;}
