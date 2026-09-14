import { PDFDocument } from 'pdf-lib'
import type { ExportOptions, ScanPage } from '../types'
import { renderPage } from '../imageProcessing/render'
import { canvasToJpeg, qualityValue } from '../imageProcessing/compression'

const sizes:Record<string,[number,number]>={A4:[595.28,841.89],Letter:[612,792],Legal:[612,1008]}
const marginMap={None:0,Small:18,Normal:36}

async function build(pages:ScanPage[],options:ExportOptions,quality:number,maxDim:number){
  const pdf=await PDFDocument.create()
  for(const p of pages){
    const canvas=await renderPage(p,maxDim)
    let final=canvas
    if(options.color!=='Original'){
      const ctx=final.getContext('2d',{willReadFrequently:true})!,im=ctx.getImageData(0,0,final.width,final.height),d=im.data
      for(let i=0;i<d.length;i+=4){const g=.299*d[i]+.587*d[i+1]+.114*d[i+2]; const v=options.color==='Black & White'?(g>150?255:0):g;d[i]=d[i+1]=d[i+2]=v}ctx.putImageData(im,0,0)
    }
    const blob=await canvasToJpeg(final,quality), bytes=await blob.arrayBuffer(), img=await pdf.embedJpg(bytes)
    let pw:number,ph:number
    if(options.pageSize==='Fit Image'){pw=img.width*.75;ph=img.height*.75}else [pw,ph]=sizes[options.pageSize]
    if(options.orientation==='Landscape'||(options.orientation==='Auto'&&img.width>img.height&&ph>pw)){[pw,ph]=[ph,pw]}
    if(options.orientation==='Portrait'&&pw>ph){[pw,ph]=[ph,pw]}
    const page=pdf.addPage([pw,ph]),m=marginMap[options.margins],availW=pw-2*m,availH=ph-2*m,s=Math.min(availW/img.width,availH/img.height)
    const w=img.width*s,h=img.height*s;page.drawImage(img,{x:(pw-w)/2,y:(ph-h)/2,width:w,height:h})
  }
  return pdf.save()
}

export async function generatePdf(pages:ScanPage[],options:ExportOptions,onStatus?:(s:string)=>void){
  let q=qualityValue(options.quality), dim=options.quality==='High'?2200:options.quality==='Medium'?1800:1400
  onStatus?.('Preparing PDF')
  let bytes=await build(pages,options,q,dim)
  if(options.maxSize){
    onStatus?.('Compressing PDF')
    const limit=options.maxSize*1024*1024
    let tries=0
    while(bytes.byteLength>limit&&tries<5){q=Math.max(.28,q*.78);dim=Math.max(900,Math.round(dim*.86));bytes=await build(pages,options,q,dim);tries++}
  }
  return new Blob([bytes as Uint8Array],{type:'application/pdf'})
}

export async function estimatePdfSize(pages:ScanPage[],options:ExportOptions){
  const pixels=pages.reduce((s,p)=>s+Math.min(p.width*p.height,2200*2200),0)
  const factor=options.quality==='High'?.14:options.quality==='Medium'?.095:.065
  return Math.max(60*1024,pixels*factor)
}
