/** Progressive 2× downsampling used when createImageBitmap resize options are unavailable. */
export function progressiveResizeBitmap(bitmap:ImageBitmap,targetWidth:number,targetHeight:number){
 let source:CanvasImageSource=bitmap,currentW=bitmap.width,currentH=bitmap.height,owned:HTMLCanvasElement|null=null
 while(currentW>targetWidth*2||currentH>targetHeight*2){const scale=Math.max(targetWidth/currentW,targetHeight/currentH,.5),w=Math.max(targetWidth,Math.round(currentW*scale)),h=Math.max(targetHeight,Math.round(currentH*scale)),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d')!;x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(source,0,0,w,h);if(owned){owned.width=owned.height=1}owned=c;source=c;currentW=w;currentH=h}
 const out=document.createElement('canvas');out.width=targetWidth;out.height=targetHeight;const x=out.getContext('2d')!;x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(source,0,0,targetWidth,targetHeight);if(owned){owned.width=owned.height=1}return out
}
