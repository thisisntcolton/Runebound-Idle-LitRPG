import Phaser from 'phaser';import {Player} from './Player';import {empty,resources,Building} from '../systems/Economy';
export class Camp {storage=empty();built:Building[]=[];workers={wood:0,stone:0,iron:0,food:0};readonly x=180;readonly y=177;hutSprite:Phaser.GameObjects.Sprite;stockSprite:Phaser.GameObjects.Sprite;constructor(s:Phaser.Scene){this.hutSprite=s.add.sprite(180,157,'hut').setOrigin(.5,1).setDepth(157);this.stockSprite=s.add.sprite(235,155,'stockpile').setOrigin(.5,1).setDepth(155);}
 deposit(p:Player){for(const r of resources){this.storage[r]+=p.inventory[r];p.inventory[r]=0;}}
}
