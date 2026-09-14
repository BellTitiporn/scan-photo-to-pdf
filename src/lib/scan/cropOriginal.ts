import type {Corners} from '../../types'
import {SAFE_INTERMEDIATE_MAX_DIMENSION} from './constants'
import {perspectiveTransform} from './perspectiveTransform'

const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
/** Crops the source Blob before pixel processing. createImageBitmap crop+resize prevents a huge full-frame canvas. */
export async function cropAndPerspectiveCorrect(file:File,c:Corners,originalWidth:number,originalHeight:number,maxOutput=3400){
 const pad=Math.round(Math.min(originalWidth,originalHeight)*.012)
 const minX=clamp(Math.floor(Math.min(c.tl.x,c.bl.x)-pad),0,originalWidth-1),minY=clamp(Math.floor(Math.min(c.tl.y,c.tr.y)-pad),0,originalHeight-1)
 const maxX=clamp(Math.ceil(Math.max(c.tr.x,c.br.x)+pad),minX+1,originalWidth),maxY=clamp(Math.ceil(Math.max(c.bl.y,c.br.y)+pad),minY+1,originalHeight)
 const cropW=maxX-minX,cropH=maxY-minY,scale=Math.min(1,SAFE_INTERMEDIATE_MAX_DIMENSION/Math.max(cropW,cropH)),rw=Math.max(1,Math.round(cropW*scale)),rh=Math.max(1,Math.round(cropH*scale))
 let bitmap:ImageBitmap
 try{bitmap=await createImageBitmap(file,minX,minY,cropW,cropH,{resizeWidth:rw,resizeHeight:rh,resizeQuality:'high'})}
 catch{const full=await createImageBitmap(file);try{const temp=document.createElement('canvas');temp.width=rw;temp.height=rh;temp.getContext('2d')!.drawImage(full,minX,minY,cropW,cropH,0,0,rw,rh);bitmap=await createImageBitmap(temp)}finally{full.close()}}
 try{
  const local:Corners={tl:{x:(c.tl.x-minX)*scale,y:(c.tl.y-minY)*scale},tr:{x:(c.tr.x-minX)*scale,y:(c.tr.y-minY)*scale},br:{x:(c.br.x-minX)*scale,y:(c.br.y-minY)*scale},bl:{x:(c.bl.x-minX)*scale,y:(c.bl.y-minY)*scale}}
  return perspectiveTransform(bitmap,rw,rh,local,maxOutput)
 }finally{bitmap.close()}
}
