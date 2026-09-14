import type {ScanPage,ScanQualityPreset} from '../../types'
import {optimizePdfSize} from './optimizePdfSize'
import {TARGET_PDF_BYTES} from './constants'
import {processLargeDocument} from './largeImagePipeline'
export {ManualCropRequiredError} from './scanPipelineTypes'
export type {ScanStage} from './scanPipelineTypes'
import type {ScanStage} from './scanPipelineTypes'

/** Sequential multi-page pipeline. Readability-preserving processing is default. */
export async function scanToPdf(pages:ScanPage[],onStatus?:(stage:ScanStage,page:number,total:number,progress?:number)=>void,preset:ScanQualityPreset='clear',forceCompression=false){
  const processed:Blob[]=[];let usedFallback=false
  try{
    for(let i=0;i<pages.length;i++){
      const r=await processLargeDocument(pages[i],i+1,pages.length,onStatus,preset);processed.push(r.blob);usedFallback ||= r.usedFallback
    }
    onStatus?.('Optimizing PDF...',pages.length,pages.length,72)
    const result=await optimizePdfSize(processed,TARGET_PDF_BYTES,p=>onStatus?.('Optimizing PDF...',pages.length,pages.length,72+Math.round(p*.26)),preset,forceCompression)
    const previewUrls=result.previewBlobs.map(URL.createObjectURL)
    onStatus?.('Creating final file...',pages.length,pages.length,100)
    return{blob:new Blob([result.bytes],{type:'application/pdf'}),previewUrls,usedFallback,...result}
  }catch(e){throw e}
}
