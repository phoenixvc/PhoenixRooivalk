import type {
  Slide,
  KeyPoint,
  ColorTheme,
  ColorPalette,
  TeamMember,
  ProductCard,
} from "../components/Downloads/SlideDeckDownload";

/** Branded text for slide decks - Phoenix Rooivalk */
const SLIDE_DECK_BRAND_NAME = "PhoenixRooivalk";
const SLIDE_DECK_BRAND_TEXT = "PR"; // Phoenix Rooivalk initials for small areas
const SLIDE_DECK_TAGLINE = "Advanced counter drone defence systems\nfor military and civilian";
const SLIDE_DECK_URL = "https://docs.phoenixrooivalk.com/";

// SVG logo as string for conversion to PNG
const LOGO_SVG = `<svg width="128" height="128" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="phoenix-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fb923c;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="20" cy="20" r="18" fill="url(#phoenix-gradient)" stroke="#0f172a" stroke-width="2"/>
  <path d="M20 8 L24 16 L28 12 L26 20 L32 18 L28 24 L30 28 L24 26 L20 32 L16 26 L10 28 L12 24 L8 18 L14 20 L12 12 L16 16 L20 8 Z"
        fill="#0f172a" stroke="#f97316" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M20 6 L26 10 L24 16 L20 20 L16 16 L14 10 L20 6 Z"
        fill="none" stroke="#f97316" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="20" cy="20" r="3" fill="#0f172a"/>
</svg>`;

/**
 * Convert SVG string to PNG data URL using canvas
 */
async function svgToPngDataUrl(svgString: string, width = 128, height = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG"));
    };

    img.src = url;
  });
}

/**
 * Sanitize video path to prevent path traversal attacks
 * Only allows paths starting with / or relative paths without ..
 */
function sanitizeVideoPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  // Remove any path traversal attempts
  const sanitized = path
    .replace(/\.\./g, "") // Remove ..
    .replace(/\/\//g, "/") // Remove double slashes
    .trim();
  // Only allow paths starting with / or alphanumeric
  if (!/^[\/a-zA-Z0-9]/.test(sanitized)) return undefined;
  return sanitized;
}

/**
 * Sanitize text content for speaker notes to prevent injection
 */
function sanitizeTextContent(text: string | undefined): string {
  if (!text) return "";
  return text
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .trim();
}

/**
 * pptxgenjs shape type - using string literal type for better type safety
 * Note: pptxgenjs types are incomplete, so we use this type alias
 */
type PptxShape = "rect" | "ellipse" | "triangle" | "line" | "arc";

/**
 * Color theme presets
 */
const COLOR_THEMES: Record<ColorTheme, ColorPalette> = {
  default: {
    primary: "F97316", // Orange
    accent: "FBB928", // Amber
    dark: "0F172A", // Dark blue
    darker: "090A0F", // Darker
    text: "FFFFFF", // White
    textSecondary: "CBD5E1", // Light gray
    textMuted: "94A3B8", // Muted gray
  },
  investor: {
    primary: "F97316", // Phoenix Orange
    accent: "FBBF24", // Phoenix Amber
    dark: "1E293B", // Slate
    darker: "0F172A", // Darker slate
    text: "FFFFFF",
    textSecondary: "E2E8F0",
    textMuted: "94A3B8",
  },
  technical: {
    primary: "10B981", // Green
    accent: "34D399", // Light green
    dark: "0D1117", // GitHub dark
    darker: "010409", // Darker
    text: "C9D1D9",
    textSecondary: "8B949E",
    textMuted: "6E7681",
  },
  military: {
    primary: "65A30D", // Lime
    accent: "84CC16", // Light lime
    dark: "1C1917", // Stone dark
    darker: "0C0A09", // Darker stone
    text: "D6D3D1",
    textSecondary: "A8A29E",
    textMuted: "78716C",
  },
  light: {
    primary: "2563EB", // Blue
    accent: "3B82F6", // Light blue
    dark: "FFFFFF", // White
    darker: "F1F5F9", // Light gray
    text: "1E293B", // Dark text
    textSecondary: "475569",
    textMuted: "94A3B8",
  },
};

export interface PptxMetadata {
  title: string;
  duration: number;
  audience?: string;
  date?: string;
  theme?: ColorTheme;
  customColors?: Partial<ColorPalette>;
  contactUrl?: string;
  contactEmail?: string;
}

/**
 * Parse rich text and return pptxgenjs-compatible text runs
 */
function parseRichTextForPptx(
  text: string,
  baseColor: string,
  fontSize: number,
): Array<{ text: string; options?: Record<string, unknown> }> {
  const runs: Array<{ text: string; options?: Record<string, unknown> }> = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Check for bold (**text**)
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // Check for italic (*text*) - not preceded or followed by *
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);

    const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;
    const italicIndex = italicMatch ? remaining.indexOf(italicMatch[0]) : -1;

    // Find the first match
    let firstMatch: RegExpMatchArray | null = null;
    let firstIndex = -1;
    let isBold = false;

    if (boldIndex !== -1 && (italicIndex === -1 || boldIndex <= italicIndex)) {
      firstMatch = boldMatch;
      firstIndex = boldIndex;
      isBold = true;
    } else if (italicIndex !== -1) {
      firstMatch = italicMatch;
      firstIndex = italicIndex;
      isBold = false;
    }

    if (firstMatch && firstIndex !== -1) {
      // Add text before the match
      if (firstIndex > 0) {
        runs.push({
          text: remaining.substring(0, firstIndex),
          options: { color: baseColor, fontSize },
        });
      }

      // Add the formatted text
      runs.push({
        text: firstMatch[1],
        options: {
          color: baseColor,
          fontSize,
          bold: isBold,
          italic: !isBold,
        },
      });

      remaining = remaining.substring(firstIndex + firstMatch[0].length);
    } else {
      // No more matches, add the rest
      runs.push({
        text: remaining,
        options: { color: baseColor, fontSize },
      });
      break;
    }
  }

  return runs.length > 0
    ? runs
    : [{ text, options: { color: baseColor, fontSize } }];
}

