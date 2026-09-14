import type { Corners } from '../types'
import { loadImage } from '../utils/image'

const dist=(a:{x:number,y:number},b:{x:number,y:number})=>Math.hypot(a.x-b.x,a.y-b.y)
function solve8(A:number[][], b:number[]){
  const M=A.map((r,i)=>[...r,b[i]])
  for(let col=0;col<8;col++){
    let p=col; for(let r=col+1;r<8;r++) if(Math.abs(M[r][col])>Math.abs(M[p][col])) p=r
    ;[M[col],M[p]]=[M[p],M[col]]
    const div=M[col][col]||1e-9; for(let j=col;j<9;j++) M[col][j]/=div
    for(let r=0;r<8;r++) if(r!==col){ const f=M[r][col]; for(let j=col;j<9;j++) M[r][j]-=f*M[col][j] }
  }
  return M.map(r=>r[8])
}
function homography(dst:{x:number,y:number}[], src:{x:number,y:number}[]){
  const A:number[][]=[],b:number[]=[]
  for(let i=0;i<4;i++){ const x=dst[i].x,y=dst[i].y,u=src[i].x,v=src[i].y
    A.push([x,y,1,0,0,0,-u*x,-u*y]); b.push(u)
    A.push([0,0,0,x,y,1,-v*x,-v*y]); b.push(v)
  }
  return solve8(A,b)
}
export async function perspectiveCanvas(url:string,c:Corners,maxDimension=1800){
  const img=await loadImage(url)
  let outW=Math.max(dist(c.tl,c.tr),dist(c.bl,c.br)), outH=Math.max(dist(c.tl,c.bl),dist(c.tr,c.br))
  const s=Math.min(1,maxDimension/Math.max(outW,outH)); outW=Math.max(1,Math.round(outW*s));outH=Math.max(1,Math.round(outH*s))
  const src=[c.tl,c.tr,c.br,c.bl], dst=[{x:0,y:0},{x:outW-1,y:0},{x:outW-1,y:outH-1},{x:0,y:outH-1}]
  const H=homography(dst,src)
  const sc=document.createElement('canvas'); sc.width=img.naturalWidth;sc.height=img.naturalHeight
  const sx=sc.getContext('2d',{willReadFrequently:true})!; sx.drawImage(img,0,0)
  const sd=sx.getImageData(0,0,sc.width,sc.height)
  const out=document.createElement('canvas');out.width=outW;out.height=outH
  const ox=out.getContext('2d')!, od=ox.createImageData(outW,outH)
  const [a,b,c0,d,e,f,g,h]=H
  for(let y=0;y<outH;y++) for(let x=0;x<outW;x++){
    const den=g*x+h*y+1, u=(a*x+b*y+c0)/den, v=(d*x+e*y+f)/den
    const xi=Math.max(0,Math.min(sc.width-1,Math.round(u))), yi=Math.max(0,Math.min(sc.height-1,Math.round(v)))
    const si=(yi*sc.width+xi)*4, oi=(y*outW+x)*4
    od.data[oi]=sd.data[si];od.data[oi+1]=sd.data[si+1];od.data[oi+2]=sd.data[si+2];od.data[oi+3]=255
  }
  ox.putImageData(od,0,0); return out
}
