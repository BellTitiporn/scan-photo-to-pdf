/**
 * Conservative illumination normalization for photographed documents.
 * Keeps grayscale anti-aliasing and faint Thai marks instead of forcing pixels to 0/255.
 */
export function normalizeLighting(input:HTMLCanvasElement){
  const out=document.createElement('canvas'); out.width=input.width; out.height=input.height
  const ctx=out.getContext('2d',{willReadFrequently:true})!; ctx.drawImage(input,0,0)
  const im=ctx.getImageData(0,0,out.width,out.height),d=im.data,w=out.width,h=out.height
  const gray=new Uint8ClampedArray(w*h)
  for(let i=0,p=0;i<d.length;i+=4,p++) gray[p]=Math.round(.299*d[i]+.587*d[i+1]+.114*d[i+2])

  // Large local background estimate using an integral image. This approximates a broad
  // illumination map without blurring the text itself.
  const radius=Math.max(18,Math.round(Math.min(w,h)/22)),stride=w+1
  const integral=new Float64Array((w+1)*(h+1))
  for(let y=1;y<=h;y++){
    let row=0
    for(let x=1;x<=w;x++){
      row+=gray[(y-1)*w+x-1]
      integral[y*stride+x]=integral[(y-1)*stride+x]+row
    }
  }
  const localMean=(x:number,y:number)=>{
    const x0=Math.max(0,x-radius),y0=Math.max(0,y-radius),x1=Math.min(w-1,x+radius),y1=Math.min(h-1,y+radius)
    const A=y0*stride+x0,B=y0*stride+x1+1,C=(y1+1)*stride+x0,D=(y1+1)*stride+x1+1
    return (integral[D]-integral[B]-integral[C]+integral[A])/((x1-x0+1)*(y1-y0+1))
  }

  for(let y=0,p=0;y<h;y++) for(let x=0;x<w;x++,p++){
    const g=gray[p],bg=Math.max(80,localMean(x,y))
    // Division-style correction removes shadows more gently than direct subtraction.
    const corrected=Math.max(0,Math.min(255,(g/bg)*242))
    // Blend some source luminance back in so faint marks are not erased.
    let v=corrected*.82+g*.18
    // Only flatten pixels that are already very close to paper white.
    if(v>247)v=253+(v-247)/4
    const i=p*4;d[i]=d[i+1]=d[i+2]=Math.max(0,Math.min(255,Math.round(v)));d[i+3]=255
  }
  ctx.putImageData(im,0,0)
  return out
}
