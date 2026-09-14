const ctxSelf:any = self as any

type P={x:number,y:number}; type C={tl:P;tr:P;br:P;bl:P}
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
function lum(d:Uint8ClampedArray,i:number){return .2126*d[i]+.7152*d[i+1]+.0722*d[i+2]}
function dist(a:P,b:P){return Math.hypot(a.x-b.x,a.y-b.y)}
function ratioScore(c:C){const w=(dist(c.tl,c.tr)+dist(c.bl,c.br))/2,h=(dist(c.tl,c.bl)+dist(c.tr,c.br))/2;const r=Math.max(w,h)/Math.max(1,Math.min(w,h));return Math.exp(-Math.abs(r-1.4142)*2.4)}
function polygonArea(c:C){const p=[c.tl,c.tr,c.br,c.bl];let s=0;for(let i=0;i<4;i++){const a=p[i],b=p[(i+1)%4];s+=a.x*b.y-b.x*a.y}return Math.abs(s)/2}

function detect(data:ImageData):{corners:C|null;confidence:number}{
 const {width:w,height:h}=data,d=data.data; if(w<64||h<64)return{corners:null,confidence:0}
 const step=Math.max(1,Math.round(Math.max(w,h)/900));
 const gray=new Float32Array(w*h)
 let sum=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,v=lum(d,i);gray[y*w+x]=v;sum+=v}
 const mean=sum/(w*h)
 const border:number[]=[];const bs=Math.max(2,Math.floor(Math.min(w,h)*.025))
 for(let x=0;x<w;x+=step*3)for(let y=0;y<bs;y+=step)border.push(gray[y*w+x],gray[(h-1-y)*w+x])
 for(let y=0;y<h;y+=step*3)for(let x=0;x<bs;x+=step)border.push(gray[y*w+x],gray[y*w+(w-1-x)])
 border.sort((a,b)=>a-b);const bg=border[Math.floor(border.length/2)]??mean
 const candidates:P[]=[]; let edgeTotal=0
 // Pixels that are paper-like relative to border and have a nearby gradient.
 for(let y=2;y<h-2;y+=step){for(let x=2;x<w-2;x+=step){
   const g=Math.abs(gray[y*w+x+1]-gray[y*w+x-1])+Math.abs(gray[(y+1)*w+x]-gray[(y-1)*w+x]);
   edgeTotal+=g
   const v=gray[y*w+x],paperBright=v>Math.max(120,bg+10)||v>mean+12
   if(paperBright&&g>28)candidates.push({x,y})
 }}
 if(candidates.length<40)return{corners:null,confidence:0}
 // Extreme points of paper edge cloud are robust to moderate perspective.
 let tl=candidates[0],tr=candidates[0],br=candidates[0],bl=candidates[0]
 for(const p of candidates){const s=p.x+p.y,dif=p.x-p.y;if(s<tl.x+tl.y)tl=p;if(s>br.x+br.y)br=p;if(dif>tr.x-tr.y)tr=p;if(dif<bl.x-bl.y)bl=p}
 const c={tl,tr,br,bl}; const area=polygonArea(c),areaRatio=area/(w*h)
 if(areaRatio<.18)return{corners:null,confidence:0}
 const margin=Math.min(w,h)*.006
 for(const p of [c.tl,c.tr,c.br,c.bl]){p.x=clamp(p.x,margin,w-margin);p.y=clamp(p.y,margin,h-margin)}
 // Interior brightness compared to outer border.
 let inside=0,count=0;const minX=Math.floor(Math.min(tl.x,bl.x)),maxX=Math.ceil(Math.max(tr.x,br.x)),minY=Math.floor(Math.min(tl.y,tr.y)),maxY=Math.ceil(Math.max(bl.y,br.y))
 for(let y=minY;y<=maxY;y+=step*6)for(let x=minX;x<=maxX;x+=step*6){inside+=gray[clamp(y,0,h-1)*w+clamp(x,0,w-1)];count++}
 const brightnessScore=clamp(((inside/Math.max(1,count))-bg+45)/90,0,1)
 const confidence=clamp(areaRatio*.9+ratioScore(c)*.35+brightnessScore*.25,0,1)
 return{corners:c,confidence}
}
ctxSelf.onmessage=async(e:MessageEvent<{bitmap:ImageBitmap}>)=>{const bitmap=e.data.bitmap;try{const c=new OffscreenCanvas(bitmap.width,bitmap.height),x=c.getContext('2d',{willReadFrequently:true})!;x.drawImage(bitmap,0,0);const image=x.getImageData(0,0,c.width,c.height);ctxSelf.postMessage(detect(image))}catch(err){ctxSelf.postMessage({corners:null,confidence:0,error:String(err)})}finally{bitmap.close()}}
