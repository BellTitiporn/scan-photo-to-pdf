import { useEffect,useRef,useState } from 'react'
import { Camera, X } from 'lucide-react'
export default function CameraModal({open,onClose,onCapture}:{open:boolean,onClose:()=>void,onCapture:(f:File)=>void}){
 const video=useRef<HTMLVideoElement>(null),[err,setErr]=useState('')
 useEffect(()=>{if(!open)return;let stream:MediaStream|undefined;navigator.mediaDevices?.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false}).then(s=>{stream=s;if(video.current){video.current.srcObject=s;video.current.play()}}).catch(()=>setErr('Camera permission denied or unavailable. You can still upload a photo instead.'));return()=>stream?.getTracks().forEach(t=>t.stop())},[open])
 if(!open)return null
 const snap=()=>{const v=video.current;if(!v)return;const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d')!.drawImage(v,0,0);c.toBlob(b=>{if(b)onCapture(new File([b],`camera-${Date.now()}.jpg`,{type:'image/jpeg'}))},'image/jpeg',.95)}
 return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><div className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-xl"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Capture document</h2><button onClick={onClose} aria-label="Close camera"><X/></button></div>{err?<div className="rounded-xl bg-amber-50 p-4 text-amber-900">{err}</div>:<video ref={video} playsInline className="aspect-[4/3] w-full rounded-xl bg-black object-cover"/>}<button disabled={!!err} onClick={snap} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-40"><Camera/>Take Photo</button></div></div>
}
