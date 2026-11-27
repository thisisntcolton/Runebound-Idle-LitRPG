const assert=require('node:assert/strict');const {layout}=require(process.argv[2]);
const cases=[[320,568],[375,667],[390,844],[414,896],[768,1024],[820,1180],[1080,1920],[1440,2560],[1920,1080],[3440,1440],[720,540],[280,653],[884,1104],[1114,720]];
for(const [w,h] of cases){const r=layout(w,h);assert.equal(r.dual,w/h>1.4);assert.ok(r.world.x>=-1e-6&&r.world.y>=-1e-6&&r.world.x+r.world.width<=w+1e-6&&r.world.y+r.world.height<=h+1e-6);assert.ok(Math.abs(r.world.width/r.world.height-1080/1920)<1e-9);console.log('PASS',w,h,r.dual?'dual':'single');}
const duo=layout(1114,720,[{x:0,y:0,width:540,height:720},{x:574,y:0,width:540,height:720}]);assert.ok(duo.world.x+duo.world.width<=540&&duo.panel.x>=574);console.log('PASS simulated hinge');
