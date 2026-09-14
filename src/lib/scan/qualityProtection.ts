/**
 * Compares fine-detail/edge retention against enhanced grayscale. A smart B&W candidate
 * that removes too many weak edges (where small Thai marks often live) is rejected.
 */
export function detailRetention(reference:HTMLCanvasElement,candidate:HTMLCanvasElement){
  const sample=(c:HTMLCanvasElement)=>{
    const x=c.getContext('2d',{willReadFrequently:true})!,im=x.getImageData(0,0,c.width,c.height).data,w=c.width,h=c.height
    const lum=(p:number)=>.299*im[p]+.587*im[p+1]+.114*im[p+2]
    let edge=0,weak=0,count=0
    const step=Math.max(1,Math.round(Math.max(w,h)/1800))
    for(let y=1;y<h-1;y+=step)for(let xx=1;xx<w-1;xx+=step){
      const i=(y*w+xx)*4,l=lum(i),gx=Math.abs(l-lum(i+4)),gy=Math.abs(l-lum(i+w*4)),g=gx+gy
      if(g>12)edge+=Math.min(80,g)
      if(l<225&&l>75&&g>8)weak++
      count++
    }
    return{edge:edge/Math.max(1,count),weak:weak/Math.max(1,count)}
  }
  const a=sample(reference),b=sample(candidate)
  const edgeRatio=b.edge/Math.max(.001,a.edge),weakRatio=b.weak/Math.max(.00001,a.weak)
  return{score:Math.min(edgeRatio,weakRatio*.45+.55),edgeRatio,weakRatio,acceptable:edgeRatio>=.88&&weakRatio>=.72}
}
