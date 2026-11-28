import Phaser from 'phaser';
import {buildings} from '../systems/Riverhaven';
export function riverhavenArt(s:Phaser.Scene):Phaser.GameObjects.GameObject[]{
 const out:Phaser.GameObjects.GameObject[]=[];const g=s.add.graphics().setDepth(2);out.push(g);const rng=new Phaser.Math.RandomDataGenerator(['riverhaven']);
 const rect=(x:number,y:number,w:number,h:number,c:number)=>g.fillStyle(c).fillRect(x,y,w,h);
 for(let y=65;y<510;y+=4)for(let x=0;x<360;x+=4)rect(x,y,4,4,rng.pick([0x52663c,0x586d40,0x607344,0x4c6038]));
 rect(0,240,300,42,0x9d895b);rect(145,95,48,400,0x9d895b);rect(75,225,155,100,0x9d895b);rect(0,390,290,35,0x9d895b);
 for(let i=0;i<500;i++){const x=rng.between(0,289),y=rng.between(100,490);if((y>=240&&y<282)||(x>=145&&x<193)||(x>=75&&x<230&&y>=225&&y<325)||(y>=390&&y<425))rect(x,y,2,2,rng.pick([0xb4a071,0x82734d]));}
 rect(290,65,70,445,0x315e75);for(let i=0;i<140;i++)rect(rng.between(294,350),rng.between(70,500),rng.between(3,9),1,0x528ca2);
 rect(282,240,78,38,0x654a30);for(let x=284;x<360;x+=6)rect(x,243,5,32,0xa17b4c);rect(282,240,78,3,0x483323);rect(282,275,78,3,0x483323);
 for(const b of buildings){const a=s.add.graphics().setDepth(b.y+b.h);out.push(a);const r=(x:number,y:number,w:number,h:number,c:number)=>a.fillStyle(c).fillRect(x,y,w,h);const {x,y,w,h}=b;r(x,y+15,w,h-15,0x654831);r(x+4,y+20,w-8,h-24,0xa78254);for(let i=5;i<w;i+=13)r(x+i,y+20,3,h-22,0x533b29);r(x+w/2-7,y+h-20,14,20,0x30251d);const stall=h===28;const roof=stall?(b.name==='Bakery'?0xb99b4c:b.name==='Market'?0x537e48:0x456f91):b.name==='Forge'?0x535a60:b.name==='Tavern'?0x98583d:0xb99a47;for(let j=0;j<22;j+=3){const inset=stall?0:Math.floor((21-j)*.65);r(x+inset-3,y+j,w-2*inset+6,3,roof);for(let k=inset;k<w-inset;k+=9)r(x+k,y+j,2,2,0x594c36);}out.push(s.add.text(x+w/2,y-4,b.name,{fontSize:'9px',color:'#fff0c9',backgroundColor:'#34392b'}).setOrigin(.5,1).setDepth(600));}
 out.push(s.add.text(12,230,'← Riverbend',{fontSize:'10px',color:'#fff0c9',backgroundColor:'#34392b'}).setDepth(600));return out;
}
