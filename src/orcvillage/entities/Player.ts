import Phaser from 'phaser';import {empty} from '../systems/Economy';
export class Player extends Phaser.GameObjects.Sprite {
 health=100; inventory=empty(); axeLevel=1; pickaxeLevel=0; private speed=112; private facing=0; private swinging=false;
 constructor(scene:Phaser.Scene,x:number,y:number){super(scene,x,y,'gruk',4);scene.add.existing(this);this.setOrigin(.5,52/56);this.setScale(.85);this.on(Phaser.Animations.Events.ANIMATION_COMPLETE,()=>{this.swinging=false;this.setFrame(this.facing*8+4);});}
 swing(x:number,y:number){const dx=x-this.x,dy=y-this.y;this.facing=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);this.swinging=true;this.play(`gruk-swing-${this.facing}`);} 
 // Normalize diagonals so all eight directions move at the same speed.
 move(direction:Phaser.Math.Vector2,delta:number,blocked:(x:number,y:number)=>boolean){// Recover saved positions or newly respawned obstacles before moving.
 if(blocked(this.x,this.y)){
  let found=false;
  for(let r=2;r<=400&&!found;r+=2){for(let i=0;i<32;i++){const a=i*Math.PI/16;const nx=Phaser.Math.Clamp(this.x+Math.cos(a)*r,17,343),ny=Phaser.Math.Clamp(this.y+Math.sin(a)*r,101,491);if(!blocked(nx,ny)){this.setPosition(nx,ny);found=true;break;}}}
 }
 if(this.swinging){this.setDepth(this.y);return;}
 const v=direction.clone();if(v.length()>1)v.normalize();const step=Math.min(delta,50)/1000*this.speed;const x=Phaser.Math.Clamp(this.x+v.x*step,16,344),y=Phaser.Math.Clamp(this.y+v.y*step,100,492);if(!blocked(x,this.y))this.x=x;if(!blocked(this.x,y))this.y=y;this.setDepth(this.y);if(this.swinging)return;if(v.lengthSq()){this.facing=Math.abs(v.x)>Math.abs(v.y)?(v.x<0?1:2):(v.y<0?3:0);this.play(`gruk-walk-${this.facing}`,true);}else{this.stop();this.setFrame(this.facing*8+4);}}
}
