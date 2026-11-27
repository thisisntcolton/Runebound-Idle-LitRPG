import Phaser from 'phaser';
// Original low-resolution sprites, generated locally without external assets.
export function createArt(s:Phaser.Scene){
 const sprite=(key:string,w:number,h:number,draw:(g:Phaser.GameObjects.Graphics)=>void)=>{const g=s.make.graphics({x:0,y:0},false);draw(g);g.generateTexture(key,w,h);g.destroy();};
 const r=(g:Phaser.GameObjects.Graphics,c:number,x:number,y:number,w:number,h:number)=>g.fillStyle(c).fillRect(x,y,w,h);
 sprite('orc',24,30,g=>{r(g,0x35442b,3,26,18,3);r(g,0x49392b,5,21,6,7);r(g,0x49392b,13,21,6,7);r(g,0x805333,4,14,16,9);r(g,0x42642e,1,4,22,10);r(g,0x83ae4c,5,1,14,15);r(g,0x263222,7,7,3,3);r(g,0x263222,14,7,3,3);r(g,0xffe7b6,5,12,3,5);r(g,0xffe7b6,16,12,3,5);r(g,0x9e7446,20,15,3,12);r(g,0xbac2b6,17,13,7,6);});
 sprite('tree',42,54,g=>{r(g,0x42552e,6,48,30,5);r(g,0x775034,17,27,9,23);r(g,0xa97943,20,29,3,18);r(g,0x304c2b,5,12,32,29);r(g,0x304c2b,12,2,19,43);r(g,0x47743b,2,17,38,19);r(g,0x47743b,9,8,26,27);r(g,0x68964a,10,8,17,12);r(g,0x598544,5,19,20,9);});
 sprite('hut',80,65,g=>{r(g,0x62452d,8,26,64,36);r(g,0x9b6040,0,24,80,9);r(g,0x79432e,9,16,62,10);r(g,0x9b6040,19,8,42,10);r(g,0x79432e,30,0,20,9);r(g,0x30291f,32,39,16,23);r(g,0xc3ad80,5,32,4,30);r(g,0xc3ad80,71,32,4,30);});
 sprite('stone',34,29,g=>{r(g,0x4d5552,2,10,30,17);r(g,0x818b85,6,5,23,17);r(g,0xa6aea1,10,2,14,9);});
 sprite('iron',34,29,g=>{r(g,0x4d5552,2,10,30,17);r(g,0x818b85,6,5,23,17);r(g,0xb66b43,9,8,7,6);r(g,0xd18c59,21,15,7,6);});
 sprite('food',30,25,g=>{r(g,0x31552d,2,8,26,15);r(g,0x618c42,6,2,18,17);for(let i=0;i<4;i++)r(g,0xc34d62,5+i*6,8+i%2*7,4,4);});
 sprite('crop',30,25,g=>{r(g,0x805333,0,15,30,10);for(let i=0;i<4;i++)r(g,0xd7b653,3+i*7,2,4,19);});
}
