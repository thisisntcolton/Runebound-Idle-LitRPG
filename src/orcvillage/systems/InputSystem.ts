/** One owner for gameplay keyboard commands; native modal dialogs retain keyboard access. */
export function installGameInput(options:{blocked:()=>boolean;menu:()=>boolean;act:()=>void;release:()=>void;close:()=>void;open:()=>void;eat:()=>void}):()=>void {
 const down=(e:KeyboardEvent)=>{
  if(document.querySelector('dialog[open]')||options.blocked())return;
  if(e.target instanceof HTMLElement && (e.target.matches('input,textarea,select')||e.target.isContentEditable))return;
  if(!['Space','Escape','KeyE','KeyF'].includes(e.code))return;
  if(options.menu()&&e.code==='Space')return; // native menu button activation
  e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
  if(e.code==='Escape'){options.release();if(options.menu())options.close();else document.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(d=>d.open=false);return;}
  if(options.menu())return;
  if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
  if(e.code==='Space')options.act();else if(e.code==='KeyE')options.open();else options.eat();
 };
 const up=(e:KeyboardEvent)=>{if(e.code==='Space')options.release();};
 window.addEventListener('keydown',down,true);window.addEventListener('keyup',up,true);window.addEventListener('blur',options.release);
 return ()=>{window.removeEventListener('keydown',down,true);window.removeEventListener('keyup',up,true);window.removeEventListener('blur',options.release);};
}
