import Phaser from 'phaser';
export class Joystick {
 readonly vector=new Phaser.Math.Vector2();private pointer:number|null=null;
 constructor(s:Phaser.Scene,x=65,y=570){const base=s.add.circle(x,y,43,0x263323,.85).setStrokeStyle(2,0xa5b08d).setDepth(1000).setInteractive();const knob=s.add.circle(x,y,19,0x9ba68a).setDepth(1001);const move=(p:Phaser.Input.Pointer)=>{if(p.id!==this.pointer)return;this.vector.set((p.x-x)/36,(p.y-y)/36);if(this.vector.length()>1)this.vector.normalize();knob.setPosition(x+this.vector.x*36,y+this.vector.y*36);};const reset=()=>{this.pointer=null;this.vector.set(0,0);knob.setPosition(x,y);};base.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(this.pointer===null){this.pointer=p.id;move(p);}});s.input.on('pointermove',move);s.input.on('pointerup',(p:Phaser.Input.Pointer)=>{if(p.id===this.pointer)reset();});s.game.events.on(Phaser.Core.Events.BLUR,reset);s.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>s.game.events.off(Phaser.Core.Events.BLUR,reset));}
}
