import type { Adjustments, FilterMode } from '../types'

const clamp=(v:number)=>Math.max(0,Math.min(255,v))
export function applyProcessing(canvas:HTMLCanvasElement, mode:FilterMode, adj:Adjustments){
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!, im=ctx.getImageData(0,0,canvas.width,canvas.height), d=im.data
  let brightness=adj.brightness, contrast=adj.contrast, saturation=adj.saturation
  if(mode==='color'){brightness+=4;contrast+=14;saturation+=7}
  if(mode==='auto'){brightness+=8;contrast+=22;saturation-=3}
  const cf=(259*(contrast+255))/(255*(259-contrast))
  for(let i=0;i<d.length;i+=4){
    let r=d[i]+brightness*2.55,g=d[i+1]+brightness*2.55,b=d[i+2]+brightness*2.55
    r=cf*(r-128)+128;g=cf*(g-128)+128;b=cf*(b-128)+128
    const gray=.299*r+.587*g+.114*b, sat=1+saturation/100
    r=gray+(r-gray)*sat;g=gray+(g-gray)*sat;b=gray+(b-gray)*sat
    if(mode==='grayscale'){r=g=b=gray}
    if(mode==='bw'){const v=gray>150?255:0;r=g=b=v}
    d[i]=clamp(r);d[i+1]=clamp(g);d[i+2]=clamp(b)
  }
  ctx.putImageData(im,0,0)
  if(adj.sharpness>0){
    // fast unsharp-like pass using canvas filter on a temporary layer
    const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;copy.getContext('2d')!.drawImage(canvas,0,0)
    ctx.globalAlpha=Math.min(.45,adj.sharpness/220);ctx.filter='contrast(1.35)';ctx.drawImage(copy,0,0);ctx.filter='none';ctx.globalAlpha=1
  }
  return canvas
}

export function transformCanvas(canvas:HTMLCanvasElement, rotation:number, flipX:boolean, flipY:boolean){
  const rot=((rotation%360)+360)%360, swap=rot===90||rot===270
  const out=document.createElement('canvas');out.width=swap?canvas.height:canvas.width;out.height=swap?canvas.width:canvas.height
  const ctx=out.getContext('2d')!;ctx.translate(out.width/2,out.height/2);ctx.rotate(rot*Math.PI/180);ctx.scale(flipX?-1:1,flipY?-1:1);ctx.drawImage(canvas,-canvas.width/2,-canvas.height/2)
  return out
}
