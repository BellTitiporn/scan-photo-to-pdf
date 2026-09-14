import type {Corners} from '../../types'
import {A4_RATIO} from './constants'

export type DetectionResult={corners:Corners|null;confidence:number;method:'worker'|'fallback'}
const dist=(a:{x:number,y:number},b:{x:number,y:number})=>Math.hypot(a.x-b.x,a.y-b.y)
function validate(c:Corners,w:number,h:number){
 const top=dist(c.tl,c.tr),bottom=dist(c.bl,c.br),left=dist(c.tl,c.bl),right=dist(c.tr,c.br)
 const ww=(top+bottom)/2,hh=(left+right)/2,r=Math.max(ww,hh)/Math.max(1,Math.min(ww,hh))
 const area=((c.tl.x*c.tr.y-c.tr.x*c.tl.y)+(c.tr.x*c.br.y-c.br.x*c.tr.y)+(c.br.x*c.bl.y-c.bl.x*c.br.y)+(c.bl.x*c.tl.y-c.tl.x*c.bl.y))/2
 const areaRatio=Math.abs(area)/(w*h)
 const ratio=Math.exp(-Math.abs(r-A4_RATIO)*2.2)
 return {ok:areaRatio>.18&&r>1.05&&r<2.4,confidence:Math.min(1,areaRatio*.9+ratio*.35)}
}

async function workerDetect(bitmap:ImageBitmap):Promise<DetectionResult>{
 return new Promise((resolve,reject)=>{const worker=new Worker(new URL('./scan.worker.ts',import.meta.url),{type:'module'});const timer=setTimeout(()=>{worker.terminate();reject(new Error('Detection timed out'))},12000);worker.onmessage=e=>{clearTimeout(timer);worker.terminate();resolve({corners:e.data.corners,confidence:e.data.confidence||0,method:'worker'})};worker.onerror=e=>{clearTimeout(timer);worker.terminate();reject(e.error||new Error(e.message))};worker.postMessage({bitmap},[bitmap])})
}

/** Detects the likely A4 sheet on the lightweight preview only. */
export async function detectA4Document(preview:Blob):Promise<DetectionResult>{
 let bitmap=await createImageBitmap(preview)
 if(typeof Worker!=='undefined'&&typeof OffscreenCanvas!=='undefined'){
   try{return await workerDetect(bitmap)}catch{ /* create a fresh bitmap for fallback */ bitmap=await createImageBitmap(preview) }
 }
 try{
   const c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;const x=c.getContext('2d',{willReadFrequently:true})!;x.drawImage(bitmap,0,0)
   const d=x.getImageData(0,0,c.width,c.height).data,w=c.width,h=c.height
   // Conservative brightness segmentation fallback; unlike the old detector this searches for paper, not arbitrary contrast.
   const border:number[]=[];const l=(px:number,py:number)=>{const i=(py*w+px)*4;return .2126*d[i]+.7152*d[i+1]+.0722*d[i+2]}
   const s=Math.max(1,Math.floor(Math.max(w,h)/500));for(let xx=0;xx<w;xx+=s*5){border.push(l(xx,2),l(xx,h-3))}for(let yy=0;yy<h;yy+=s*5){border.push(l(2,yy),l(w-3,yy))}
   border.sort((a,b)=>a-b);const bg=border[Math.floor(border.length/2)]||128
   let minX=w,minY=h,maxX=0,maxY=0,hits=0;for(let yy=3;yy<h-3;yy+=s)for(let xx=3;xx<w-3;xx+=s){const v=l(xx,yy);if(v>Math.max(125,bg+12)){minX=Math.min(minX,xx);minY=Math.min(minY,yy);maxX=Math.max(maxX,xx);maxY=Math.max(maxY,yy);hits++}}
   if(!hits)return{corners:null,confidence:0,method:'fallback'}
   const corners={tl:{x:minX,y:minY},tr:{x:maxX,y:minY},br:{x:maxX,y:maxY},bl:{x:minX,y:maxY}},v=validate(corners,w,h)
   return{corners:v.ok?corners:null,confidence:v.confidence*.65,method:'fallback'}
 }finally{bitmap.close()}
}
