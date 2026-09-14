import type { ScanPage } from '../types'
import { perspectiveCanvas } from './perspective'
import { applyProcessing, transformCanvas } from './filters'
export async function renderPage(page:ScanPage,maxDimension=1800){
  let c=await perspectiveCanvas(page.sourceUrl,page.corners,maxDimension)
  c=applyProcessing(c,page.filter,page.adjustments)
  c=transformCanvas(c,page.rotation,page.flipX,page.flipY)
  return c
}
