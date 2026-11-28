import Phaser from 'phaser';
import {buildings,venues} from '../systems/Riverhaven';
import {paintTerrain} from './Terrain';
export function riverhavenArt(s:Phaser.Scene):Phaser.GameObjects.GameObject[]{
 const out:Phaser.GameObjects.GameObject[]=[paintTerrain(s,9)];const g=s.add.graphics().setDepth(2);out.push(g);const rng=new Phaser.Math.RandomDataGenerator(['riverhaven']);
 const rect=(x:number,y:number,w:number,h:number,c:number)=>g.fillStyle(c).fillRect(x,y,w,h);
 for(let y=95;y<495;y+=2){const x=165+Math.round(Math.sin(y/35)*8);rect(x-23,y,46,2,0x80714c);}
 rect(0,240,290,42,0x80714c);rect(75,225,155,100,0x80714c);rect(25,390,265,35,0x80714c);
 for(let i=0;i<850;i++){const x=rng.between(0,289),y=rng.between(100,490);if((y>=240&&y<282)||(Math.abs(x-165-Math.sin(y/35)*8)<22)||(x>=75&&x<230&&y>=225&&y<325)||(x>=25&&y>=390&&y<425))rect(x,y,2,1,rng.pick([0xa18b5b,0x695d40]));}
 rect(290,65,70,445,0x345f69);rect(295,65,65,445,0x467d86);for(let i=0;i<140;i++)rect(rng.between(298,350),rng.between(70,500),rng.between(3,9),1,0x79a7a2);
 for(const [x,y,w,h] of [[282,240,78,38],[274,410,55,22]]){rect(x,y,w,h,0x654a30);for(let j=x+2;j<x+w;j+=5)rect(j,y+3,4,h-6,0xa17b4c);rect(x,y,w,3,0x483323);rect(x,y+h-3,w,3,0x483323);}
 for(const b of buildings){const sprite=s.add.image(b.x+b.w/2,b.y+b.h,b.art).setOrigin(.5,1).setDisplaySize(b.w,b.h).setDepth(b.y+b.h);if(b.name==='Bakery')sprite.setTint(0xffdda0);if(b.name==='Fishmonger')sprite.setTint(0xb5d9ef);out.push(sprite);}
 for(const [x,y,key,size] of [[18,130,'tree',42],[125,145,'tree2',45],[190,125,'tree',44],[18,330,'tree2',40],[280,290,'tree',42],[125,470,'tree',44],[220,480,'tree2',44],[82,300,'barrel',15],[250,230,'barrel',15],[110,390,'barrel',15]] as [number,number,string,number][]){out.push(s.add.image(x,y,key).setOrigin(.5,1).setDisplaySize(size,size).setDepth(y));}
 for(const v of venues)out.push(s.add.text(v.x,v.y-4,v.name,{fontSize:'9px',color:'#fff0c9',backgroundColor:'#34392b'}).setOrigin(.5,1).setDepth(600));return out;
}
