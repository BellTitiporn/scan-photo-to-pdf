export type ImageDimensions = { width: number; height: number }

async function readJpegDimensions(file: Blob): Promise<ImageDimensions | null> {
  const max = Math.min(file.size, 1024 * 1024)
  const buffer = await file.slice(0, max).arrayBuffer()
  const view = new DataView(buffer)
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null
  let offset = 2
  while (offset + 9 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) { offset++; continue }
    const marker = view.getUint8(offset + 1)
    if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue }
    if (offset + 4 > view.byteLength) break
    const length = view.getUint16(offset + 2)
    const sof = [0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)
    if (sof && offset + 8 < view.byteLength) return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) }
    if (length < 2) break
    offset += 2 + length
  }
  return null
}

async function readPngDimensions(file: Blob): Promise<ImageDimensions | null> {
  const b = await file.slice(0, 32).arrayBuffer(), v = new DataView(b)
  if (v.byteLength < 24 || v.getUint32(0) !== 0x89504e47) return null
  return { width: v.getUint32(16), height: v.getUint32(20) }
}

async function readWebpDimensions(file: Blob): Promise<ImageDimensions | null> {
  const b=await file.slice(0,64).arrayBuffer(),v=new DataView(b)
  if(v.byteLength<30)return null
  const ascii=(o:number,n:number)=>Array.from(new Uint8Array(b,o,n)).map(x=>String.fromCharCode(x)).join('')
  if(ascii(0,4)!=='RIFF'||ascii(8,4)!=='WEBP')return null
  if(ascii(12,4)==='VP8X')return{width:1+(v.getUint8(24)|(v.getUint8(25)<<8)|(v.getUint8(26)<<16)),height:1+(v.getUint8(27)|(v.getUint8(28)<<8)|(v.getUint8(29)<<16))}
  return null
}

export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  const type=file.type.toLowerCase();let d:ImageDimensions|null=null
  if(type.includes('jpeg')||/\.jpe?g$/i.test(file.name))d=await readJpegDimensions(file)
  else if(type.includes('png')||/\.png$/i.test(file.name))d=await readPngDimensions(file)
  else if(type.includes('webp')||/\.webp$/i.test(file.name))d=await readWebpDimensions(file)
  if(d?.width&&d?.height)return d
  const bitmap=await createImageBitmap(file);try{return{width:bitmap.width,height:bitmap.height}}finally{bitmap.close()}
}
