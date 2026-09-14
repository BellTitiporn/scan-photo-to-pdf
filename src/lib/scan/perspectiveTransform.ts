import type {Corners} from '../../types'

const dist=(a:{x:number,y:number},b:{x:number,y:number})=>Math.hypot(a.x-b.x,a.y-b.y)

function solve8(A:number[][],b:number[]){
  const M=A.map((r,i)=>[...r,b[i]])
  for(let col=0;col<8;col++){
    let p=col
    for(let r=col+1;r<8;r++) if(Math.abs(M[r][col])>Math.abs(M[p][col])) p=r
    ;[M[col],M[p]]=[M[p],M[col]]
    const div=M[col][col]||1e-9
    for(let j=col;j<9;j++) M[col][j]/=div
    for(let r=0;r<8;r++) if(r!==col){
      const f=M[r][col]
      for(let j=col;j<9;j++) M[r][j]-=f*M[col][j]
    }
  }
  return M.map(r=>r[8])
}

function H(dst:{x:number,y:number}[],src:{x:number,y:number}[]){
  const A:number[][]=[],b:number[]=[]
  for(let i=0;i<4;i++){
    const x=dst[i].x,y=dst[i].y,u=src[i].x,v=src[i].y
    A.push([x,y,1,0,0,0,-u*x,-u*y]); b.push(u)
    A.push([0,0,0,x,y,1,-v*x,-v*y]); b.push(v)
  }
  return solve8(A,b)
}

/**
 * Perspective correction with bilinear sampling.
 * The old implementation rounded each projected source coordinate to the nearest pixel,
 * which produced visible stair-stepping and broken thin glyphs. Bilinear interpolation
 * keeps text edges substantially cleaner before thresholding.
 */
export function perspectiveTransform(source:CanvasImageSource,sourceWidth:number,sourceHeight:number,c:Corners,maxDimension=3200){
  let outW=Math.max(dist(c.tl,c.tr),dist(c.bl,c.br))
  let outH=Math.max(dist(c.tl,c.bl),dist(c.tr,c.br))
  const scale=Math.min(1,maxDimension/Math.max(outW,outH))
  outW=Math.max(1,Math.round(outW*scale)); outH=Math.max(1,Math.round(outH*scale))

  const input=document.createElement('canvas')
  input.width=sourceWidth; input.height=sourceHeight
  const ix=input.getContext('2d',{willReadFrequently:true})!
  ix.imageSmoothingEnabled=true; ix.imageSmoothingQuality='high'
  ix.drawImage(source,0,0,sourceWidth,sourceHeight)
  const sd=ix.getImageData(0,0,sourceWidth,sourceHeight)

  const out=document.createElement('canvas')
  out.width=outW; out.height=outH
  const ox=out.getContext('2d')!
  const od=ox.createImageData(outW,outH)
  const m=H(
    [{x:0,y:0},{x:outW-1,y:0},{x:outW-1,y:outH-1},{x:0,y:outH-1}],
    [c.tl,c.tr,c.br,c.bl]
  )
  const[a,b,c0,d,e,f,g,h]=m
  const src=sd.data,dst=od.data

  for(let y=0;y<outH;y++){
    for(let x=0;x<outW;x++){
      const den=g*x+h*y+1
      let u=(a*x+b*y+c0)/den, v=(d*x+e*y+f)/den
      u=Math.max(0,Math.min(sourceWidth-1,u)); v=Math.max(0,Math.min(sourceHeight-1,v))
      const x0=Math.floor(u),y0=Math.floor(v),x1=Math.min(sourceWidth-1,x0+1),y1=Math.min(sourceHeight-1,y0+1)
      const fx=u-x0,fy=v-y0
      const i00=(y0*sourceWidth+x0)*4,i10=(y0*sourceWidth+x1)*4,i01=(y1*sourceWidth+x0)*4,i11=(y1*sourceWidth+x1)*4
      const oi=(y*outW+x)*4
      for(let ch=0;ch<3;ch++){
        const top=src[i00+ch]*(1-fx)+src[i10+ch]*fx
        const bottom=src[i01+ch]*(1-fx)+src[i11+ch]*fx
        dst[oi+ch]=Math.round(top*(1-fy)+bottom*fy)
      }
      dst[oi+3]=255
    }
  }
  ox.putImageData(od,0,0)
  input.width=input.height=1
  return out
}
