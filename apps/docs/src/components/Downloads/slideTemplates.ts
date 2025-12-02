import type { Slide, KeyPoint } from "./SlideDeckDownload";

/**
 * Slide template types for common presentation patterns
 */
export type SlideTemplateType =
  | "problem-solution"
  | "before-after"
  | "timeline"
  | "comparison"
  | "stats"
  | "team"
  | "testimonial"
  | "call-to-action"
  | "agenda"
  | "thank-you";

/**
 * Template configuration for generating pre-built slides
 */
export interface SlideTemplateConfig {
  type: SlideTemplateType;
  data: Record<string, unknown>;
}

/**
 * Auto-number slides - takes slides without numbers and assigns them sequentially
 */
export function autoNumberSlides(
  slides: Omit<Slide, "number">[],
): Slide[] {
  return slides.map((slide, index) => ({
    ...slide,
    number: index + 1,
  }));
}

/**
 * Create a Problem/Solution slide pair
 */
export function createProblemSolutionSlides(config: {
  problemTitle?: string;
  problemPoints: string[];
  problemIcon?: string;
  solutionTitle?: string;
  solutionPoints: string[];
  solutionIcon?: string;
  duration?: number;
}): Omit<Slide, "number">[] {
  return [
    {
      title: config.problemTitle || "The Problem",
      duration: config.duration || 45,
      icon: config.problemIcon || "\u{26A0}", // ⚠️
      keyPoints: config.problemPoints,
    },
    {
      title: config.solutionTitle || "Our Solution",
      duration: config.duration || 45,
      icon: config.solutionIcon || "\u{1F4A1}", // 💡
      keyPoints: config.solutionPoints,
    },
  ];
}

/**
 * Create a Before/After comparison slide
 */
export function createBeforeAfterSlide(config: {
  title?: string;
  beforeTitle?: string;
  beforePoints: string[];
  afterTitle?: string;
  afterPoints: string[];
  duration?: number;
  icon?: string;
}): Omit<Slide, "number"> {
  return {
    title: config.title || "Before & After",
    duration: config.duration || 60,
    icon: config.icon || "\u{1F504}", // 🔄
    layout: "two-column",
    keyPoints: [],
    leftColumnTitle: config.beforeTitle || "Before",
    leftColumn: config.beforePoints,
    rightColumnTitle: config.afterTitle || "After",
    rightColumn: config.afterPoints,
  };
}

/**
 * Create a Timeline slide
 */
export function createTimelineSlide(config: {
  title?: string;
  milestones: Array<{ date: string; event: string }>;
  duration?: number;
  icon?: string;
}): Omit<Slide, "number"> {
  const keyPoints: KeyPoint[] = config.milestones.map((m) => ({
    text: `**${m.date}** - ${m.event}`,
  }));

  return {
    title: config.title || "Timeline",
    duration: config.duration || 60,
    icon: config.icon || "\u{1F4C5}", // 📅
    keyPoints,
  };
}

/**
 * Create a Comparison slide (e.g., Us vs. Competitors)
 */
export function createComparisonSlide(config: {
  title?: string;
  leftTitle: string;
  leftPoints: string[];
  rightTitle: string;
  rightPoints: string[];
  duration?: number;
  icon?: string;
}): Omit<Slide, "number"> {
  return {
    title: config.title || "Comparison",
    duration: config.duration || 60,
    icon: config.icon || "\u{2696}", // ⚖️
    layout: "two-column",
    keyPoints: [],
    leftColumnTitle: config.leftTitle,
    leftColumn: config.leftPoints,
    rightColumnTitle: config.rightTitle,
    rightColumn: config.rightPoints,
  };
}

/**
 * Create a Stats/Metrics slide
 */
export function createStatsSlide(config: {
  title?: string;
  stats: Array<{ value: string; label: string }>;
  duration?: number;
  icon?: string;
}): Omit<Slide, "number"> {
  const keyPoints: KeyPoint[] = config.stats.map((s) => ({
    text: `**${s.value}** ${s.label}`,
  }));

  return {
    title: config.title || "Key Metrics",
    duration: config.duration || 45,
    icon: config.icon || "\u{1F4CA}", // 📊
    keyPoints,
  };
}

