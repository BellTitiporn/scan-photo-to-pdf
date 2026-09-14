export async function canvasToJpeg(canvas:HTMLCanvasElement, quality:number){
  return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image compression failed')),'image/jpeg',quality))
}
export const qualityValue=(q:'Low'|'Medium'|'High')=>q==='Low'?.5:q==='Medium'?.72:.9
