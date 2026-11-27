import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import './style.css';
new Phaser.Game({type:Phaser.AUTO,parent:'game',width:360,height:640,pixelArt:true,backgroundColor:'#283322',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},input:{activePointers:3},scene:[MainScene]});
