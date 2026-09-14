import type { Corners } from '../types'
import { loadImage } from '../utils/image'

// Lightweight local detector: samples luminance contrast against the photo border.
// Returns a rectangular candidate; the UI always allows manual 4-corner refinement.
export async function detectDocument(url: string): Promise<Corners | null> {
  const img = await loadImage(url)
  const scale = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(32, Math.round(img.naturalWidth * scale)), h = Math.max(32, Math.round(img.naturalHeight * scale))
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(img, 0, 0, w, h)
  const d = ctx.getImageData(0, 0, w, h).data
  const lum = (x:number,y:number) => { const i=(y*w+x)*4; return .2126*d[i]+.7152*d[i+1]+.0722*d[i+2] }
  const borderVals:number[]=[]
  for(let x=0;x<w;x+=Math.max(1,Math.floor(w/80))){borderVals.push(lum(x,2),lum(x,h-3))}
  for(let y=0;y<h;y+=Math.max(1,Math.floor(h/80))){borderVals.push(lum(2,y),lum(w-3,y))}
  const bg = borderVals.reduce((a,b)=>a+b,0)/borderVals.length
  const threshold = 24
  let minX=w, minY=h, maxX=0, maxY=0, hits=0
  for(let y=4;y<h-4;y+=3) for(let x=4;x<w-4;x+=3){ if(Math.abs(lum(x,y)-bg)>threshold){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);hits++} }
  if(hits < (w*h)/180) return null
  const pad = 6
  minX=Math.max(0,minX-pad); minY=Math.max(0,minY-pad); maxX=Math.min(w,maxX+pad); maxY=Math.min(h,maxY+pad)
  if((maxX-minX)*(maxY-minY)<w*h*.2) return null
  const sx=img.naturalWidth/w, sy=img.naturalHeight/h
  return { tl:{x:minX*sx,y:minY*sy}, tr:{x:maxX*sx,y:minY*sy}, br:{x:maxX*sx,y:maxY*sy}, bl:{x:minX*sx,y:maxY*sy} }
}
