import type {ScanPage,ScanQualityPreset} from '../../types'
import {detectDocumentWithRecovery} from './detectDocument'
import {mapPreviewToOriginal} from './mapCoordinates'
import {cropAndPerspectiveCorrect} from './cropOriginal'
import {borderCleanup} from './borderCleanup'
import {resizeForA4Scan} from './resizeForScan'
import {normalizeLighting} from './normalizeLighting'
import {enhanceDocument} from './enhanceDocument'
import {convertToPureBlackAndWhite,convertToSmartBlackAndWhite} from './blackAndWhite'
import {detailRetention} from './qualityProtection'
import {ManualCropRequiredError,type ScanStage} from './scanPipelineTypes'

const canvasBlob=(c:HTMLCanvasElement)=>new Promise<Blob>((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Unable to encode processed page')),'image/png'))

/**
 * Final scan is always sourced from the ORIGINAL File. The lightweight preview is used only
 * to detect/adjust normalized corners. Full pages are processed sequentially.
 */
export async function processLargeDocument(page:ScanPage,pageNumber:number,total:number,onStatus?:(stage:ScanStage,page:number,total:number,progress?:number)=>void,preset:ScanQualityPreset='clear'){
  onStatus?.('Reading original image...',pageNumber,total,Math.round((pageNumber-1)/total*66));await new Promise(r=>setTimeout(r,0))
  let previewCorners=page.corners,usedFallback=false
  if(!page.manualCrop){
    onStatus?.('Detecting A4 document...',pageNumber,total)
    const d=await detectDocumentWithRecovery(page.sourceUrl)
    if(!d.corners)throw new ManualCropRequiredError(page.id,pageNumber)
    previewCorners=d.corners;usedFallback=d.fallback
  }
  onStatus?.('Cropping original document...',pageNumber,total)
  const originalCorners=mapPreviewToOriginal(previewCorners,page.width,page.height,page.originalWidth,page.originalHeight)
  onStatus?.('Correcting perspective...',pageNumber,total)
  // The crop is decoded from the original Blob, never from the preview image.
  let c=await cropAndPerspectiveCorrect(page.sourceFile,originalCorners,page.originalWidth,page.originalHeight,4200)
  c=borderCleanup(c)

  onStatus?.('Normalizing lighting...',pageNumber,total)
  let next=normalizeLighting(c);if(next!==c)c.width=c.height=1;c=next
  onStatus?.('Enhancing text...',pageNumber,total)
  next=enhanceDocument(c);if(next!==c)c.width=c.height=1;c=next

  onStatus?.('Protecting text quality...',pageNumber,total)
  if(preset==='pure-bw'){
    next=convertToPureBlackAndWhite(c)
    if(next!==c)c.width=c.height=1;c=next
  }else{
    const smart=convertToSmartBlackAndWhite(c)
    const retention=detailRetention(c,smart)
    // Clear Document automatically rejects cleanup that removes too much fine detail.
    if(retention.acceptable){c.width=c.height=1;c=smart}else{smart.width=smart.height=1}
  }

  const targetDpi=preset==='small'?250:300
  onStatus?.(`Resizing once to ${targetDpi} DPI...` as ScanStage,pageNumber,total)
  next=resizeForA4Scan(c,targetDpi);c=next
  const blob=await canvasBlob(c);c.width=c.height=1
  await new Promise(r=>setTimeout(r,0))
  return{blob,usedFallback}
}
