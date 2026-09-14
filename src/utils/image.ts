import type { Corners, ScanPage } from '../types'
import { createOptimizedPreview } from '../lib/scan/createPreview'
import { LARGE_IMAGE_THRESHOLD, MAX_SOURCE_FILE_SIZE } from '../lib/scan/constants'
import { createClientId } from './id'

export const defaultAdjustments = { brightness: 0, contrast: 0, saturation: 0, sharpness: 0 }
export const defaultCorners = (w: number, h: number): Corners => ({
  tl: { x: w * .04, y: h * .04 }, tr: { x: w * .96, y: h * .04 },
  br: { x: w * .96, y: h * .96 }, bl: { x: w * .04, y: h * .96 },
})
export const formatBytes=(bytes:number)=>bytes>=1024*1024?`${(bytes/1024/1024).toFixed(1)} MB`:`${Math.max(1,Math.round(bytes/1024))} KB`

export function validateSourceFile(file:File){
  const ext=file.name.split('.').pop()?.toLowerCase()||''
  const accepted=['jpg','jpeg','png','webp','heic','heif'].includes(ext)||['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(file.type)
  if(!accepted)throw new Error(`${file.name}: unsupported image format.`)
  if(file.size>MAX_SOURCE_FILE_SIZE)throw new Error(`${file.name}: This image is larger than the 150 MB limit.`)
}

export async function loadImage(url: string): Promise<HTMLImageElement> { const img = new Image(); img.decoding='async'; img.src=url; await img.decode(); return img }

/** Only a lightweight preview is decoded for UI. The original File stays untouched as a Blob. */
export async function fileToPage(file: File): Promise<ScanPage> {
  validateSourceFile(file)
  let preview
  try{preview=await createOptimizedPreview(file)}catch(e){
    if(/\.hei[cf]$/i.test(file.name)) throw new Error(`${file.name}: HEIC/HEIF decoding is not available in this browser. Convert it to JPEG/PNG or use a browser with HEIC support.`)
    throw e
  }
  const url=URL.createObjectURL(preview.blob)
  return {
    id: createClientId('page'), name: file.name, sourceUrl: url, sourceFile:file, fileSize:file.size,
    width:preview.width,height:preview.height,originalWidth:preview.originalWidth,originalHeight:preview.originalHeight,
    largeImage:file.size>=LARGE_IMAGE_THRESHOLD || Math.max(preview.originalWidth,preview.originalHeight)>12000,
    manualCrop:false,corners:defaultCorners(preview.width,preview.height),rotation:0,flipX:false,flipY:false,
    filter:'auto',adjustments:{...defaultAdjustments},
  }
}

export function downloadBlob(blob: Blob, filename: string) { const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000) }
