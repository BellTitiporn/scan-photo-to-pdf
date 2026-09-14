import type { Corners, NormalizedCorners } from '../../types'
export const normalizeCorners=(c:Corners,w:number,h:number):NormalizedCorners=>({
 tl:{x:c.tl.x/w,y:c.tl.y/h},tr:{x:c.tr.x/w,y:c.tr.y/h},br:{x:c.br.x/w,y:c.br.y/h},bl:{x:c.bl.x/w,y:c.bl.y/h}
})
export const denormalizeCorners=(c:NormalizedCorners,w:number,h:number):Corners=>({
 tl:{x:c.tl.x*w,y:c.tl.y*h},tr:{x:c.tr.x*w,y:c.tr.y*h},br:{x:c.br.x*w,y:c.br.y*h},bl:{x:c.bl.x*w,y:c.bl.y*h}
})
export const mapPreviewToOriginal=(c:Corners,pw:number,ph:number,ow:number,oh:number)=>denormalizeCorners(normalizeCorners(c,pw,ph),ow,oh)
