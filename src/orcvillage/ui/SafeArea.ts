type Segment={x:number;y:number;width:number;height:number};
export class SafeArea {
 private probe=document.createElement('div');
 constructor(){Object.assign(this.probe.style,{position:'fixed',visibility:'hidden',pointerEvents:'none',padding:'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'});document.body.append(this.probe);}
 insets(){const s=getComputedStyle(this.probe);return {top:parseFloat(s.paddingTop)||0,right:parseFloat(s.paddingRight)||0,bottom:parseFloat(s.paddingBottom)||0,left:parseFloat(s.paddingLeft)||0};}
 segments(canvas:HTMLCanvasElement):Segment[]{const w=window as Window & {getWindowSegments?:()=>DOMRect[];visualViewport?:VisualViewport & {segments?:DOMRect[]}};const segments=w.getWindowSegments?.()??w.visualViewport?.segments??[];const b=canvas.getBoundingClientRect();return segments.map(r=>{const x=Math.max(r.x,b.left),y=Math.max(r.y,b.top);return {x:x-b.left,y:y-b.top,width:Math.min(r.x+r.width,b.right)-x,height:Math.min(r.y+r.height,b.bottom)-y};}).filter(r=>r.width>0&&r.height>0);}
 destroy(){this.probe.remove();}
}
