export type ScanStage=
  |'Reading original image...'
  |'Creating optimized preview...'
  |'Detecting A4 document...'
  |'Cropping original document...'
  |'Correcting perspective...'
  |'Normalizing lighting...'
  |'Enhancing text...'
  |'Protecting text quality...'
  |'Resizing once to 300 DPI...'
  |'Resizing once to 250 DPI...'
  |'Optimizing PDF...'
  |'Creating final file...'
export class ManualCropRequiredError extends Error{constructor(public pageId:string,public pageNumber:number){super(`Document edges could not be detected on page ${pageNumber}. Adjust the four corners manually.`);this.name='ManualCropRequiredError'}}
