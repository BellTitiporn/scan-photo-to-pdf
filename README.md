# Scan Photo to PDF

A browser-only React + TypeScript document scanner. The default Quick Scan workflow is intentionally simple:

**Choose Photo → Scan to PDF → Download PDF**

Quick Scan detects an A4 sheet on a lightweight preview, maps the four corners back to the original source, crops away the desk/background, corrects perspective, produces a scanner-style black-and-white page, places it on a true A4 PDF page, and iteratively compresses the complete PDF toward 2 MB.

## Requirements implemented

- JPG/JPEG, PNG, WEBP and browser-decodable HEIC/HEIF
- Source validation up to **150 MB per image**
- Large-image indicator for sources around 20 MB+ or extremely large pixel dimensions
- No Base64 storage for source images
- `File`/`Blob`, `createImageBitmap`, Object URLs, OffscreenCanvas where supported
- Lightweight UI/detection preview (longest edge ~2200 px)
- Two-stage workflow: preview detection → normalized coordinate mapping → original-source crop
- A4-oriented document detection with A4 ratio as a scoring signal
- Automatic crop of surrounding desk/background when a confident page boundary is found
- Perspective correction on the cropped/resized source region, not a full-resolution camera canvas
- Conservative 0–2% border cleanup
- Final document resizing around scanner resolution (roughly 150–200 DPI)
- Adaptive local black-and-white thresholding and lighting normalization
- True A4 PDF dimensions in portrait or landscape
- Iterative whole-document PDF compression toward **≤ 2 MB**
- Manual four-corner fallback using the lightweight preview
- Sequential multi-page source processing to avoid decoding several huge originals simultaneously
- Web Worker + OffscreenCanvas for preview A4 detection when available
- Object URL / ImageBitmap cleanup
- Advanced editor retained for manual controls

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production build

```bash
npm run build
```

## Large-image architecture

```text
src/lib/scan/
├── constants.ts
├── imageMetadata.ts          # Reads common image dimensions without full decode where possible
├── createPreview.ts          # ~2200 px lightweight preview
├── scan.worker.ts            # Worker/OffscreenCanvas preview detector
├── detectA4.ts               # A4-like page candidate detection/scoring
├── detectDocument.ts         # Detection retries + safe fallback
├── mapCoordinates.ts         # Preview ↔ original normalized coordinates
├── cropOriginal.ts           # Blob-region crop before pixel-heavy processing
├── perspectiveTransform.ts   # Projective correction on bounded intermediate image
├── borderCleanup.ts          # Conservative outer-edge cleanup
├── normalizeLighting.ts
├── enhanceDocument.ts
├── blackAndWhite.ts
├── resizeForScan.ts          # Scanner-resolution sizing
├── createA4Page.ts           # True A4 page geometry
├── optimizePdfSize.ts        # Iterative 2 MB compression
├── largeImagePipeline.ts     # One-page sequential processing
├── scanPipelineTypes.ts
└── scanPipeline.ts           # Multi-page sequential orchestration
```

### Memory strategy

The application does **not** draw a 20–50 MP source image to a full-size HTML canvas just to find the page. A small preview is used for UI and A4 detection. Four corner coordinates are normalized, mapped back to the source dimensions, and only the document bounding region is requested from `createImageBitmap`. That region is resized to a safe intermediate dimension before perspective correction.

Pages are processed one-by-one. Once a page is transformed into a compact processed `Blob`, its high-resolution bitmap/canvas is released before the next original file is processed.

### HEIC / HEIF

HEIC/HEIF is accepted when the current browser can decode it through `createImageBitmap`. Browser support varies. If decoding is unavailable, the UI asks the user to convert the source to JPEG/PNG or use a browser with HEIC support.

### PDF size target

Quick Scan starts with approximately 190 DPI and high JPEG quality. If the complete PDF is larger than 2 MB, it iteratively lowers quality/resolution while preserving a default readability floor of about 120 DPI / JPEG quality 0.45. If it still exceeds 2 MB, the UI offers stronger compression below the normal readability floor rather than silently destroying document quality.

## Privacy

All source-image processing and PDF generation happen locally in the browser. No backend is required and document images are not uploaded by this project.

## Browser compatibility note

Page IDs use a compatibility-safe generator: `crypto.randomUUID()` when available, then `crypto.getRandomValues()`, with a local fallback for older/non-secure browser contexts. This prevents image import from failing on browsers that do not implement `crypto.randomUUID`.

## Scan clarity improvements

The Quick Scan pipeline is quality-first for text documents:

- Perspective correction uses bilinear interpolation instead of nearest-neighbor sampling.
- The working scan is retained at up to ~220 DPI before PDF optimization.
- High-resolution reductions are staged and use high-quality interpolation.
- A conservative unsharp mask is applied before adaptive document binarization.
- Adaptive thresholding uses local mean and variance to preserve small/faint characters.
- Black-and-white intermediate pages are encoded losslessly as PNG rather than JPEG.
- PDF optimization first tries 220/200/180 DPI lossless B&W PNG pages. JPEG fallback is used only when required to meet the whole-document size target.
- After any PDF resize, pages are re-binarized so antialiasing does not create fuzzy gray text edges.

The 2 MB target remains best-effort. The optimizer now prioritizes readability and only reduces resolution/quality when the complete PDF cannot fit at a higher-quality pass.

## Text Readability Protection (Clear Document)

Quick Scan now defaults to **Clear Document**. Its quality priority is:

1. Text readability
2. Clean paper appearance
3. PDF file size

The final scan is never generated from the lightweight detection preview. Detection runs on a 1600–2500 px preview, then the normalized four corners are mapped back to the original `File`. The original crop is perspective-corrected and enhanced before the final A4 resize.

Clear Document processing:

`Original File -> Preview detection -> Original crop -> Perspective -> Lighting normalization -> Enhanced grayscale -> Mild edge-preserving denoise -> Mild unsharp mask -> Smart B&W candidate -> Detail-retention check -> Best readable candidate -> 300 DPI A4 -> PDF optimization`

The Smart B&W path is not binary: grayscale anti-aliased edges remain around characters. This is important for small Thai components such as vowels and tone marks. Pure binary thresholding is available only through the explicit **Pure Black & White** preset.

### Output presets

- **Clear Document (Recommended):** 300 DPI default, quality protected, enhanced grayscale / Smart B&W, normal optimizer floor 200 DPI.
- **Small File:** starts around 250 DPI and uses stronger compression while retaining a 200 DPI normal floor.
- **Pure Black & White:** explicit binary threshold mode for suitable text-only documents.

### 2 MB behavior

2 MB is a target, not a reason to destroy text. The normal Clear Document optimizer tries 300 DPI compression first, then 250, 220 and 200 DPI. It does not automatically go below 200 DPI. If the best readable PDF is still over 2 MB, the UI reports that size and keeps **Download PDF** available. **Force Under 2 MB** is a separate user action and is the only path that enables sub-200-DPI / stronger compression passes.

### Final-output preview

The Quick Scan Preview uses the exact raster images selected by the PDF optimizer, rather than a separate higher-quality preview. It includes 100%, 200% and 300% inspection levels for checking small text before download.
