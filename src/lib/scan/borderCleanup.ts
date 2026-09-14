/** Conservative 0–2% edge cleanup. It trims only when outer strips are clearly darker than the inner paper. */
export function borderCleanup(source:HTMLCanvasElement){
 const x=source.getContext('2d',{willReadFrequently:true})!,w=source.width,h=source.height,d=x.getImageData(0,0,w,h).data
 const lum=(px:number,py:number)=>{const i=(py*w+px)*4;return .2126*d[i]+.7152*d[i+1]+.0722*d[i+2]}
 const avgStrip=(side:'t'|'b'|'l'|'r',frac:number)=>{let s=0,n=0,th=Math.max(1,Math.round(Math.min(w,h)*frac));if(side==='t'||side==='b'){for(let yy=0;yy<th;yy+=2)for(let xx=0;xx<w;xx+=6){s+=lum(xx,side==='t'?yy:h-1-yy);n++}}else{for(let xx=0;xx<th;xx+=2)for(let yy=0;yy<h;yy+=6){s+=lum(side==='l'?xx:w-1-xx,yy);n++}}return s/Math.max(1,n)}
 const inner=(avgStrip('t',.08)+avgStrip('b',.08)+avgStrip('l',.08)+avgStrip('r',.08))/4,threshold=inner-38
 let trimT=0,trimB=0,trimL=0,trimR=0;for(const f of [.005,.01,.015,.02]){if(avgStrip('t',f)<threshold)trimT=Math.round(h*f);if(avgStrip('b',f)<threshold)trimB=Math.round(h*f);if(avgStrip('l',f)<threshold)trimL=Math.round(w*f);if(avgStrip('r',f)<threshold)trimR=Math.round(w*f)}
 if(!(trimT||trimB||trimL||trimR))return source
 const out=document.createElement('canvas');out.width=w-trimL-trimR;out.height=h-trimT-trimB;out.getContext('2d')!.drawImage(source,trimL,trimT,out.width,out.height,0,0,out.width,out.height);source.width=source.height=1;return out
}
