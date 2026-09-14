/**
 * One final high-quality resize after crop/perspective/enhancement.
 * Clear Document defaults to 300 DPI and normal quality never goes below 200 DPI.
 */
export function resizeForA4Scan(source:HTMLCanvasElement,dpi=300){
  const landscape=source.width>source.height
  const targetW=Math.round((landscape?11.69:8.27)*dpi),targetH=Math.round((landscape?8.27:11.69)*dpi)
  const scale=Math.min(1,targetW/source.width,targetH/source.height)
  if(scale>=.995)return source
  const out=document.createElement('canvas')
  out.width=Math.max(1,Math.round(source.width*scale));out.height=Math.max(1,Math.round(source.height*scale))
  const ctx=out.getContext('2d')!;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(source,0,0,out.width,out.height)
  if(source!==out)source.width=source.height=1
  return out
}
