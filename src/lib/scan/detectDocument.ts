import type {Corners} from '../../types'
import {detectA4Document} from './detectA4'
import {A4_RATIO} from './constants'

async function enhancedPreview(blob:Blob){const bitmap=await createImageBitmap(blob);try{const c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;const x=c.getContext('2d')!;x.filter='contrast(165%) brightness(108%)';x.drawImage(bitmap,0,0);return await new Promise<Blob>((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Preview enhancement failed')),'image/jpeg',.9))}finally{bitmap.close()}}
export async function detectDocumentWithRecovery(previewUrl:string):Promise<{corners:Corners|null;confidence:number;fallback:boolean}>{
 const blob=await (await fetch(previewUrl)).blob();const first=await detectA4Document(blob);if(first.corners&&first.confidence>=.42)return{corners:first.corners,confidence:first.confidence,fallback:false}
 const enhanced=await enhancedPreview(blob),second=await detectA4Document(enhanced);if(second.corners&&second.confidence>=.34)return{corners:second.corners,confidence:second.confidence,fallback:false}
 // Image-boundary fallback is safe only when the photo itself is already very A4-like.
 const bmp=await createImageBitmap(blob);try{const r=Math.max(bmp.width,bmp.height)/Math.min(bmp.width,bmp.height);if(Math.abs(r-A4_RATIO)<.09){const m=.012;return{corners:{tl:{x:bmp.width*m,y:bmp.height*m},tr:{x:bmp.width*(1-m),y:bmp.height*m},br:{x:bmp.width*(1-m),y:bmp.height*(1-m)},bl:{x:bmp.width*m,y:bmp.height*(1-m)}},confidence:.3,fallback:true}}}finally{bmp.close()}
 return{corners:null,confidence:0,fallback:false}
}
