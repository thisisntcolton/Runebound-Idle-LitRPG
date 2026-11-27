import Phaser from 'phaser';
import { SafeArea } from './SafeArea';
import {layout,DESIGN} from './ResponsiveLayout';
export class ResponsiveUIManager {
 private anchors=new Map<Phaser.GameObjects.GameObject,{x:number;y:number}>(); private objects=new Set<Phaser.GameObjects.GameObject>(); private ui:Phaser.Cameras.Scene2D.Camera; private safe=new SafeArea(); private panel:HTMLElement; private current!:ReturnType<typeof layout>;
 constructor(private scene:Phaser.Scene){this.ui=scene.cameras.add(0,0,1,1);this.ui.setName('responsive-ui');this.panel=document.createElement('aside');this.panel.className='orc-side-panel';document.body.append(this.panel);scene.scale.on('resize',this.resize,this);scene.events.once('shutdown',()=>{scene.scale.off('resize',this.resize,this);this.panel.remove();this.safe.destroy();});this.resize();}
 register<T extends Phaser.GameObjects.GameObject>(o:T,anchor?:{x:number;y:number}):T{if(anchor){this.anchors.set(o,anchor);(o as unknown as {setPosition(x:number,y:number):void}).setPosition(anchor.x*DESIGN.width/3,anchor.y*DESIGN.height/3);}this.objects.add(o);this.scene.cameras.main.ignore(o);return o;}
 modal<T extends Phaser.GameObjects.Container>(o:T):T{return this.register(o);}
 anchor(x:number,y:number){return {x:DESIGN.width*x/3,y:DESIGN.height*y/3};}
 resize(){const s=this.scene.scale;this.current=layout(s.width,s.height,this.safe.segments(this.scene.game.canvas));const r=this.current.world,z=this.current.scale*3;for(const c of [this.scene.cameras.main,this.ui]){c.setViewport(r.x,r.y,r.width,r.height);c.setZoom(z);c.centerOn(180,320);}this.scene.cameras.main.setBounds(0,0,360,640);const p=this.current.panel;this.panel.hidden=!p;if(p){const b=this.scene.game.canvas.getBoundingClientRect();Object.assign(this.panel.style,{left:`${b.left+p.x}px`,top:`${b.top+p.y}px`,width:`${p.width}px`,height:`${p.height}px`});}}
 sync(quest:string,resources:string,stats:string){this.ui.ignore(this.scene.children.list.filter(o=>!this.objects.has(o)));for(const o of this.objects)if(!o.active){this.objects.delete(o);this.anchors.delete(o);}const content=`BLACKROOT VILLAGE\n\n${quest}\n\n${resources}\n\n${stats}\n\nUse the camp menu near the stockpile to manage upgrades.`;if(this.panel.textContent!==content)this.panel.textContent=content;}
}
