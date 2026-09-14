import {PDFDocument} from 'pdf-lib'
import {getA4Placement} from './createA4Page'
import type {ScanQualityPreset} from '../../types'

type Mode='png'|'jpeg'
type Pass={dpi:number;quality:number;mode:Mode}

async function rasterFromBlob(source:Blob,pass:Pass){
  const bitmap=await createImageBitmap(source)
  try{
    const landscape=bitmap.width>bitmap.height
    const targetW=Math.round((landscape?11.69:8.27)*pass.dpi),targetH=Math.round((landscape?8.27:11.69)*pass.dpi)
    const scale=Math.min(1,targetW/bitmap.width,targetH/bitmap.height)
    const w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale))
    const c=document.createElement('canvas');c.width=w;c.height=h
    const x=c.getContext('2d')!;x.fillStyle='#fff';x.fillRect(0,0,w,h);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(bitmap,0,0,w,h)
    // IMPORTANT: never re-threshold here. Grayscale anti-aliasing is part of text quality.
    const mime=pass.mode==='png'?'image/png':'image/jpeg'
    const blob=await new Promise<Blob>((resolve,reject)=>c.toBlob(v=>v?resolve(v):reject(new Error('Image encoding failed')),mime,pass.quality))
    c.width=c.height=1;return blob
  }finally{bitmap.close()}
}

async function build(images:Blob[],pass:Pass){
  const pdf=await PDFDocument.create(),rasters:Blob[]=[]
  for(const source of images){
    const raster=await rasterFromBlob(source,pass);rasters.push(raster)
    const bytes=await raster.arrayBuffer(),img=pass.mode==='png'?await pdf.embedPng(bytes):await pdf.embedJpg(bytes)
    const place=getA4Placement(img.width,img.height,3),p=pdf.addPage([place.pageWidth,place.pageHeight])
    p.drawImage(img,{x:place.x,y:place.y,width:place.width,height:place.height})
    await new Promise(r=>setTimeout(r,0))
  }
  return{bytes:await pdf.save({useObjectStreams:true}),rasters}
}

function normalPasses(preset:ScanQualityPreset):Pass[]{
  if(preset==='pure-bw')return[
    {dpi:300,quality:1,mode:'png'},{dpi:250,quality:1,mode:'png'},{dpi:220,quality:1,mode:'png'},{dpi:200,quality:1,mode:'png'}
  ]
  if(preset==='small')return[
    {dpi:250,quality:1,mode:'png'},{dpi:250,quality:.90,mode:'jpeg'},{dpi:250,quality:.85,mode:'jpeg'},
    {dpi:220,quality:1,mode:'png'},{dpi:220,quality:.88,mode:'jpeg'},{dpi:220,quality:.82,mode:'jpeg'},
    {dpi:200,quality:1,mode:'png'},{dpi:200,quality:.82,mode:'jpeg'},{dpi:200,quality:.75,mode:'jpeg'}
  ]
  // Clear Document: resolution is protected first. Compression quality is reduced before DPI.
  return[
    {dpi:300,quality:1,mode:'png'},
    {dpi:300,quality:.92,mode:'jpeg'},{dpi:300,quality:.88,mode:'jpeg'},{dpi:300,quality:.84,mode:'jpeg'},{dpi:300,quality:.80,mode:'jpeg'},
    {dpi:250,quality:1,mode:'png'},{dpi:250,quality:.90,mode:'jpeg'},{dpi:250,quality:.85,mode:'jpeg'},{dpi:250,quality:.80,mode:'jpeg'},
    {dpi:220,quality:1,mode:'png'},{dpi:220,quality:.88,mode:'jpeg'},{dpi:220,quality:.82,mode:'jpeg'},{dpi:220,quality:.76,mode:'jpeg'},
    {dpi:200,quality:1,mode:'png'},{dpi:200,quality:.85,mode:'jpeg'},{dpi:200,quality:.80,mode:'jpeg'},{dpi:200,quality:.75,mode:'jpeg'}
  ]
}

export async function optimizePdfSize(images:Blob[],targetBytes=2*1024*1024,onProgress?:(n:number)=>void,preset:ScanQualityPreset='clear',force=false){
  const passes=[...normalPasses(preset)]
  if(force)passes.push(
    {dpi:180,quality:.72,mode:'jpeg'},{dpi:165,quality:.66,mode:'jpeg'},{dpi:150,quality:.60,mode:'jpeg'},{dpi:135,quality:.54,mode:'jpeg'},{dpi:120,quality:.48,mode:'jpeg'}
  )
  let best:{bytes:Uint8Array;rasters:Blob[];pass:Pass}|undefined
  for(let i=0;i<passes.length;i++){
    onProgress?.(Math.round(i/passes.length*100))
    const built=await build(images,passes[i]);best={...built,pass:passes[i]}
    if(built.bytes.byteLength<=targetBytes){onProgress?.(100);return{bytes:built.bytes,previewBlobs:built.rasters,underLimit:true,dpi:passes[i].dpi,quality:passes[i].quality,encoding:passes[i].mode,forced:force}}
  }
  onProgress?.(100)
  return{bytes:best!.bytes,previewBlobs:best!.rasters,underLimit:false,dpi:best!.pass.dpi,quality:best!.pass.quality,encoding:best!.pass.mode,forced:force}
}
