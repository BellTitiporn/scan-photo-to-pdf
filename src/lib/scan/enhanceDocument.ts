/**
 * Edge-preserving denoise + mild contrast + mild unsharp mask.
 * Parameters intentionally protect thin Thai vowels/tone marks and signatures.
 */
export function enhanceDocument(input:HTMLCanvasElement){
  const out=document.createElement('canvas');out.width=input.width;out.height=input.height
  const ctx=out.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(input,0,0)
  const im=ctx.getImageData(0,0,out.width,out.height),d=im.data,w=out.width,h=out.height
  const g=new Uint8ClampedArray(w*h)
  for(let i=0,p=0;i<d.length;i+=4,p++)g[p]=Math.round(.299*d[i]+.587*d[i+1]+.114*d[i+2])

  // Tiny edge-aware denoise: average only very similar neighbours.
  const den=new Uint8ClampedArray(g.length)
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const center=g[y*w+x];let sum=center*4,weight=4
    for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){
      if(xx===x&&yy===y)continue
      const v=g[yy*w+xx],diff=Math.abs(v-center)
      if(diff<=14){const wt=diff<7?2:1;sum+=v*wt;weight+=wt}
    }
    den[y*w+x]=Math.round(sum/weight)
  }

  // 3x3 blur only for the unsharp reference, never as a destructive pre-filter.
  const blur=new Uint8ClampedArray(g.length)
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    let s=0,n=0
    for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){s+=den[yy*w+xx];n++}
    blur[y*w+x]=s/n
  }
  for(let p=0;p<g.length;p++){
    let v=(den[p]-128)*1.06+128+1
    v+=(den[p]-blur[p])*.30 // ~1.30 / -0.30 unsharp mask
    if(v>246)v=248+(v-246)*.75
    v=Math.max(0,Math.min(255,v))
    const i=p*4;d[i]=d[i+1]=d[i+2]=Math.round(v);d[i+3]=255
  }
  ctx.putImageData(im,0,0)
  return out
}
