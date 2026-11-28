import Phaser from 'phaser';
/** Seeded, cached pixel terrain. No per-frame drawing or collision changes. */
export function paintTerrain(scene:Phaser.Scene,region:number){
 const key=`blackroot-ground-${region}`;
 if(!scene.textures.exists(key)){
  const tex=scene.textures.createCanvas(key,360,445)!;const c=tex.context;
  const rng=new Phaser.Math.RandomDataGenerator(['blackroot-v8',String(region)]);
  const rocky=region===0||region===6;
  const colors=rocky?['#535b4c','#626956','#70745b','#454f43']:['#465b32','#52683a','#607541','#3b502e'];
  for(let y=0;y<445;y+=4)for(let x=0;x<360;x+=4){c.fillStyle=colors[rng.between(0,3)];c.fillRect(x,y,4,4);}
  for(let i=0;i<1900;i++){const x=rng.between(0,359),y=rng.between(0,444);c.fillStyle=i%3===0?'#849253':'#34492c';c.fillRect(x,y,2,1);if(i%5===0)c.fillRect(x+1,y-2,1,3);}
  if(region===4){for(let y=50;y<380;y+=2){const center=180+Math.round(Math.sin(y/35)*5);const w=y<145?Math.round(48+18*Math.sin(y/45)):20;c.fillStyle='#80714c';c.fillRect(center-w,y,w*2,2);for(let i=0;i<12;i++){c.fillStyle=i%2?'#a18b5b':'#695d40';c.fillRect(center+rng.between(-w,w-2),y,2,1);}}}
  if(region===5){for(let y=0;y<445;y+=2){const x=180+Math.round(Math.sin(y/35)*3);c.fillStyle='#93865c';c.fillRect(x-32,y,64,2);c.fillStyle='#345f69';c.fillRect(x-27,y,54,2);c.fillStyle='#467d86';c.fillRect(x-23,y,46,2);if(y%8===0){c.fillStyle='#79a7a2';c.fillRect(x+rng.between(-20,10),y,8,1);}}}
  for(let i=0;i<95;i++){const x=rng.between(4,355),y=rng.between(4,440);if((region===4||region===5)&&Math.abs(x-180)<55)continue;c.fillStyle='#293d29';c.fillRect(x-2,y+2,6,2);c.fillStyle=i%4===0?'#b9a06d':'#768b4a';c.fillRect(x,y,3,2);if(i%4===0){c.fillStyle='#e1c58b';c.fillRect(x+1,y-1,1,2);}}
  tex.refresh();
 }
 return scene.add.image(0,65,key).setOrigin(0).setDepth(region===4?0:1);
}
