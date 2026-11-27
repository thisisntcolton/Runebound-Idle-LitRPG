import { SaveSystem } from '../systems/SaveSystem';
const panels = [
 ['The builders of Ironwood','For generations, the Blackroot Tribe lived beneath the ancient trees of Ironwood Forest. They were not conquerors. They were builders.'],
 ['The night of ashes','Then the fire came. By dawn, the halls were burned, the stockpiles were ash, and the tribe had scattered. No one knew why.'],
 ['Meet Gruk','Months later, one Orc returns. Not a warrior. Not a chieftain. Just Gruk, a broken axe, and a stubborn hope. If Blackroot is to rise again, he must build it himself.'],
 ['An axe and a little hope','Use the joystick to walk near a tree. Tap CHOP until it falls. Return to the campfire and tap DEPOSIT to store your wood. On a keyboard, use WASD or arrows and Space.'],
 ['Your first quest: A place to sleep','Restore the campfire for 10 wood, then rebuild a hut for 25 wood. Stand near camp and open CAMP MENU → Story to build. A hut gives four housing spaces and unlocks Urga, your first survivor. Blackroot begins with you.']
] as const;
export function installIntro(onPause:(paused:boolean)=>void, onReset:()=>boolean, onFinish:()=>void){
 const dialog=document.createElement('dialog');dialog.className='orc-dialog';dialog.setAttribute('aria-labelledby','orc-dialog-title');document.body.append(dialog);
 const eyebrow=document.createElement('p'), title=document.createElement('h2'), body=document.createElement('p'), controls=document.createElement('div'), back=document.createElement('button'), next=document.createElement('button');title.id='orc-dialog-title';controls.className='orc-dialog-controls';controls.append(back,next);dialog.append(eyebrow,title,body,controls);
 let page=0, mode:'intro'|'reset'='intro';
 const close=()=>{dialog.close();if(document.activeElement instanceof HTMLElement)document.activeElement.blur();onPause(false);};
 const render=()=>{eyebrow.textContent=`THE ASHES OF BLACKROOT • ${page+1}/${panels.length}`;title.textContent=panels[page][0];body.textContent=panels[page][1];back.textContent=page?'Back':'Skip intro';next.textContent=page===panels.length-1?'Begin rebuilding':'Continue';};
 const finish=()=>{onFinish();close();};
 back.onclick=()=>{if(mode==='reset'){close();return;}if(page===0)finish();else{page--;render();}};
 next.onclick=()=>{if(mode==='reset'){if(onReset())location.reload();else body.textContent='Could not erase the save. Check browser storage permissions and try again.';return;}if(page===panels.length-1)finish();else{page++;render();}};
 dialog.addEventListener('cancel',e=>{e.preventDefault();if(mode==='reset')close();});
 const open=(kind:'intro'|'reset')=>{if(dialog.open)return;mode=kind;page=0;if(kind==='intro')render();else{eyebrow.textContent='ORC VILLAGE';title.textContent='Start over?';body.textContent='This permanently erases your Blackroot village, resources, tools, workers and quests on this device. Your other games are unaffected.';back.textContent='Cancel';next.textContent='Reset village';}onPause(true);dialog.showModal();next.focus();};
 document.getElementById('orc-story')?.addEventListener('click',()=>open('intro'));
 document.getElementById('orc-reset')?.addEventListener('click',()=>open('reset'));
 if(!SaveSystem.load()?.story?.introSeen)open('intro');
}
