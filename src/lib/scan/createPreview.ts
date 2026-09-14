import { PREVIEW_MAX_DIMENSION } from './constants'
import { getImageDimensions } from './imageMetadata'
import { progressiveResizeBitmap } from './progressiveResize'

export type PreviewResult = { blob: Blob; width: number; height: number; originalWidth: number; originalHeight: number }

function canvasFor(w:number,h:number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w,h)
  const c=document.createElement('canvas'); c.width=w; c.height=h; return c
}
async function canvasBlob(c:HTMLCanvasElement|OffscreenCanvas, type='image/jpeg', quality=.88):Promise<Blob>{
  if ('convertToBlob' in c) return c.convertToBlob({type,quality})
  return new Promise((resolve,reject)=>(c as HTMLCanvasElement).toBlob(b=>b?resolve(b):reject(new Error('Unable to encode preview')),type,quality))
}

/** Creates a small UI/detection image without retaining a full-size canvas. */
export async function createOptimizedPreview(file: File, maxDimension=PREVIEW_MAX_DIMENSION): Promise<PreviewResult> {
  const meta = await getImageDimensions(file)
  const scale=Math.min(1,maxDimension/Math.max(meta.width,meta.height))
  const width=Math.max(1,Math.round(meta.width*scale)), height=Math.max(1,Math.round(meta.height*scale))
  let bitmap: ImageBitmap, alreadyResized=true
  try { bitmap = await createImageBitmap(file,{resizeWidth:width,resizeHeight:height,resizeQuality:'high'}) }
  catch { bitmap = await createImageBitmap(file); alreadyResized=false }
  try {
    if(!alreadyResized && (bitmap.width>width*2 || bitmap.height>height*2)){
      const staged=progressiveResizeBitmap(bitmap,width,height)
      return {blob:await canvasBlob(staged,'image/jpeg',.88),width,height,originalWidth:meta.width,originalHeight:meta.height}
    }
    const c=canvasFor(width,height), ctx=c.getContext('2d') as CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D
    ctx.drawImage(bitmap,0,0,width,height)
    return {blob:await canvasBlob(c,'image/jpeg',.88),width,height,originalWidth:meta.width,originalHeight:meta.height}
  } finally { bitmap.close() }
}
