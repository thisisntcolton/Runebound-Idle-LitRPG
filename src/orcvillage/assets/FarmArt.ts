import Phaser from 'phaser';
import {crops} from '../systems/Farming';
// Native pixel tiles, with independently cached growth stages.
export function createFarmArt(scene:Phaser.Scene){
 for(const crop of crops)for(let stage=0;stage<4;stage++){
 const key=`farm-${crop.id}-${stage}`;if(scene.textures.exists(key))continue;
 const t=scene.textures.createCanvas(key,20,30)!;const c=t.context;
 const r=(color:string,x:number,y:number,w:number,h:number)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 r('#30251d',0,15,20,15);r('#754b32',1,16,18,12);r('#4c3225',2,18,16,9);r('#9a6744',1,16,18,2);r('#69432c',2,26,16,2);
 for(let i=0;i<8;i++)r(i%2?'#795037':'#39291f',3+(i*7)%14,19+(i*3)%7,2,1);
 if(stage){const h=stage===1?5:stage===2?10:16;const top=24-h;r('#243b23',9,top,3,h);r('#66863a',10,top,1,h);for(let j=0;j<stage+1;j++){const y=top+2+j*3;const w=stage===1?4:stage===2?6:8;r('#243b23',10-w,y,w,3);r('#536f30',11-w,y,w-2,2);r('#8da64b',11-w,y,w-3,1);r('#243b23',11,y-2,w,3);r('#65843b',12,y-2,w-2,2);r('#a0b457',12,y-2,w-3,1);}if(stage===3){const color='#'+crop.color.toString(16).padStart(6,'0');if(crop.id==='potato'){r('#e4d9b0',8,9,3,3);r('#e4d9b0',13,12,3,3);r('#c5a34b',9,10,1,1);r('#c5a34b',14,13,1,1);}else{r('#303a23',5,19,10,6);r(color,6,19,8,5);r('#e0c68a',7,19,3,1);}}}
 t.refresh();
 }
}