/**
 * Create a Team slide
 */
export function createTeamSlide(config: {
  title?: string;
  members: Array<{ name: string; role: string; bio?: string }>;
  duration?: number;
  icon?: string;
}): Omit<Slide, "number"> {
  const keyPoints: KeyPoint[] = config.members.map((m) => ({
    text: `**${m.name}** - ${m.role}`,
    subPoints: m.bio ? [m.bio] : undefined,
  }));

  return {
    title: config.title || "Our Team",
    duration: config.duration || 60,
    icon: config.icon || "\u{1F465}", // 👥
    keyPoints,
  };
}

/**
 * Create a Testimonial/Quote slide
 */
export function createTestimonialSlide(config: {
  quote: string;
  author: string;
  title?: string;
  duration?: number;
  icon?: string;
}): Omit<Slide, "number"> {
  return {
    title: config.title || "What People Say",
    duration: config.duration || 30,
    icon: config.icon || "\u{1F4AC}", // 💬
    layout: "quote",
    keyPoints: [config.quote],
    quoteAuthor: config.author,
  };
}

/**
 * Create a Call-to-Action slide
 */
export function createCallToActionSlide(config: {
  title?: string;
  mainCta: string;
  supportingPoints?: string[];
  duration?: number;
  icon?: string;
}): Omit<Slide, "number"> {
  return {
    title: config.title || "Next Steps",
    duration: config.duration || 30,
    icon: config.icon || "\u{1F3AF}", // 🎯
    layout: "title-only",
    keyPoints: [config.mainCta, ...(config.supportingPoints || [])],
  };
}

/**
 * Create a Thank You / Q&A slide
 */
export function createThankYouSlide(config?: {
  title?: string;
  subtitle?: string;
  contactInfo?: string;
  duration?: number;
}): Omit<Slide, "number"> {
  const keyPoints: string[] = [];
  if (config?.subtitle) keyPoints.push(config.subtitle);
  if (config?.contactInfo) keyPoints.push(config.contactInfo);

  return {
    title: config?.title || "Thank You",
    duration: config?.duration || 30,
    icon: "\u{1F64F}", // 🙏
    layout: "title-only",
    keyPoints: keyPoints.length > 0 ? keyPoints : ["Questions?"],
  };
}

/**
 * Create a section divider slide
 */
export function createSectionDivider(config: {
  title: string;
  subtitle?: string;
  icon?: string;
  duration?: number;
}): Omit<Slide, "number"> {
  return {
    title: config.title,
    duration: config.duration || 10,
    icon: config.icon,
    layout: "title-only",
    keyPoints: config.subtitle ? [config.subtitle] : [],
  };
}

/**
 * Create a code demo slide
 */
export function createCodeSlide(config: {
  title: string;
  code: string;
  language?: string;
  explanation?: string[];
  duration?: number;
  icon?: string;
}): Omit<Slide, "number"> {
  return {
    title: config.title,
    duration: config.duration || 60,
    icon: config.icon || "\u{1F4BB}", // 💻
    layout: "code",
    codeBlock: config.code,
    codeLanguage: config.language,
    keyPoints: config.explanation || [],
  };
}

/**
 * Quick slide builder - shorthand for creating simple slides
 */
export function slide(
  title: string,
  keyPoints: KeyPoint[],
  options?: Partial<Omit<Slide, "number" | "title" | "keyPoints">>,
): Omit<Slide, "number"> {
  return {
    title,
    keyPoints,
    duration: options?.duration || 45,
    ...options,
  };
}

/**
 * Build a complete presentation from templates
 */
export function buildPresentation(
  slides: Omit<Slide, "number">[],
  metadata?: {
    addAgenda?: boolean;
    addThankYou?: boolean;
  },
): Slide[] {
  let allSlides = [...slides];

  // Add thank you slide if requested
  if (metadata?.addThankYou) {
    allSlides.push(createThankYouSlide());
  }

  // Auto-number all slides
  return autoNumberSlides(allSlides);
}
