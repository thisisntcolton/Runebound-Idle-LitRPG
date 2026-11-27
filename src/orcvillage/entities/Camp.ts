import Phaser from 'phaser';import {Player} from './Player';import {empty,resources,Building} from '../systems/Economy';
export class Camp {storage=empty();built:Building[]=[];workers={wood:0,stone:0,iron:0,food:0};readonly x=180;readonly y=177;hutSprite:Phaser.GameObjects.Sprite;constructor(s:Phaser.Scene){this.hutSprite=s.add.sprite(180,157,'hut').setOrigin(.5,1).setDepth(157);s.add.text(180,164,'BLACKROOT',{fontSize:'11px',color:'#fff0c9',backgroundColor:'#39452d'}).setOrigin(.5).setDepth(800);s.add.rectangle(235,155,27,19,0x8b6239).setDepth(155);for(let i=0;i<3;i++)s.add.rectangle(235,149+i*6,25,4,0xc39759).setDepth(156);}
 deposit(p:Player){for(const r of resources){this.storage[r]+=p.inventory[r];p.inventory[r]=0;}}
}
