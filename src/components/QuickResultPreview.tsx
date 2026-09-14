import {ChevronLeft,ChevronRight,X} from 'lucide-react'
import {useEffect,useState} from 'react'

export default function QuickResultPreview({open,urls,onClose}:{open:boolean;urls:string[];onClose:()=>void}){
  const[i,setI]=useState(0),[zoom,setZoom]=useState<1|2|3>(1)
  useEffect(()=>{if(i>=urls.length)setI(Math.max(0,urls.length-1))},[urls.length,i])
  if(!open)return null
  return <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 text-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-3">
      <div className="font-semibold">Final PDF image · Page {urls.length?i+1:0} of {urls.length}</div>
      <div className="flex items-center gap-2">
        {[1,2,3].map(z=><button key={z} onClick={()=>setZoom(z as 1|2|3)} className={`rounded-lg px-3 py-1.5 text-sm ${zoom===z?'bg-white text-slate-900':'bg-white/10'}`}>{z*100}%</button>)}
        <button onClick={onClose} className="rounded-lg bg-white/10 p-2" aria-label="Close final preview"><X/></button>
      </div>
    </div>
    <div className="relative min-h-0 flex-1 overflow-auto p-6 text-center">
      {urls[i]&&<img src={urls[i]} alt={`Final PDF page ${i+1}`} className="mx-auto bg-white shadow-2xl" style={{width:`${100*zoom}%`,maxWidth:'none',transformOrigin:'top center'}}/>}
      <button disabled={i===0} onClick={()=>setI(v=>v-1)} className="fixed left-4 top-1/2 rounded-full bg-white/15 p-3 disabled:opacity-20"><ChevronLeft/></button>
      <button disabled={i>=urls.length-1} onClick={()=>setI(v=>v+1)} className="fixed right-4 top-1/2 rounded-full bg-white/15 p-3 disabled:opacity-20"><ChevronRight/></button>
    </div>
  </div>
}
