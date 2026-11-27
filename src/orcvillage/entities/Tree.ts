import Phaser from 'phaser';import {nodes,Resource} from '../systems/Economy';
// All renewable gathering nodes share a lifecycle and award exactly once.
export class Tree {health:number;active=true;readonly sprite:Phaser.GameObjects.Sprite;private shown=true;private until=0;private bar:Phaser.GameObjects.Graphics;
 constructor(private scene:Phaser.Scene,readonly x:number,readonly y:number,readonly kind:Resource='wood',readonly crop=false){this.health=this.hp;this.sprite=scene.add.sprite(x,y,crop?'crop':kind==='wood'?'tree':kind).setOrigin(.5,.9).setDepth(y);this.bar=scene.add.graphics().setDepth(800);}
 setShown(shown:boolean){this.shown=shown;this.sprite.setVisible(shown&&this.active);this.bar.setVisible(shown);}
 dispose(){this.scene.tweens.killTweensOf(this.sprite);this.sprite.destroy();this.bar.destroy();}
 restoreUntil(until:number){this.until=until;if(until>Date.now()){this.active=false;this.sprite.setVisible(false);}}
 tick(now:number){if(!this.active&&now>=this.until){this.health=this.hp;this.active=true;this.scene.tweens.killTweensOf(this.sprite);this.sprite.setVisible(this.shown).setAlpha(1).setAngle(0);}}
 get hp(){return this.crop?5:nodes[this.kind].hp;}
 chop(damage:number){if(!this.active)return 0;this.health=Math.max(0,this.health-damage<1e-8?0:this.health-damage);this.bar.clear();if(this.health){this.bar.fillStyle(0x303828).fillRect(this.x-12,this.y-53,24,5).fillStyle(0xe1bb61).fillRect(this.x-11,this.y-52,22*this.health/this.hp,3);this.scene.tweens.add({targets:this.sprite,angle:5,duration:65,yoyo:true});return 0;}this.active=false;this.scene.tweens.killTweensOf(this.sprite);this.scene.tweens.add({targets:this.sprite,angle:85,alpha:0,duration:350,onComplete:()=>this.sprite.setVisible(false)});this.until=Date.now()+(this.crop?1200000:nodes[this.kind].respawn);return this.crop?5:nodes[this.kind].yield;}
}