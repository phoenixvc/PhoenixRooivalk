import type {
  Slide,
  KeyPoint,
  ColorTheme,
  ColorPalette,
  TeamMember,
} from "../components/Downloads/SlideDeckDownload";

/** Branded text for slide decks - Phoenix Rooivalk */
const SLIDE_DECK_BRAND_TEXT = "PR"; // Phoenix Rooivalk initials

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
    primary: "2563EB", // Blue
    accent: "3B82F6", // Light blue
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

  return runs.length > 0 ? runs : [{ text, options: { color: baseColor, fontSize } }];
}

/**
 * Get key point text (handles both string and object formats)
 */
function getKeyPointText(point: KeyPoint): string {
  return typeof point === "string" ? point : point.text;
}

/**
 * Generate QR code as data URL using the qrcode npm library
 * Returns a base64 data URL or empty string on error
 */
async function getQrCodeUrl(data: string, size = 150): Promise<string> {
  try {
    const QRCode = (await import("qrcode")).default;
    return await QRCode.toDataURL(data, {
      width: size,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    // Fallback to external API if qrcode package fails
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
  }
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

  // Large Brand Icon on title slide
  titleSlide.addText(SLIDE_DECK_BRAND_TEXT, {
    x: 0.5,
    y: 1.0,
    w: 9.0,
    h: 0.8,
    fontSize: 48,
    color: colors.textMuted,
    align: "center",
  });

  // Title
  titleSlide.addText(metadata.title, {
    x: 0.5,
    y: 2.0,
    w: 9.0,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: colors.text,
    align: "center",
  });

  // Subtitle
  titleSlide.addText(`${metadata.duration}-Minute Presentation`, {
    x: 0.5,
    y: 3.7,
    w: 9.0,
    h: 0.5,
    fontSize: 24,
    color: colors.textSecondary,
    align: "center",
  });

  // Audience
  if (metadata.audience) {
    titleSlide.addText(metadata.audience, {
      x: 0.5,
      y: 4.3,
      w: 9.0,
      h: 0.4,
      fontSize: 18,
      color: colors.textMuted,
      align: "center",
    });
  }

  // Date
  if (metadata.date) {
    titleSlide.addText(metadata.date, {
      x: 0.5,
      y: 5.0,
      w: 9.0,
      h: 0.3,
      fontSize: 14,
      color: colors.textMuted,
      align: "center",
    });
  }

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
      } catch (err) {
        // Log the error for debugging
        console.error(
          `[generatePptx] Failed to add image on slide ${slide.number} ("${slide.title}"):`,
          err instanceof Error ? err.message : err,
          err instanceof Error ? err.stack : "",
        );
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

      // Vertical divider
      contentSlide.addShape("rect" as any, {
        x: 4.9,
        y: 1.9,
        w: 0.02,
        h: 4.0,
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
      // Team members grid layout
      const members = slide.teamMembers;
      const memberCount = members.length;
      const cols = Math.min(memberCount, 4);
      const cardWidth = 2.1;
      const cardHeight = 2.6;
      const startX = (10 - cols * cardWidth - (cols - 1) * 0.15) / 2;
      const startY = 1.9;

      members.forEach((member, memberIndex) => {
        const col = memberIndex % cols;
        const row = Math.floor(memberIndex / cols);
        const x = startX + col * (cardWidth + 0.15);
        const y = startY + row * (cardHeight + 0.2);
        const memberColor = member.color?.replace("#", "") || "1E40AF";

        // Card background
        contentSlide.addShape("rect" as any, {
          x,
          y,
          w: cardWidth,
          h: cardHeight,
          fill: { color: colors.darker },
          line: { color: memberColor, width: 1 },
        });

        // Avatar circle
        contentSlide.addShape("ellipse" as any, {
          x: x + cardWidth / 2 - 0.35,
          y: y + 0.15,
          w: 0.7,
          h: 0.7,
          fill: { color: memberColor },
        });

        // Initials
        contentSlide.addText(member.initials, {
          x: x + cardWidth / 2 - 0.35,
          y: y + 0.25,
          w: 0.7,
          h: 0.5,
          fontSize: 14,
          bold: true,
          color: "FFFFFF",
          align: "center",
          valign: "middle",
        });

        // Name
        contentSlide.addText(member.name, {
          x,
          y: y + 0.95,
          w: cardWidth,
          h: 0.3,
          fontSize: 11,
          bold: true,
          color: colors.text,
          align: "center",
        });

        // Title
        contentSlide.addText(member.title, {
          x,
          y: y + 1.2,
          w: cardWidth,
          h: 0.25,
          fontSize: 8,
          color: colors.textSecondary,
          align: "center",
        });

        // Highlights
        const highlightText = member.highlights
          .map((h) => `• ${h}`)
          .join("\n");
        contentSlide.addText(highlightText, {
          x: x + 0.1,
          y: y + 1.5,
          w: cardWidth - 0.2,
          h: 1.0,
          fontSize: 7,
          color: colors.textMuted,
          valign: "top",
          lineSpacing: 10,
        });
      });

      // Key points below team cards
      if (slide.keyPoints.length > 0) {
        const keyPointsY = startY + Math.ceil(memberCount / cols) * (cardHeight + 0.2) + 0.2;

        contentSlide.addText("Key Points", {
          x: 0.5,
          y: keyPointsY,
          w: 9.0,
          h: 0.3,
          fontSize: 12,
          bold: true,
          color: colors.textSecondary,
        });

        const bulletPoints = slide.keyPoints.map((point) => ({
          text: getKeyPointText(point),
          options: {
            bullet: { type: "number" as const, code: "2022" },
            color: colors.text,
            fontSize: 12,
            paraSpaceBefore: 3,
            paraSpaceAfter: 3,
          },
        }));

        contentSlide.addText(bulletPoints, {
          x: 0.7,
          y: keyPointsY + 0.35,
          w: 8.6,
          h: 1.5,
          valign: "top",
        });
      }
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
          // Parse rich text for formatting
          const runs = parseRichTextForPptx(point, colors.text, 16);
          allBullets.push({
            text: runs.map((r) => r.text).join(""),
            options: {
              bullet: { type: "number" as const, code: "2022" },
              color: colors.text,
              fontSize: 16,
              paraSpaceBefore: 6,
              paraSpaceAfter: 6,
            },
          });
        } else {
          // Main point
          allBullets.push({
            text: point.text,
            options: {
              bullet: { type: "number" as const, code: "2022" },
              color: colors.text,
              fontSize: 16,
              paraSpaceBefore: 6,
              paraSpaceAfter: 2,
            },
          });

          // Sub-points
          if (point.subPoints) {
            for (const subPoint of point.subPoints) {
              allBullets.push({
                text: subPoint,
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
        h: 2.8,
        color: colors.text,
        fontSize: 16,
        valign: "top",
      });

      // Add script section if available (visible on slide)
      if (slide.script) {
        // Script background box
        contentSlide.addShape("rect" as any, {
          x: 0.5,
          y: 5.3,
          w: 9.0,
          h: 1.7,
          fill: { color: colors.darker },
          line: { color: colors.primary, width: 1 },
        });

        // Script header
        contentSlide.addText("Script", {
          x: 0.7,
          y: 5.4,
          w: 8.6,
          h: 0.25,
          fontSize: 12,
          bold: true,
          color: colors.textSecondary,
        });

        // Script content
        contentSlide.addText(`"${slide.script}"`, {
          x: 0.7,
          y: 5.75,
          w: 8.6,
          h: 1.15,
          fontSize: 13,
          color: colors.textSecondary,
          italic: true,
          valign: "top",
        });
      }
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

  // Small Brand Icon in top left corner
  summarySlide.addText(SLIDE_DECK_BRAND_TEXT, {
    x: 0.3,
    y: 0.2,
    w: 0.5,
    h: 0.4,
    fontSize: 14,
    color: colors.textMuted,
  });

  summarySlide.addText("Summary", {
    x: 0.5,
    y: 1.5,
    w: 9.0,
    h: 1.0,
    fontSize: 36,
    bold: true,
    color: colors.text,
    align: "center",
  });

  const summaryText = [
    `Total Slides: ${slides.length}`,
    `Total Duration: ${totalSeconds} seconds (${metadata.duration} minutes)`,
    "",
    "Questions?",
  ].join("\n");

  summarySlide.addText(summaryText, {
    x: 0.5,
    y: 2.8,
    w: 9.0,
    h: 2.0,
    fontSize: 20,
    color: colors.textSecondary,
    align: "center",
  });

  // Add QR code if contact URL is provided
  if (metadata.contactUrl || metadata.contactEmail) {
    const qrData = metadata.contactUrl || `mailto:${metadata.contactEmail}`;
    const qrUrl = await getQrCodeUrl(qrData, 120);

    // QR code header text
    summarySlide.addText("Scan to connect:", {
      x: 3.5,
      y: 5.0,
      w: 3.0,
      h: 0.3,
      fontSize: 12,
      color: colors.textMuted,
      align: "center",
    });

    // Add QR code image if generated successfully
    if (qrUrl) {
      try {
        summarySlide.addImage({
          data: qrUrl, // Use data instead of path for base64 data URLs
          x: 4.0,
          y: 5.4,
          w: 1.5,
          h: 1.5,
        });
      } catch (err) {
        // Log the error for debugging
        console.error(
          `[generatePptx] Failed to add QR code on summary slide:`,
          err instanceof Error ? err.message : err,
          err instanceof Error ? err.stack : "",
        );
        // If QR code fails, show URL text instead
        summarySlide.addText(qrData, {
          x: 2.5,
          y: 5.5,
          w: 5.0,
          h: 0.3,
          fontSize: 12,
          color: colors.primary,
          align: "center",
        });
      }
    } else {
      // If QR code generation failed, show URL text instead
      summarySlide.addText(qrData, {
        x: 2.5,
        y: 5.5,
        w: 5.0,
        h: 0.3,
        fontSize: 12,
        color: colors.primary,
        align: "center",
      });
    }

    // Contact info text
    if (metadata.contactEmail) {
      summarySlide.addText(metadata.contactEmail, {
        x: 0.5,
        y: 7.0,
        w: 9.0,
        h: 0.25,
        fontSize: 11,
        color: colors.textMuted,
        align: "center",
      });
    }
  }

  // Generate filename
  const filename = `${metadata.title.replace(/\s+/g, "-")}-${metadata.date || "Presentation"}.pptx`;

  // Save/download the presentation
  await pptx.writeFile({ fileName: filename });
}