/**
 * Strip markdown markers from text for clean display
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold markers
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1"); // Remove italic markers
}

/**
 * Get key point text (handles both string and object formats)
 * Strips markdown for clean PPTX display
 */
function getKeyPointText(point: KeyPoint): string {
  const text = typeof point === "string" ? point : point.text;
  return stripMarkdown(text);
}

/**
 * Generate QR code as data URL (simple implementation)
 * Uses a free QR code API for simplicity
 */
function getQrCodeUrl(data: string, size = 150): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

/**
 * Generates a PowerPoint presentation from slide data
 * @param slides - Array of slides to include in the presentation
 * @param metadata - Presentation metadata (title, duration, audience, date)
 * @returns Promise<void> - Downloads the PPTX file
 */
export async function generatePptx(
  slides: Slide[],
  metadata: PptxMetadata,
): Promise<void> {
  // Dynamically import pptxgenjs only on client side
  const PptxGenJS = (await import("pptxgenjs")).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pptx = new (PptxGenJS as any)();

  // Set presentation properties
  pptx.author = "PhoenixRooivalk";
  pptx.company = "PhoenixRooivalk";
  pptx.title = metadata.title;
  pptx.subject = `${metadata.duration}-minute presentation for ${metadata.audience || "Investors/Advisors"}`;

  // Get color scheme based on theme
  const baseColors = COLOR_THEMES[metadata.theme || "default"];
  const colors: ColorPalette = {
    ...baseColors,
    ...metadata.customColors,
  };

  // Calculate totals for progress indicators
  const totalSlides = slides.length;
  const totalSeconds = slides.reduce((acc, s) => acc + s.duration, 0);
  const targetPerSlide = totalSeconds / totalSlides;

  // ==========================================
  // TITLE SLIDE
  // ==========================================
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: colors.dark };

  // Brand name at top
  titleSlide.addText(SLIDE_DECK_BRAND_NAME, {
    x: 0.5,
    y: 0.6,
    w: 9.0,
    h: 0.7,
    fontSize: 40,
    bold: true,
    color: colors.text,
    align: "center",
  });

  // Tagline
  titleSlide.addText(SLIDE_DECK_TAGLINE, {
    x: 0.5,
    y: 1.3,
    w: 9.0,
    h: 0.6,
    fontSize: 14,
    color: colors.textMuted,
    align: "center",
  });

  // Logo - convert SVG to PNG and embed
  let logoPngDataUrl: string | null = null;
  try {
    logoPngDataUrl = await svgToPngDataUrl(LOGO_SVG, 128, 128);
  } catch {
    // Fallback to shape if conversion fails
    logoPngDataUrl = null;
  }

  if (logoPngDataUrl) {
    titleSlide.addImage({
      data: logoPngDataUrl,
      x: 4.25,
      y: 1.95,
      w: 1.5,
      h: 1.5,
    });
  } else {
    // Fallback: shape-based logo
    titleSlide.addShape("ellipse" as PptxShape, {
      x: 4.25,
      y: 2.0,
      w: 1.5,
      h: 1.5,
      fill: { color: colors.primary },
      line: { color: colors.darker, width: 2 },
    });
    titleSlide.addText("PR", {
      x: 4.25,
      y: 2.3,
      w: 1.5,
      h: 0.9,
      fontSize: 32,
      bold: true,
      color: colors.darker,
      align: "center",
    });
  }

  // Presentation subtitle
  titleSlide.addText("DEFENCE DRONE - Pitch Presentation", {
    x: 0.5,
    y: 3.4,
    w: 9.0,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: colors.textSecondary,
    align: "center",
  });

  // Audience
  if (metadata.audience) {
    titleSlide.addText(metadata.audience, {
      x: 0.5,
      y: 4.1,
      w: 9.0,
      h: 0.4,
      fontSize: 16,
      color: colors.textMuted,
      align: "center",
    });
  }

  // Date
  if (metadata.date) {
    titleSlide.addText(metadata.date, {
      x: 0.5,
      y: 4.6,
      w: 9.0,
      h: 0.3,
      fontSize: 12,
      color: colors.textMuted,
      align: "center",
    });
  }

  // Website URL at bottom
  titleSlide.addText(SLIDE_DECK_URL, {
    x: 0.5,
    y: 5.0,
    w: 9.0,
    h: 0.3,
    fontSize: 11,
    color: colors.textMuted,
    align: "center",
  });

  // ==========================================
  // TABLE OF CONTENTS / AGENDA SLIDE
  // ==========================================
  const agendaSlide = pptx.addSlide();
  agendaSlide.background = { color: colors.dark };

  // Brand icon
  agendaSlide.addText(SLIDE_DECK_BRAND_TEXT, {
    x: 0.3,
    y: 0.2,
    w: 0.5,
    h: 0.4,
    fontSize: 14,
    color: colors.textMuted,
  });

  // Agenda title
  agendaSlide.addText("\u{1F4CB}  Agenda", {
    x: 0.5,
    y: 0.7,
    w: 9.0,
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  // Decorative line
  agendaSlide.addShape("rect" as any, {
    x: 0.5,
    y: 1.6,
    w: 9.0,
    h: 0.03,
    fill: { color: colors.primary },
  });

  // Agenda items
  const agendaItems = slides.map(
    (slide, i) => `${i + 1}. ${slide.title} (${slide.duration}s)`,
  );
  agendaSlide.addText(agendaItems.join("\n"), {
    x: 0.7,
    y: 1.9,
    w: 8.6,
    h: 4.5,
    fontSize: 16,
    color: colors.textSecondary,
    valign: "top",
    lineSpacing: 26,
  });

  // Total duration footer
  agendaSlide.addText(
    `Total Duration: ${metadata.duration} minutes (${totalSeconds} seconds)`,
    {
      x: 0.5,
      y: 6.8,
      w: 9.0,
      h: 0.3,
      fontSize: 12,
      color: colors.textMuted,
      align: "center",
    },
  );

  // ==========================================
  // CONTENT SLIDES
  // ==========================================
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const contentSlide = pptx.addSlide();
    contentSlide.background = { color: colors.dark };

    // Add slide transition (fade effect)
    contentSlide.transition = { type: "fade", speed: "fast" };

    // Add speaker notes from script
    if (slide.script) {
      contentSlide.addNotes(slide.script);
    }

    // Progress bar background
    contentSlide.addShape("rect" as any, {
      x: 0.5,
      y: 0.15,
      w: 8.5,
      h: 0.08,
      fill: { color: colors.darker },
    });

    // Progress bar fill
    const progressWidth = ((i + 1) / totalSlides) * 8.5;
    contentSlide.addShape("rect" as any, {
      x: 0.5,
      y: 0.15,
      w: progressWidth,
      h: 0.08,
      fill: { color: colors.primary },
    });

    // Small Brand Icon in top left corner (larger on first slide)
    contentSlide.addText(SLIDE_DECK_BRAND_TEXT, {
      x: 0.3,
      y: 0.3,
      w: 0.5,
      h: 0.4,
      fontSize: slide.number === 1 ? 20 : 14,
      color: colors.textMuted,
    });

    // Slide counter and pacing indicator
    const pacingRatio = slide.duration / targetPerSlide;
    let pacingLabel = "Good";
    let pacingColor = "22C55E"; // Green
    if (pacingRatio < 0.7) {
      pacingLabel = "Quick";
      pacingColor = "EAB308"; // Yellow
    } else if (pacingRatio > 1.3) {
      pacingLabel = "Long";
      pacingColor = "EF4444"; // Red
    }

    contentSlide.addText(
      `Slide ${slide.number}/${totalSlides} • ${slide.duration}s (${pacingLabel})`,
      {
        x: 6.5,
        y: 0.3,
        w: 3.0,
        h: 0.3,
        fontSize: 11,
        color: pacingColor,
        align: "right",
      },
    );

    // Add icon and title
    let titleText = slide.title;
    if (slide.icon) {
      titleText = `${slide.icon}  ${slide.title}`;
    }

    contentSlide.addText(titleText, {
      x: 0.5,
      y: 0.7,
      w: 9.0,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: colors.text,
    });

    // Add decorative line under title
    contentSlide.addShape("rect" as any, {
      x: 0.5,
      y: 1.6,
      w: 9.0,
      h: 0.03,
      fill: { color: colors.primary },
    });

    // Render content based on layout type
    const layout = slide.layout || "default";

    if (layout === "title-only") {
      // Title-only layout (section divider)
      if (slide.keyPoints.length > 0) {
        contentSlide.addText(getKeyPointText(slide.keyPoints[0]), {
          x: 0.5,
          y: 3.0,
          w: 9.0,
          h: 1.5,
          fontSize: 24,
          color: colors.textSecondary,
          align: "center",
          valign: "middle",
        });
      }
    } else if (layout === "image" && slide.image) {
      // Image-focused layout
      try {
        contentSlide.addImage({
          path: slide.image,
          x: 2.0,
          y: 1.9,
          w: 6.0,
          h: 3.0,
        });
      } catch {
        // If image fails, add placeholder text
        contentSlide.addText("[Image: " + slide.image + "]", {
          x: 2.0,
          y: 2.5,
          w: 6.0,
          h: 1.0,
          fontSize: 14,
          color: colors.textMuted,
          align: "center",
        });
      }

      if (slide.imageCaption) {
        contentSlide.addText(slide.imageCaption, {
          x: 0.5,
          y: 5.0,
          w: 9.0,
          h: 0.4,
          fontSize: 14,
          color: colors.textMuted,
          align: "center",
          italic: true,
        });
      }

      // Add key points below image if any
      if (slide.keyPoints.length > 0) {
        const bulletPoints = slide.keyPoints.map((point) => ({
          text: getKeyPointText(point),
          options: {
            bullet: { type: "number" as const, code: "2022" },
            color: colors.text,
            fontSize: 14,
            paraSpaceBefore: 4,
            paraSpaceAfter: 4,
          },
        }));

        contentSlide.addText(bulletPoints, {
          x: 0.7,
          y: 5.5,
          w: 8.6,
          h: 1.5,
          color: colors.text,
          fontSize: 14,
          valign: "top",
        });
      }
    } else if (layout === "image-right" && slide.image) {
      // Split layout: key points left, image right
      // Key points on the left (55% width)
      if (slide.keyPoints.length > 0) {
        const bulletPoints = slide.keyPoints.map((point) => ({
          text: getKeyPointText(point),
          options: {
            bullet: { type: "number" as const, code: "2022" },
            color: colors.text,
            fontSize: 13,
            paraSpaceBefore: 5,
            paraSpaceAfter: 5,
          },
        }));

        contentSlide.addText(bulletPoints, {
          x: 0.5,
          y: 1.9,
          w: 5.0,
          h: 4.5,
          color: colors.text,
          fontSize: 13,
          valign: "top",
        });
      }

      // Image on the right (45% width)
      try {
        contentSlide.addImage({
          path: slide.image,
          x: 5.7,
          y: 1.9,
          w: 3.8,
          h: 3.5,
        });
      } catch {
        // If image fails, add placeholder text
        contentSlide.addText("[Image: " + slide.image + "]", {
          x: 5.7,
          y: 2.8,
          w: 3.8,
          h: 1.0,
          fontSize: 12,
          color: colors.textMuted,
          align: "center",
        });
      }

      // Image caption below image
      if (slide.imageCaption) {
        contentSlide.addText(slide.imageCaption, {
          x: 5.7,
          y: 5.5,
          w: 3.8,
          h: 0.4,
          fontSize: 10,
          color: colors.textMuted,
          align: "center",
          italic: true,
        });
      }
    } else if (layout === "two-column") {
      // Two-column comparison layout
      const leftItems = slide.leftColumn || [];
      const rightItems = slide.rightColumn || [];

      // Left column title
      if (slide.leftColumnTitle) {
        contentSlide.addText(slide.leftColumnTitle, {
          x: 0.5,
          y: 1.9,
          w: 4.25,
          h: 0.4,
          fontSize: 18,
          bold: true,
          color: colors.textSecondary,
        });
      }

      // Left column content
      const leftBullets = leftItems.map((point) => ({
        text: getKeyPointText(point),
        options: {
          bullet: { type: "number" as const, code: "2022" },
          color: colors.text,
          fontSize: 14,
          paraSpaceBefore: 4,
          paraSpaceAfter: 4,
        },
      }));

      if (leftBullets.length > 0) {
        contentSlide.addText(leftBullets, {
          x: 0.5,
          y: slide.leftColumnTitle ? 2.4 : 1.9,
          w: 4.25,
          h: 4.0,
          valign: "top",
        });
      }

      // Right column title
      if (slide.rightColumnTitle) {
        contentSlide.addText(slide.rightColumnTitle, {
          x: 5.25,
          y: 1.9,
          w: 4.25,
          h: 0.4,
          fontSize: 18,
          bold: true,
          color: colors.textSecondary,
        });
      }

      // Right column content
      const rightBullets = rightItems.map((point) => ({
        text: getKeyPointText(point),
        options: {
          bullet: { type: "number" as const, code: "2022" },
          color: colors.text,
          fontSize: 14,
          paraSpaceBefore: 4,
          paraSpaceAfter: 4,
        },
      }));

      if (rightBullets.length > 0) {
        contentSlide.addText(rightBullets, {
          x: 5.25,
          y: slide.rightColumnTitle ? 2.4 : 1.9,
          w: 4.25,
          h: 4.0,
          valign: "top",
        });
      }

      // Vertical divider - shorter to match content
      contentSlide.addShape("rect" as any, {
        x: 4.9,
        y: 1.9,
        w: 0.02,
        h: 2.5,
        fill: { color: colors.primary },
      });
    } else if (layout === "quote") {
      // Quote/testimonial layout
      if (slide.keyPoints.length > 0) {
        // Quote marks
        contentSlide.addText("\u201C", {
          x: 0.5,
          y: 2.0,
          w: 1.0,
          h: 1.0,
          fontSize: 72,
          color: colors.primary,
        });

        // Quote text
        contentSlide.addText(getKeyPointText(slide.keyPoints[0]), {
          x: 1.0,
          y: 2.5,
          w: 8.0,
          h: 2.5,
          fontSize: 24,
          color: colors.textSecondary,
          italic: true,
          align: "center",
          valign: "middle",
        });

        // Quote author
        if (slide.quoteAuthor) {
          contentSlide.addText(`— ${slide.quoteAuthor}`, {
            x: 0.5,
            y: 5.2,
            w: 9.0,
            h: 0.5,
            fontSize: 18,
            color: colors.textMuted,
            align: "center",
          });
        }
      }
    } else if (layout === "code" && slide.codeBlock) {
      // Code block layout
      // Code background
      contentSlide.addShape("rect" as any, {
        x: 0.5,
        y: 1.9,
        w: 9.0,
        h: 2.5,
        fill: { color: "1E1E1E" }, // VS Code dark
        line: { color: colors.primary, width: 1 },
      });

      // Code language label
      if (slide.codeLanguage) {
        contentSlide.addText(slide.codeLanguage, {
          x: 0.7,
          y: 2.0,
          w: 2.0,
          h: 0.3,
          fontSize: 10,
          color: colors.textMuted,
        });
      }

      // Code content
      contentSlide.addText(slide.codeBlock, {
        x: 0.7,
        y: 2.4,
        w: 8.6,
        h: 1.9,
        fontSize: 12,
        fontFace: "Consolas",
        color: "D4D4D4", // VS Code text color
        valign: "top",
      });

      // Key points below code
      if (slide.keyPoints.length > 0) {
        const bulletPoints = slide.keyPoints.map((point) => ({
          text: getKeyPointText(point),
          options: {
            bullet: { type: "number" as const, code: "2022" },
            color: colors.text,
            fontSize: 14,
            paraSpaceBefore: 4,
            paraSpaceAfter: 4,
          },
        }));

        contentSlide.addText(bulletPoints, {
          x: 0.7,
          y: 4.6,
          w: 8.6,
          h: 2.0,
          valign: "top",
        });
      }
    } else if (layout === "team" && slide.teamMembers) {
      // Team layout: Founders (larger, top row) + Advisors (smaller, bottom row)
      const founders = slide.teamMembers.filter((m) =>
        m.title.toLowerCase().includes("founder"),
      );
      const advisors = slide.teamMembers.filter(
        (m) => !m.title.toLowerCase().includes("founder"),
      );

      // Founders row - compact cards
      const founderCardW = 2.6;
      const founderCardH = 1.9;
      const founderGap = 0.25;
      const founderStartX =
        (10 - founders.length * founderCardW - (founders.length - 1) * founderGap) / 2;
      const founderY = 1.75;

      founders.forEach((member, idx) => {
        const x = founderStartX + idx * (founderCardW + founderGap);
        const memberColor = member.color?.replace("#", "") || "F97316";

        // Card background
        contentSlide.addShape("rect" as any, {
          x,
          y: founderY,
          w: founderCardW,
          h: founderCardH,
          fill: { color: colors.darker },
          line: { color: memberColor, width: 2 },
        });

        // Avatar - use image if available, otherwise circle with initials
        if (member.image) {
          try {
            contentSlide.addImage({
              path: member.image,
              x: x + founderCardW / 2 - 0.35,
              y: founderY + 0.12,
              w: 0.7,
              h: 0.7,
              rounding: true,
            });
          } catch {
            // Fallback to initials circle
            contentSlide.addShape("ellipse" as any, {
              x: x + founderCardW / 2 - 0.35,
              y: founderY + 0.12,
              w: 0.7,
              h: 0.7,
              fill: { color: memberColor },
            });
            contentSlide.addText(member.initials, {
              x: x + founderCardW / 2 - 0.35,
              y: founderY + 0.22,
              w: 0.7,
              h: 0.5,
              fontSize: 14,
              bold: true,
              color: "FFFFFF",
              align: "center",
              valign: "middle",
            });
          }
        } else {
          // Avatar circle
          contentSlide.addShape("ellipse" as any, {
            x: x + founderCardW / 2 - 0.35,
            y: founderY + 0.12,
            w: 0.7,
            h: 0.7,
            fill: { color: memberColor },
          });

          // Initials
          contentSlide.addText(member.initials, {
            x: x + founderCardW / 2 - 0.35,
            y: founderY + 0.22,
            w: 0.7,
            h: 0.5,
            fontSize: 14,
            bold: true,
            color: "FFFFFF",
            align: "center",
            valign: "middle",
          });
        }

        // Name
        contentSlide.addText(member.name, {
          x,
          y: founderY + 0.85,
          w: founderCardW,
          h: 0.25,
          fontSize: 11,
          bold: true,
          color: colors.text,
          align: "center",
        });

        // Title
        contentSlide.addText(member.title, {
          x,
          y: founderY + 1.1,
          w: founderCardW,
          h: 0.2,
          fontSize: 8,
          color: memberColor,
          align: "center",
        });

        // Highlights
        const highlightText = member.highlights.map((h) => `• ${h}`).join("\n");
        contentSlide.addText(highlightText, {
          x: x + 0.08,
          y: founderY + 1.32,
          w: founderCardW - 0.16,
          h: 0.55,
          fontSize: 7,
          color: colors.textMuted,
          valign: "top",
          lineSpacing: 10,
        });
      });

      // Advisors row - smaller cards
      const advisorCardW = 1.5;
      const advisorCardH = 1.25;
      const advisorGap = 0.15;
      const advisorStartX =
        (10 - advisors.length * advisorCardW - (advisors.length - 1) * advisorGap) / 2;
      const advisorY = founderY + founderCardH + 0.2;

      advisors.forEach((member, idx) => {
        const x = advisorStartX + idx * (advisorCardW + advisorGap);
        const memberColor = member.color?.replace("#", "") || "1E40AF";

        // Card background (subtle)
        contentSlide.addShape("rect" as any, {
          x,
          y: advisorY,
          w: advisorCardW,
          h: advisorCardH,
          fill: { color: colors.darker },
          line: { color: memberColor, width: 1 },
        });

        // Avatar - use image if available, otherwise circle with initials
        if (member.image) {
          try {
            contentSlide.addImage({
              path: member.image,
              x: x + advisorCardW / 2 - 0.22,
              y: advisorY + 0.08,
              w: 0.44,
              h: 0.44,
              rounding: true,
            });
          } catch {
            // Fallback to initials circle
            contentSlide.addShape("ellipse" as any, {
              x: x + advisorCardW / 2 - 0.22,
              y: advisorY + 0.08,
              w: 0.44,
              h: 0.44,
              fill: { color: memberColor },
            });
            contentSlide.addText(member.initials, {
              x: x + advisorCardW / 2 - 0.22,
              y: advisorY + 0.14,
              w: 0.44,
              h: 0.32,
              fontSize: 9,
              bold: true,
              color: "FFFFFF",
              align: "center",
              valign: "middle",
            });
          }
        } else {
          // Avatar circle (smaller)
          contentSlide.addShape("ellipse" as any, {
            x: x + advisorCardW / 2 - 0.22,
            y: advisorY + 0.08,
            w: 0.44,
            h: 0.44,
            fill: { color: memberColor },
          });

          // Initials
          contentSlide.addText(member.initials, {
            x: x + advisorCardW / 2 - 0.22,
            y: advisorY + 0.14,
            w: 0.44,
            h: 0.32,
            fontSize: 9,
            bold: true,
            color: "FFFFFF",
            align: "center",
            valign: "middle",
          });
        }

        // Name
        contentSlide.addText(member.name, {
          x,
          y: advisorY + 0.55,
          w: advisorCardW,
          h: 0.22,
          fontSize: 8,
          bold: true,
          color: colors.text,
          align: "center",
        });

        // Title
        contentSlide.addText(member.title, {
          x,
          y: advisorY + 0.76,
          w: advisorCardW,
          h: 0.18,
          fontSize: 6,
          color: colors.textMuted,
          align: "center",
        });

        // Highlights (compact)
        const highlightText = member.highlights.map((h) => `• ${h}`).join("\n");
        contentSlide.addText(highlightText, {
          x: x + 0.04,
          y: advisorY + 0.94,
          w: advisorCardW - 0.08,
          h: 0.3,
          fontSize: 5,
          color: colors.textMuted,
          valign: "top",
          lineSpacing: 8,
        });
      });
    } else if (layout === "video" || slide.video) {
      // Video layout - split view: video left, key points right
      // Note: pptxgenjs supports video embedding via addMedia()

      // Sanitize video path and caption to prevent injection
      const sanitizedVideoPath = sanitizeVideoPath(slide.video);
      const sanitizedCaption = sanitizeTextContent(slide.videoCaption);

      // Video container on the LEFT (50% width)
      const videoX = 0.5;
      const videoY = 1.9;
      const videoW = 4.5;
      const videoH = 3.2;

      // Video container background
      const rectShape: PptxShape = "rect";
      contentSlide.addShape(rectShape, {
        x: videoX,
        y: videoY,
        w: videoW,
        h: videoH,
        fill: { color: "000000" },
        line: { color: colors.primary, width: 2 },
      });

      // Play button triangle (centered in video area)
      const triangleShape: PptxShape = "triangle";
      contentSlide.addShape(triangleShape, {
        x: videoX + videoW / 2 - 0.5,
        y: videoY + videoH / 2 - 0.5,
        w: 1.0,
        h: 1.0,
        fill: { color: colors.primary },
        rotate: 90,
      });

      // Video label below video
      contentSlide.addText("VIDEO", {
        x: videoX,
        y: videoY + videoH + 0.1,
        w: videoW,
        h: 0.3,
        fontSize: 11,
        bold: true,
        color: colors.primary,
        align: "center",
      });

      // Try to embed the video if path is accessible and valid
      if (sanitizedVideoPath) {
        try {
          // pptxgenjs addMedia supports: path (file path or URL), or data (base64)
          contentSlide.addMedia({
            path: sanitizedVideoPath,
            x: videoX,
            y: videoY,
            w: videoW,
            h: videoH,
            type: "video",
          });
        } catch {
          // If video embedding fails, the placeholder is already there
          contentSlide.addText("Click to play", {
            x: videoX,
            y: videoY + videoH - 0.4,
            w: videoW,
            h: 0.3,
            fontSize: 10,
            color: colors.textMuted,
            align: "center",
            italic: true,
          });
        }
      }

      // Video caption below video label
      if (sanitizedCaption) {
        contentSlide.addText(sanitizedCaption, {
          x: videoX,
          y: videoY + videoH + 0.4,
          w: videoW,
          h: 0.4,
          fontSize: 10,
          color: colors.textMuted,
          align: "center",
          italic: true,
        });
      }

      // Key points on the RIGHT (50% width)
      if (slide.keyPoints.length > 0) {
        const bulletPoints = slide.keyPoints.map((point) => ({
          text: getKeyPointText(point),
          options: {
            bullet: { type: "number" as const, code: "2022" },
            color: colors.text,
            fontSize: 14,
            paraSpaceBefore: 5,
            paraSpaceAfter: 5,
          },
        }));

        contentSlide.addText(bulletPoints, {
          x: 5.2,
          y: 1.9,
          w: 4.3,
          h: 4.5,
          color: colors.text,
          fontSize: 14,
          valign: "top",
        });
      }

      // Add video path to speaker notes if not already present (sanitized)
      if (!slide.script && sanitizedVideoPath) {
        contentSlide.addNotes(
          `[PLAY VIDEO: ${sanitizeTextContent(sanitizedVideoPath)}]`,
        );
      }
    } else if (layout === "products" && slide.productCards) {
      // Product cards grid layout - 3 cards side by side, readable
      const cards = slide.productCards;
      const cardCount = cards.length;
      const cardWidth = 3.0;
      const cardHeight = 3.6;
      const cardGap = 0.12;
      const totalWidth = cardCount * cardWidth + (cardCount - 1) * cardGap;
      const startX = (10 - totalWidth) / 2;
      const startY = 1.7;

      cards.forEach((product, cardIndex) => {
        const x = startX + cardIndex * (cardWidth + cardGap);
        const y = startY;
        const productColor = product.color?.replace("#", "") || "F97316";

        // Card background
        contentSlide.addShape("rect" as any, {
          x,
          y,
          w: cardWidth,
          h: cardHeight,
          fill: { color: colors.darker },
          line: { color: productColor, width: 2 },
        });

        // Badges - larger and more readable
        let badgeY = y + 0.12;
        if (product.badges && product.badges.length > 0) {
          let badgeX = x + 0.12;
          product.badges.forEach((badge, badgeIndex) => {
            const badgeColor = badgeIndex === 0 ? "22C55E" : "F97316";
            const badgeW = badge.length * 0.085 + 0.22;
            contentSlide.addShape("rect" as any, {
              x: badgeX,
              y: badgeY,
              w: badgeW,
              h: 0.24,
              fill: { color: badgeColor },
            });
            contentSlide.addText(badge, {
              x: badgeX,
              y: badgeY,
              w: badgeW,
              h: 0.24,
              fontSize: 8,
              bold: true,
              color: "FFFFFF",
              align: "center",
              valign: "middle",
            });
            badgeX += badgeW + 0.08;
          });
          badgeY += 0.36;
        } else {
          badgeY += 0.08;
        }

        // Product name - larger
        contentSlide.addText(product.name, {
          x: x + 0.12,
          y: badgeY,
          w: cardWidth - 0.24,
          h: 0.32,
          fontSize: 14,
          bold: true,
          color: colors.text,
        });

        // Tagline - larger
        contentSlide.addText(product.tagline, {
          x: x + 0.12,
          y: badgeY + 0.32,
          w: cardWidth - 0.24,
          h: 0.24,
          fontSize: 10,
          bold: true,
          color: productColor,
        });

        // Description - larger, more space
        contentSlide.addText(product.description, {
          x: x + 0.12,
          y: badgeY + 0.58,
          w: cardWidth - 0.24,
          h: 0.65,
          fontSize: 9,
          color: colors.textSecondary,
          valign: "top",
        });

        // Specs - larger fonts
        if (product.specs && product.specs.length > 0) {
          let specY = badgeY + 1.28;
          const specsPerRow = 2;
          const specColWidth = (cardWidth - 0.24) / specsPerRow;

          product.specs.forEach((spec, specIndex) => {
            const specCol = specIndex % specsPerRow;
            const specRow = Math.floor(specIndex / specsPerRow);
            const specX = x + 0.12 + specCol * specColWidth;
            const specYPos = specY + specRow * 0.38;

            // Label
            contentSlide.addText(spec.label.toUpperCase(), {
              x: specX,
              y: specYPos,
              w: specColWidth,
              h: 0.14,
              fontSize: 7,
              color: colors.textMuted,
            });
            // Value
            contentSlide.addText(spec.value, {
              x: specX,
              y: specYPos + 0.14,
              w: specColWidth,
              h: 0.2,
              fontSize: 10,
              bold: true,
              color: colors.text,
            });
          });
        }

        // Price (at bottom of card) - larger
        contentSlide.addText(product.price, {
          x: x + 0.12,
          y: y + cardHeight - 0.65,
          w: cardWidth - 0.24,
          h: 0.36,
          fontSize: 16,
          bold: true,
          color: colors.text,
        });

        // Delivery - slightly larger
        if (product.delivery) {
          contentSlide.addText(product.delivery, {
            x: x + 0.12,
            y: y + cardHeight - 0.32,
            w: cardWidth - 0.24,
            h: 0.22,
            fontSize: 9,
            color: colors.textMuted,
          });
        }
      });
    } else {
      // Default layout with key points
      // Add key points header
      contentSlide.addText("Key Points", {
        x: 0.5,
        y: 1.9,
        w: 9.0,
        h: 0.3,
        fontSize: 14,
        bold: true,
        color: colors.textSecondary,
      });

      // Build bullet points with support for nested sub-bullets
      const allBullets: Array<{
        text: string;
        options: Record<string, unknown>;
      }> = [];

      for (const point of slide.keyPoints) {
        if (typeof point === "string") {
          // Strip markdown for clean display
          allBullets.push({
            text: stripMarkdown(point),
            options: {
              bullet: { type: "number" as const, code: "2022" },
              color: colors.text,
              fontSize: 16,
              paraSpaceBefore: 6,
              paraSpaceAfter: 6,
            },
          });
        } else {
          // Main point - strip markdown
          allBullets.push({
            text: stripMarkdown(point.text),
            options: {
              bullet: { type: "number" as const, code: "2022" },
              color: colors.text,
              fontSize: 16,
              paraSpaceBefore: 6,
              paraSpaceAfter: 2,
            },
          });

          // Sub-points - strip markdown
          if (point.subPoints) {
            for (const subPoint of point.subPoints) {
              allBullets.push({
                text: stripMarkdown(subPoint),
                options: {
                  bullet: { type: "number" as const, code: "25E6" }, // Circle bullet
                  color: colors.textSecondary,
                  fontSize: 14,
                  indentLevel: 1,
                  paraSpaceBefore: 2,
                  paraSpaceAfter: 2,
                },
              });
            }
          }
        }
      }

      contentSlide.addText(allBullets, {
        x: 0.7,
        y: 2.3,
        w: 8.6,
        h: 4.5,
        color: colors.text,
        fontSize: 16,
        valign: "top",
      });

      // Note: Script is added to speaker notes only (see line ~379)
      // Not displayed visually on the slide to keep slides clean
    }

    // Add footer with PhoenixRooivalk branding
    contentSlide.addText("PhoenixRooivalk", {
      x: 0.5,
      y: 7.2,
      w: 4.5,
      h: 0.3,
      fontSize: 10,
      color: colors.textMuted,
    });

    contentSlide.addText(metadata.title, {
      x: 5.0,
      y: 7.2,
      w: 4.5,
      h: 0.3,
      fontSize: 10,
      color: colors.textMuted,
      align: "right",
    });
  }

  // ==========================================
  // SUMMARY SLIDE
  // ==========================================
  const summarySlide = pptx.addSlide();
  summarySlide.background = { color: colors.dark };
  summarySlide.transition = { type: "fade", speed: "fast" };

  // Decorative top bar
  summarySlide.addShape("rect" as any, {
    x: 0,
    y: 0,
    w: 10.0,
    h: 0.08,
    fill: { color: colors.primary },
  });

  // Brand logo (use PNG if available, fallback to shape)
  if (logoPngDataUrl) {
    summarySlide.addImage({
      data: logoPngDataUrl,
      x: 4.25,
      y: 0.5,
      w: 1.5,
      h: 1.5,
    });
  } else {
    summarySlide.addShape("ellipse" as any, {
      x: 4.25,
      y: 0.5,
      w: 1.5,
      h: 1.5,
      fill: { color: colors.primary },
    });
    summarySlide.addText(SLIDE_DECK_BRAND_TEXT, {
      x: 4.25,
      y: 0.75,
      w: 1.5,
      h: 1.0,
      fontSize: 32,
      bold: true,
      color: "FFFFFF",
      align: "center",
      valign: "middle",
    });
  }

  // Title - moved up
  summarySlide.addText("Thank You", {
    x: 0.5,
    y: 1.8,
    w: 9.0,
    h: 0.7,
    fontSize: 40,
    bold: true,
    color: colors.text,
    align: "center",
  });

  // Decorative line under title
  summarySlide.addShape("rect" as any, {
    x: 3.5,
    y: 2.55,
    w: 3.0,
    h: 0.03,
    fill: { color: colors.primary },
  });

  // Summary stats
  const summaryText = [
    `${slides.length} Slides  •  ${metadata.duration} Minutes`,
  ].join("\n");

  summarySlide.addText(summaryText, {
    x: 0.5,
    y: 2.7,
    w: 9.0,
    h: 0.4,
    fontSize: 14,
    color: colors.textSecondary,
    align: "center",
  });

  // Questions text
  summarySlide.addText("Questions?", {
    x: 0.5,
    y: 3.2,
    w: 9.0,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: colors.text,
    align: "center",
  });

  // Add QR code if contact URL is provided
  if (metadata.contactUrl || metadata.contactEmail) {
    const qrData = metadata.contactUrl || `mailto:${metadata.contactEmail}`;
    const qrUrl = getQrCodeUrl(qrData, 120);

    // QR code label
    summarySlide.addText("Scan to connect:", {
      x: 3.5,
      y: 3.75,
      w: 3.0,
      h: 0.25,
      fontSize: 10,
      color: colors.textMuted,
      align: "center",
    });

    // Add QR code image - smaller and higher
    try {
      summarySlide.addImage({
        path: qrUrl,
        x: 4.5,
        y: 4.0,
        w: 0.9,
        h: 0.9,
      });
    } catch {
      // If QR code fails, show URL text instead
      summarySlide.addText(qrData, {
        x: 2.5,
        y: 4.2,
        w: 5.0,
        h: 0.3,
        fontSize: 11,
        color: colors.primary,
        align: "center",
      });
    }

    // Contact info text
    if (metadata.contactEmail) {
      summarySlide.addText(metadata.contactEmail, {
        x: 0.5,
        y: 4.95,
        w: 9.0,
        h: 0.25,
        fontSize: 10,
        color: colors.textMuted,
        align: "center",
      });
    }
  } else {
    // No contact info - add company name footer
    summarySlide.addText("Phoenix Rooivalk", {
      x: 0.5,
      y: 5.5,
      w: 9.0,
      h: 0.4,
      fontSize: 14,
      color: colors.textMuted,
      align: "center",
    });
  }

  // Generate filename
  const filename = `${metadata.title.replace(/\s+/g, "-")}-${metadata.date || "Presentation"}.pptx`;

  // Save/download the presentation
  await pptx.writeFile({ fileName: filename });
}
