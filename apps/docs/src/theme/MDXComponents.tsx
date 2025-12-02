import MDXComponents from "@theme-original/MDXComponents";

import { DocMetadata } from "../components/DocMetadata";
import {
  SlideDeck,
  SlideSection,
  DocumentDownload,
  DownloadButton,
} from "../components/Downloads";
import {
  PhaseFilter,
  PhaseIndicator,
  PhaseBanner,
} from "../components/PhaseFilter";

export default {
  ...MDXComponents,
  DocMetadata,
  // Download/Slide deck components
  SlideDeck,
  SlideSection,
  DocumentDownload,
  DownloadButton,
  // Phase filter components
  PhaseFilter,
  PhaseIndicator,
  PhaseBanner,
};
