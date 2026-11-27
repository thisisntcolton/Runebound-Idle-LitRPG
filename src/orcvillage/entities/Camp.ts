import Phaser from 'phaser';import {Player} from './Player';
export class Camp {storage=0;readonly x=180;readonly y=177;constructor(s:Phaser.Scene){s.add.sprite(180,157,'hut').setOrigin(.5,1).setDepth(157);s.add.text(180,164,'GRUK’S CAMP',{fontSize:'11px',color:'#fff0c9',backgroundColor:'#39452d'}).setOrigin(.5).setDepth(800);s.add.rectangle(235,155,27,19,0x8b6239).setDepth(155);for(let i=0;i<3;i++)s.add.rectangle(235,149+i*6,25,4,0xc39759).setDepth(156);}
 deposit(p:Player){this.storage+=p.woodInventory;p.woodInventory=0;}
}
