import Phaser from 'phaser';
export function createBobberArt(scene:Phaser.Scene){
 for(const state of ['waiting','nibble','hooked','splash'])for(let i=0;i<4;i++){
  const key=`bobber-${state}-${i}`;if(scene.textures.exists(key))continue;
  const t=scene.textures.createCanvas(key,32,32)!;const c=t.context;
  const rect=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const r=8+i*2;const color=state==='hooked'?'#f5cb62':'#82bac7';
  rect(16-r,23,r*2,1,color);rect(16-r-2,20,2,3,color);rect(16+r,20,2,3,color);rect(16-r,19,r*2,1,'#416f83');
  if(state!=='splash'){
   const y=state==='hooked'?i%2*4:state==='nibble'?i%2*2:i%2;
   rect(14,8+y,3,5,'#512d29');rect(15,8+y,1,4,'#e26a48');rect(11,13+y,10,8,'#24252a');rect(9,15+y,14,4,'#24252a');rect(11,15+y,10,4,'#eee1c4');rect(12,13+y,8,3,'#d9513e');rect(12,19+y,8,2,'#a33530');rect(12,15+y,3,2,'#fff7df');
   if(state==='hooked'){rect(15,1,2,4,'#ffe06a');rect(15,6,2,1,'#ffe06a');rect(8,5,2,3,'#f5cb62');rect(22,5,2,3,'#f5cb62');}
  }
  if(state!=='waiting')for(let j=0;j<4;j++)rect(5+j*7,18-(i+j)%4*3,2,2,'#d5edf0');
  t.refresh();
 }
}
