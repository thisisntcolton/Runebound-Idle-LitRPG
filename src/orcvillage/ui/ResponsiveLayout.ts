export type Rect={x:number;y:number;width:number;height:number};
export const DESIGN={width:1080,height:1920};
export function layout(width:number,height:number,segments:Rect[]=[]){
 const dual=width/height>1.4||segments.length>1;
 const panes=segments.length>1?[...segments].sort((a,b)=>a.x-b.x||a.y-b.y):dual?[{x:0,y:0,width:width*.58,height},{x:width*.58,y:0,width:width*.42,height}]:[{x:0,y:0,width,height}];
 const p=panes[0], scale=Math.min(p.width/DESIGN.width,p.height/DESIGN.height), w=DESIGN.width*scale,h=DESIGN.height*scale;
 return {dual,orientation:width>height?'landscape':'portrait',scale,world:{x:p.x+(p.width-w)/2,y:p.y+(p.height-h)/2,width:w,height:h},panel:panes[1]};
}
