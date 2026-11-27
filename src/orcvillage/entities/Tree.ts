import Phaser from 'phaser';
export class Tree {
 health=3;active=true;readonly sprite:Phaser.GameObjects.Sprite;private bar:Phaser.GameObjects.Graphics;
 constructor(private scene:Phaser.Scene,readonly x:number,readonly y:number){this.sprite=scene.add.sprite(x,y,'tree').setOrigin(.5,.9).setDepth(y);this.bar=scene.add.graphics().setDepth(800);}
 // A destroyed tree awards once; its original location is restored after 30 seconds.
 chop(level:number):number{if(!this.active)return 0;this.health=Math.max(0,this.health-level);this.bar.clear();if(this.health){this.bar.fillStyle(0x303828).fillRect(this.x-12,this.y-53,24,5).fillStyle(0xe1bb61).fillRect(this.x-11,this.y-52,22*this.health/3,3);this.scene.tweens.add({targets:this.sprite,angle:5,duration:65,yoyo:true});return 0;}this.active=false;this.scene.tweens.killTweensOf(this.sprite);this.scene.tweens.add({targets:this.sprite,angle:85,alpha:0,duration:350,onComplete:()=>this.sprite.setVisible(false)});this.scene.time.delayedCall(30000,()=>{this.health=3;this.active=true;this.sprite.setVisible(true).setAlpha(1).setAngle(0);});return 3;}
}
