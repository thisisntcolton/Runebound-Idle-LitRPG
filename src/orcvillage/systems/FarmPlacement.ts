export interface FarmRect {x:number;y:number;width:number;height:number}
export const FARM_WIDTH=80,FARM_HEIGHT=30;
export const overlaps=(a:FarmRect,b:FarmRect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
export function findFarmSite(blocked:FarmRect[]):FarmRect|undefined {
 for(let y=450;y>=110;y-=5)for(let x=20;x<=340-FARM_WIDTH;x+=5){const r={x,y,width:FARM_WIDTH,height:FARM_HEIGHT};if(!blocked.some(b=>overlaps(r,b)))return r;}
}
