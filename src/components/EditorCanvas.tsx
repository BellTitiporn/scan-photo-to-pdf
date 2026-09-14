import { useEffect,useRef,useState } from 'react'
import type { Corners,Point,ScanPage } from '../types'
import { renderPage } from '../imageProcessing/render'

export default function EditorCanvas({page,onCorners}:{page:ScanPage;onCorners:(c:Corners)=>void}){
  const wrap=useRef<HTMLDivElement>(null),canvasRef=useRef<HTMLCanvasElement>(null),[preview,setPreview]=useState<string>(''),[drag,setDrag]=useState<keyof Corners|null>(null)
  useEffect(()=>{let dead=false;renderPage(page,1300).then(c=>{if(dead)return;setPreview(c.toDataURL('image/jpeg',.88))});return()=>{dead=true}},[page])
  const coords=(p:Point)=>{const r=wrap.current?.getBoundingClientRect();if(!r)return{x:0,y:0};const iw=page.width,ih=page.height,s=Math.min(r.width/iw,r.height/ih),dw=iw*s,dh=ih*s,ox=(r.width-dw)/2,oy=(r.height-dh)/2;return{x:ox+p.x*s,y:oy+p.y*s}}
  const fromClient=(x:number,y:number)=>{const r=wrap.current!.getBoundingClientRect(),s=Math.min(r.width/page.width,r.height/page.height),dw=page.width*s,dh=page.height*s,ox=(r.width-dw)/2,oy=(r.height-dh)/2;return{x:Math.max(0,Math.min(page.width,(x-r.left-ox)/s)),y:Math.max(0,Math.min(page.height,(y-r.top-oy)/s))}}
  const pts=['tl','tr','br','bl'] as (keyof Corners)[]
  return <div className="flex h-full min-h-[420px] flex-col gap-3">
    <div ref={wrap} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-slate-900 p-3 select-none" onPointerMove={e=>{if(!drag)return;onCorners({...page.corners,[drag]:fromClient(e.clientX,e.clientY)})}} onPointerUp={()=>setDrag(null)} onPointerLeave={()=>setDrag(null)}>
      <img src={page.sourceUrl} alt="Source document" className="max-h-full max-w-full object-contain opacity-75"/>
      <svg className="pointer-events-none absolute inset-0 h-full w-full"><polygon points={pts.map(k=>{const p=coords(page.corners[k]);return `${p.x},${p.y}`}).join(' ')} fill="rgba(37,99,235,.16)" stroke="#60a5fa" strokeWidth="2"/></svg>
      {pts.map(k=>{const p=coords(page.corners[k]);return <button key={k} aria-label={`Adjust ${k} crop corner`} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setDrag(k)}} className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-blue-600 shadow" style={{left:p.x,top:p.y}}/>})}
    </div>
    <div className="rounded-xl border bg-white p-2"><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Processed preview</div>{preview?<img src={preview} alt="Processed preview" className="mx-auto max-h-44 rounded-md object-contain"/>:<div className="h-24 animate-pulse rounded bg-slate-100"/>}</div>
    <canvas ref={canvasRef} className="hidden"/>
  </div>
}
