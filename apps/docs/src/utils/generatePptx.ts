import type { Slide } from "../components/Downloads/SlideDeckDownload";

/** Branded icon for slide decks - bar chart emoji */
const SLIDE_DECK_BRAND_ICON = "\u{1F4CA}"; // 📊

export interface PptxMetadata {
  title: string;
  duration: number;
  audience?: string;
  date?: string;
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

  // Define color scheme (matching PhoenixRooivalk brand)
  const colors = {
    primary: "F97316", // Orange
    accent: "FBB928", // Amber
    dark: "0F172A", // Dark blue
    darker: "090A0F", // Darker
    text: "FFFFFF", // White
    textSecondary: "CBD5E1", // Light gray
    textMuted: "94A3B8", // Muted gray
  };

  // Create title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: colors.dark };

  // Large Brand Icon on title slide
  titleSlide.addText(SLIDE_DECK_BRAND_ICON, {
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

  // Add individual slides
  for (const slide of slides) {
    const contentSlide = pptx.addSlide();
    contentSlide.background = { color: colors.dark };

    // Small Brand Icon in top left corner (larger on first slide)
    contentSlide.addText(SLIDE_DECK_BRAND_ICON, {
      x: 0.3,
      y: 0.2,
      w: 0.5,
      h: 0.4,
      fontSize: slide.number === 1 ? 20 : 14,
      color: colors.textMuted,
    });

    // Add slide number and duration in top right
    contentSlide.addText(`Slide ${slide.number} • ${slide.duration}s`, {
      x: 7.5,
      y: 0.3,
      w: 2.0,
      h: 0.3,
      fontSize: 11,
      color: colors.textMuted,
      align: "right",
    });

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

    // Add key points as bullets
    const bulletPoints = slide.keyPoints.map((point) => ({
      text: point,
      options: {
        bullet: { type: "number" as const, code: "2022" }, // Unicode bullet
        color: colors.text,
        fontSize: 16,
        paraSpaceBefore: 6,
        paraSpaceAfter: 6,
      },
    }));

    contentSlide.addText(bulletPoints, {
      x: 0.7,
      y: 2.3,
      w: 8.6,
      h: 2.8,
      color: colors.text,
      fontSize: 16,
      valign: "top",
    });

    // Add script if available
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

  // Add summary slide
  const summarySlide = pptx.addSlide();
  summarySlide.background = { color: colors.dark };

  // Small Brand Icon in top left corner
  summarySlide.addText(SLIDE_DECK_BRAND_ICON, {
    x: 0.3,
    y: 0.2,
    w: 0.5,
    h: 0.4,
    fontSize: 14,
    color: colors.textMuted,
  });

  summarySlide.addText("Summary", {
    x: 0.5,
    y: 2.0,
    w: 9.0,
    h: 1.0,
    fontSize: 36,
    bold: true,
    color: colors.text,
    align: "center",
  });

  const totalSeconds = slides.reduce((acc, s) => acc + s.duration, 0);
  const summaryText = [
    `Total Slides: ${slides.length}`,
    `Total Duration: ${totalSeconds} seconds (${metadata.duration} minutes)`,
    "",
    "Questions?",
  ].join("\n");

  summarySlide.addText(summaryText, {
    x: 0.5,
    y: 3.5,
    w: 9.0,
    h: 2.0,
    fontSize: 20,
    color: colors.textSecondary,
    align: "center",
  });

  // Generate filename
  const filename = `${metadata.title.replace(/\s+/g, "-")}-${metadata.date || "Presentation"}.pptx`;

  // Save/download the presentation
  await pptx.writeFile({ fileName: filename });
}
