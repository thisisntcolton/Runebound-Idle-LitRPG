import Phaser from 'phaser';
export class Player extends Phaser.GameObjects.Sprite {
 health=100; woodInventory=0; axeLevel=1; private speed=112;
 constructor(scene:Phaser.Scene,x:number,y:number){super(scene,x,y,'orc');scene.add.existing(this);this.setOrigin(.5,.85);}
 // Normalize diagonals so all eight directions move at the same speed.
 move(direction:Phaser.Math.Vector2,delta:number,blocked:(x:number,y:number)=>boolean){const v=direction.clone();if(v.length()>1)v.normalize();const step=Math.min(delta,50)/1000*this.speed;const x=Phaser.Math.Clamp(this.x+v.x*step,16,344),y=Phaser.Math.Clamp(this.y+v.y*step,100,492);if(!blocked(x,this.y))this.x=x;if(!blocked(this.x,y))this.y=y;if(v.x)this.setFlipX(v.x<0);this.setDepth(this.y);this.setAngle(v.lengthSq()?Math.sin(this.scene.time.now/75)*3:0);}
}
