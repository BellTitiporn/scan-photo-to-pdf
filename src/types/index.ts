export type ScanQualityPreset = 'clear' | 'small' | 'pure-bw'
export type Point = { x: number; y: number }
export type NormalizedPoint = { x: number; y: number }
export type Corners = { tl: Point; tr: Point; br: Point; bl: Point }
export type NormalizedCorners = { tl: NormalizedPoint; tr: NormalizedPoint; br: NormalizedPoint; bl: NormalizedPoint }
export type FilterMode = 'original' | 'color' | 'grayscale' | 'bw' | 'auto'
export type Adjustments = { brightness: number; contrast: number; saturation: number; sharpness: number }
export type ScanPage = {
  id: string
  name: string
  /** Lightweight preview object URL. Never a base64 copy of the source. */
  sourceUrl: string
  /** Original File is kept as a Blob and decoded only when this page is processed. */
  sourceFile: File
  fileSize: number
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  largeImage: boolean
  manualCrop: boolean
  corners: Corners
  rotation: number
  flipX: boolean
  flipY: boolean
  filter: FilterMode
  adjustments: Adjustments
}
export type ExportOptions = {
  filename: string
  pageSize: 'A4' | 'Letter' | 'Legal' | 'Fit Image'
  orientation: 'Auto' | 'Portrait' | 'Landscape'
  margins: 'None' | 'Small' | 'Normal'
  quality: 'Low' | 'Medium' | 'High'
  color: 'Original' | 'Grayscale' | 'Black & White'
  maxSize: number | null
}
