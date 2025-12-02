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

// Presentation Mode component
export { default as PresentationMode } from "./PresentationMode";

// Chart component for data visualization in slides
export { default as SlideChart, createChartData } from "./SlideChart";
export type { ChartType, ChartDataPoint } from "./SlideChart";

// Slide templates and helpers
export {
  autoNumberSlides,
  createProblemSolutionSlides,
  createBeforeAfterSlide,
  createTimelineSlide,
  createComparisonSlide,
  createStatsSlide,
  createTeamSlide,
  createTestimonialSlide,
  createCallToActionSlide,
  createThankYouSlide,
  createSectionDivider,
  createCodeSlide,
  slide,
  buildPresentation,
} from "./slideTemplates";
export type { SlideTemplateType, SlideTemplateConfig } from "./slideTemplates";

// Type exports from SlideDeckDownload
export type {
  Slide,
  KeyPoint,
  SlideLayout,
  ColorTheme,
  ColorPalette,
} from "./SlideDeckDownload";

// Slide deck data exports (for modal approach)
export { week48Slides, week48Meta } from "./slidedecks/week48-slides";
export {
  presentationMaterialsSlides,
  presentationMaterialsMeta,
} from "./slidedecks/presentation-materials-slides";
