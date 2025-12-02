// Core download components
export { default as DownloadButton } from "./DownloadButton";
export { default as DocumentDownload } from "./DocumentDownload";

// Inline slide deck components (recommended for progress reports)
export { default as SlideDeck } from "./SlideDeck";
export { default as SlideSection } from "./SlideSection";

// Type exports for TypeScript users
export type { SlideDeckProps } from "./SlideDeck";
export type { SlideSectionProps } from "./SlideSection";

// Modal-based slide deck (alternative approach)
export { default as SlideDeckDownload } from "./SlideDeckDownload";
export { default as ProgressReportDownloads } from "./ProgressReportDownloads";

// Slide deck data exports (for modal approach)
export { week48Slides, week48Meta } from "./slidedecks/week48-slides";
export { pitchDeckSlides, pitchDeckMeta } from "./slidedecks/pitch-deck-slides";
export {
  presentationMaterialsSlides,
  presentationMaterialsMeta,
} from "./slidedecks/presentation-materials-slides";
