const grayFrom=(input:HTMLCanvasElement)=>{
  const ctx=input.getContext('2d',{willReadFrequently:true})!,im=ctx.getImageData(0,0,input.width,input.height),d=im.data
  const g=new Uint8ClampedArray(input.width*input.height)
  for(let i=0,p=0;i<d.length;i+=4,p++)g[p]=Math.round(.299*d[i]+.587*d[i+1]+.114*d[i+2])
  return g
}

/**
 * Smart Document B&W: visually white paper + dark text while retaining grayscale
 * anti-aliased edges. It is intentionally NOT a 1-bit threshold.
 */
export function convertToSmartBlackAndWhite(input:HTMLCanvasElement){
  const out=document.createElement('canvas');out.width=input.width;out.height=input.height
  const ctx=out.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(input,0,0)
  const im=ctx.getImageData(0,0,out.width,out.height),d=im.data,w=out.width,h=out.height,g=grayFrom(input)
  const r=Math.max(12,Math.round(Math.min(w,h)/85)),stride=w+1,sum=new Float64Array((w+1)*(h+1))
  for(let y=1;y<=h;y++){let row=0;for(let x=1;x<=w;x++){row+=g[(y-1)*w+x-1];sum[y*stride+x]=sum[(y-1)*stride+x]+row}}
  const mean=(x:number,y:number)=>{const x0=Math.max(0,x-r),y0=Math.max(0,y-r),x1=Math.min(w-1,x+r),y1=Math.min(h-1,y+r),A=y0*stride+x0,B=y0*stride+x1+1,C=(y1+1)*stride+x0,D=(y1+1)*stride+x1+1;return(sum[D]-sum[B]-sum[C]+sum[A])/((x1-x0+1)*(y1-y0+1))}
  for(let y=0,p=0;y<h;y++)for(let x=0;x<w;x++,p++){
    const src=g[p],m=mean(x,y),localDelta=src-m
    let v=src
    // Whiten obvious paper slowly; preserve pixels near local text edges.
    if(src>218&&localDelta>-18)v=245+(src-218)*10/37
    else if(src<205)v=src<90?src*.82:src*.90
    else v=src+(src-205)*.35
    v=Math.max(0,Math.min(255,v))
    const i=p*4;d[i]=d[i+1]=d[i+2]=Math.round(v);d[i+3]=255
  }
  ctx.putImageData(im,0,0)
  return out
}

/** Explicit Pure B&W preset only. Never used by Clear Document. */
export function convertToPureBlackAndWhite(input:HTMLCanvasElement){
  const out=document.createElement('canvas');out.width=input.width;out.height=input.height
  const ctx=out.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(input,0,0)
  const im=ctx.getImageData(0,0,out.width,out.height),d=im.data,w=out.width,h=out.height,g=grayFrom(input)
  const r=Math.max(10,Math.round(Math.min(w,h)/75)),stride=w+1,sum=new Float64Array((w+1)*(h+1))
  for(let y=1;y<=h;y++){let row=0;for(let x=1;x<=w;x++){row+=g[(y-1)*w+x-1];sum[y*stride+x]=sum[(y-1)*stride+x]+row}}
  for(let y=0,p=0;y<h;y++)for(let x=0;x<w;x++,p++){
    const x0=Math.max(0,x-r),y0=Math.max(0,y-r),x1=Math.min(w-1,x+r),y1=Math.min(h-1,y+r),A=y0*stride+x0,B=y0*stride+x1+1,C=(y1+1)*stride+x0,D=(y1+1)*stride+x1+1,n=(x1-x0+1)*(y1-y0+1),m=(sum[D]-sum[B]-sum[C]+sum[A])/n
    // Conservative local threshold. This mode is user-selected, not automatic.
    const v=g[p] < m-10 ? 0 : 255,i=p*4;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255
  }
  ctx.putImageData(im,0,0);return out
}

// Backward compatibility for Advanced filter imports.
export const convertToBlackAndWhite=convertToPureBlackAndWhite
