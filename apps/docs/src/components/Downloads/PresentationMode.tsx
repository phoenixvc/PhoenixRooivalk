import * as React from "react";
import type { Slide, KeyPoint, TeamMember } from "./SlideDeckDownload";
import useBaseUrl from "@docusaurus/useBaseUrl";

interface PresentationModeProps {
  /** Presentation title */
  title: string;
  /** Array of slides */
  slides: Slide[];
  /** Duration in minutes */
  duration: number;
  /** Audience description */
  audience?: string;
  /** Whether presentation mode is open */
  isOpen: boolean;
  /** Callback to close presentation mode */
  onClose: () => void;
  /** Optional starting slide index */
  startSlide?: number;
}

/**
 * Parse rich text with **bold** and *italic* markers
 */
function parseRichText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);

    const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;
    const italicIndex = italicMatch ? remaining.indexOf(italicMatch[0]) : -1;

    let firstMatch: RegExpMatchArray | null = null;
    let firstIndex = -1;

    if (boldIndex !== -1 && (italicIndex === -1 || boldIndex <= italicIndex)) {
      firstMatch = boldMatch;
      firstIndex = boldIndex;
    } else if (italicIndex !== -1) {
      firstMatch = italicMatch;
      firstIndex = italicIndex;
    }

    if (firstMatch && firstIndex !== -1) {
      if (firstIndex > 0) {
        parts.push(remaining.substring(0, firstIndex));
      }
      if (firstMatch[0].startsWith("**")) {
        parts.push(
          <strong key={key++} className="font-bold">
            {firstMatch[1]}
          </strong>,
        );
      } else {
        parts.push(
          <em key={key++} className="italic">
            {firstMatch[1]}
          </em>,
        );
      }
      remaining = remaining.substring(firstIndex + firstMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Format time as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get key point text
 */
function getKeyPointText(point: KeyPoint): string {
  return typeof point === "string" ? point : point.text;
}

/**
 * PresentationMode - Full-screen slideshow with speaker notes and timer
 *
 * Features:
 * - Full-screen presentation view
 * - Keyboard navigation (Arrow keys, Space, Escape)
 * - Presentation timer with per-slide pacing
 * - Speaker notes panel (toggle with 'N' key)
 * - Slide thumbnails (toggle with 'T' key)
 * - Animation support for revealing bullet points ('A' key)
 */
export default function PresentationMode({
  title,
  slides,
  duration,
  audience,
  isOpen,
  onClose,
  startSlide = 0,
}: PresentationModeProps): React.ReactElement | null {
  const logoUrl = useBaseUrl("/img/logo.svg");
  const [currentSlide, setCurrentSlide] = React.useState(startSlide);
  const [showNotes, setShowNotes] = React.useState(false);
  const [showThumbnails, setShowThumbnails] = React.useState(false);
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [revealedBullets, setRevealedBullets] = React.useState<number>(999); // Show all by default
  const [animationMode, setAnimationMode] = React.useState(false);

  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const totalSlides = slides.length;

  // Calculate cumulative time for pacing
  const cumulativeTargetTime = React.useMemo(() => {
    let cumulative = 0;
    return slides.map((slide) => {
      cumulative += slide.duration;
      return cumulative;
    });
  }, [slides]);

  // Timer effect
  React.useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "Enter":
          e.preventDefault();
          if (
            animationMode &&
            revealedBullets < getCurrentSlideKeyPointsCount()
          ) {
            // Reveal next bullet
            setRevealedBullets((prev) => prev + 1);
          } else {
            // Next slide
            if (currentSlide < totalSlides - 1) {
              setCurrentSlide((prev) => prev + 1);
              if (animationMode) setRevealedBullets(0);
            }
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (currentSlide > 0) {
            setCurrentSlide((prev) => prev - 1);
            if (animationMode) setRevealedBullets(999);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          // Go to first slide
          setCurrentSlide(0);
          if (animationMode) setRevealedBullets(0);
          break;
        case "ArrowDown":
          e.preventDefault();
          // Go to last slide
          setCurrentSlide(totalSlides - 1);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "n":
        case "N":
          e.preventDefault();
          setShowNotes((prev) => !prev);
          break;
        case "t":
        case "T":
          e.preventDefault();
          setShowThumbnails((prev) => !prev);
          break;
        case "a":
        case "A":
          e.preventDefault();
          setAnimationMode((prev) => {
            const newMode = !prev;
            if (newMode) setRevealedBullets(0);
            else setRevealedBullets(999);
            return newMode;
          });
          break;
        case "s":
        case "S":
          e.preventDefault();
          setIsTimerRunning((prev) => !prev);
          break;
        case "r":
        case "R":
          e.preventDefault();
          setElapsedTime(0);
          break;
        default:
          // Number keys for direct slide navigation
          if (e.key >= "1" && e.key <= "9") {
            const slideNum = parseInt(e.key) - 1;
            if (slideNum < totalSlides) {
              setCurrentSlide(slideNum);
              if (animationMode) setRevealedBullets(0);
            }
          }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    currentSlide,
    totalSlides,
    onClose,
    animationMode,
    revealedBullets,
  ]);

  // Reset state when opening
  React.useEffect(() => {
    if (isOpen) {
      setCurrentSlide(startSlide);
      setElapsedTime(0);
      setIsTimerRunning(false);
      setRevealedBullets(animationMode ? 0 : 999);
    }
  }, [isOpen, startSlide, animationMode]);

  const getCurrentSlideKeyPointsCount = () => {
    const slide = slides[currentSlide];
    if (!slide) return 0;
    return slide.keyPoints.length;
  };

  if (!isOpen) return null;

  const slide = slides[currentSlide];
  const targetTime = cumulativeTargetTime[currentSlide];
  const isPacingBehind = elapsedTime > targetTime;
  const pacingDiff = Math.abs(elapsedTime - targetTime);

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900 text-white flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <img src={logoUrl} alt="Phoenix Rooivalk" className="w-8 h-8" />
          <h1 className="text-lg font-semibold truncate max-w-md">{title}</h1>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-mono font-bold">
              {formatTime(elapsedTime)}
            </div>
            <div
              className={`text-xs ${isPacingBehind ? "text-red-400" : "text-green-400"}`}
            >
              {isPacingBehind ? "Behind" : "Ahead"} by {formatTime(pacingDiff)}
            </div>
          </div>
          <button
            onClick={() => setIsTimerRunning((prev) => !prev)}
            className={`px-4 py-2 rounded-lg font-medium ${
              isTimerRunning
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isTimerRunning ? "Pause" : "Start"}
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotes((prev) => !prev)}
            className={`px-3 py-1.5 rounded text-sm ${showNotes ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
            title="Toggle Notes (N)"
          >
            Notes
          </button>
          <button
            onClick={() => setShowThumbnails((prev) => !prev)}
            className={`px-3 py-1.5 rounded text-sm ${showThumbnails ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
            title="Toggle Thumbnails (T)"
          >
            Thumbnails
          </button>
          <button
            onClick={() => {
              setAnimationMode((prev) => {
                const newMode = !prev;
                if (newMode) setRevealedBullets(0);
                else setRevealedBullets(999);
                return newMode;
              });
            }}
            className={`px-3 py-1.5 rounded text-sm ${animationMode ? "bg-purple-600" : "bg-gray-700 hover:bg-gray-600"}`}
            title="Toggle Animation Mode (A)"
          >
            Animate
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded"
            title="Exit (Escape)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnails Sidebar */}
        {showThumbnails && (
          <div className="w-48 bg-gray-800 border-r border-gray-700 overflow-y-auto p-2">
            {slides.map((s, index) => (
              <button
                key={s.number}
                onClick={() => {
                  setCurrentSlide(index);
                  if (animationMode) setRevealedBullets(0);
                }}
                className={`w-full p-2 mb-2 rounded text-left text-xs ${
                  index === currentSlide
                    ? "bg-blue-600 ring-2 ring-blue-400"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                <div className="font-medium truncate">
                  {index + 1}. {s.title}
                </div>
                <div className="text-gray-400 mt-1">{s.duration}s</div>
              </button>
            ))}
          </div>
        )}

        {/* Slide Display */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          {/* Slide Content */}
          <div
            className={`w-full bg-gray-800 rounded-xl shadow-2xl ${
              slide.layout === "products"
                ? "max-w-6xl p-6"
                : "max-w-4xl p-12"
            }`}
          >
            {/* Slide Header */}
            <div
              className={`flex items-center gap-4 ${slide.layout === "products" ? "mb-4" : "mb-8"}`}
            >
              {slide.icon && (
                <span
                  className={slide.layout === "products" ? "text-3xl" : "text-4xl"}
                  aria-hidden="true"
                >
                  {slide.icon}
                </span>
              )}
              <h2
                className={`font-bold ${slide.layout === "products" ? "text-3xl" : "text-4xl"}`}
              >
                {parseRichText(slide.title)}
              </h2>
            </div>

            {/* Slide Body */}
            {slide.layout === "title-only" ? (
              <div className="text-center py-8 space-y-2">
                {slide.keyPoints.map((point, i) => {
                  const text = getKeyPointText(point);
                  // Empty strings create visual spacing
                  if (!text) return <div key={i} className="h-4" />;
                  return (
                    <p
                      key={i}
                      className={`text-xl text-gray-300 transition-opacity duration-300 ${
                        animationMode && i >= revealedBullets
                          ? "opacity-0"
                          : "opacity-100"
                      }`}
                    >
                      {parseRichText(text)}
                    </p>
                  );
                })}
              </div>
            ) : slide.layout === "quote" ? (
              <div className="text-center py-8">
                <blockquote className="text-3xl italic text-gray-300 mb-4">
                  &ldquo;
                  {slide.keyPoints[0] &&
                    parseRichText(getKeyPointText(slide.keyPoints[0]))}
                  &rdquo;
                </blockquote>
                {slide.quoteAuthor && (
                  <p className="text-xl text-gray-400">— {slide.quoteAuthor}</p>
                )}
              </div>
            ) : slide.layout === "image" && slide.image ? (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={slide.image}
                  alt={slide.imageCaption || slide.title}
                  className="max-h-72 rounded-lg"
                />
                {slide.imageCaption && (
                  <p className="text-gray-400 italic">{slide.imageCaption}</p>
                )}
              </div>
            ) : slide.layout === "image-right" && slide.image ? (
              // Split layout: key points left, image right
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <ul className="space-y-3">
                    {slide.keyPoints.map((point, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-3 text-lg transition-opacity duration-300 ${
                          animationMode && i >= revealedBullets
                            ? "opacity-0"
                            : "opacity-100"
                        }`}
                      >
                        <span className="text-blue-400 mt-1">{"\u25CF"}</span>
                        <span>{parseRichText(getKeyPointText(point))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <img
                    src={slide.image}
                    alt={slide.imageCaption || slide.title}
                    className="max-h-64 rounded-lg"
                  />
                  {slide.imageCaption && (
                    <p className="text-sm text-gray-400 italic mt-2 text-center">
                      {slide.imageCaption}
                    </p>
                  )}
                </div>
              </div>
            ) : slide.layout === "code" && slide.codeBlock ? (
              <div>
                <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm mb-4">
                  <code className="text-green-400">{slide.codeBlock}</code>
                </pre>
              </div>
            ) : slide.layout === "two-column" ? (
              <div>
                {/* Key points above columns (e.g., main ask) */}
                {slide.keyPoints.length > 0 && (
                  <div className="text-center mb-6">
                    {slide.keyPoints.map((point, i) => (
                      <p
                        key={i}
                        className="text-2xl font-bold text-orange-400"
                      >
                        {parseRichText(getKeyPointText(point))}
                      </p>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    {slide.leftColumnTitle && (
                      <h4 className="text-lg font-semibold mb-3 text-orange-400">
                        {slide.leftColumnTitle}
                      </h4>
                    )}
                    <ul className="space-y-2">
                      {(slide.leftColumn || []).map((point, i) => (
                        <li
                          key={i}
                          className={`flex items-start gap-2 text-base transition-opacity duration-300 ${
                            animationMode && i >= revealedBullets
                              ? "opacity-0"
                              : "opacity-100"
                          }`}
                        >
                          <span className="text-blue-400 mt-1">{"\u25CF"}</span>
                          <span>{parseRichText(getKeyPointText(point))}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    {slide.rightColumnTitle && (
                      <h4 className="text-lg font-semibold mb-3 text-orange-400">
                        {slide.rightColumnTitle}
                      </h4>
                    )}
                    <ul className="space-y-2">
                      {(slide.rightColumn || []).map((point, i) => (
                        <li
                          key={i}
                          className={`flex items-start gap-2 text-base transition-opacity duration-300 ${
                            animationMode && i >= revealedBullets
                              ? "opacity-0"
                              : "opacity-100"
                          }`}
                        >
                          <span className="text-blue-400 mt-1">{"\u25CF"}</span>
                        <span>{parseRichText(getKeyPointText(point))}</span>
                      </li>
                    ))}
                  </ul>
                  </div>
                </div>
              </div>
            ) : slide.layout === "team" && slide.teamMembers ? (
              <div>
                {/* Founders - larger cards */}
                {(() => {
                  const founders = slide.teamMembers.filter(
                    (m) =>
                      m.title.toLowerCase().includes("founder") &&
                      !m.title.toLowerCase().includes("advisor"),
                  );
                  const advisors = slide.teamMembers.filter(
                    (m) =>
                      m.title.toLowerCase().includes("advisor") ||
                      !m.title.toLowerCase().includes("founder"),
                  );
                  return (
                    <>
                      {/* Founders row */}
                      <div className="flex justify-center gap-6 mb-4">
                        {founders.map((member, memberIndex) => (
                          <div
                            key={memberIndex}
                            className="text-center p-4 rounded-lg w-[200px]"
                            style={{
                              background: `linear-gradient(180deg, ${member.color || "#1e40af"}25 0%, ${member.color || "#1e40af"}10 100%)`,
                              border: `2px solid ${member.color || "#1e40af"}60`,
                            }}
                          >
                            <div
                              className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl"
                              style={{
                                background: `linear-gradient(135deg, ${member.color || "#1e40af"} 0%, ${member.color || "#1e40af"}cc 100%)`,
                              }}
                            >
                              {member.initials}
                            </div>
                            <h4 className="font-bold text-white text-base">
                              {member.name}
                            </h4>
                            <p
                              className="text-sm font-medium mb-1"
                              style={{ color: member.color || "#f97316" }}
                            >
                              {member.title}
                            </p>
                            <ul className="text-xs text-gray-400 space-y-0.5">
                              {member.highlights.map((highlight, hIndex) => (
                                <li key={hIndex}>{highlight}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      {/* Advisors row */}
                      <div className="flex justify-center gap-3">
                        {advisors.map((member, memberIndex) => (
                          <div
                            key={memberIndex}
                            className="text-center p-2 rounded-lg w-[140px]"
                            style={{
                              background: `linear-gradient(180deg, ${member.color || "#1e40af"}15 0%, ${member.color || "#1e40af"}05 100%)`,
                              border: `1px solid ${member.color || "#1e40af"}30`,
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-white font-bold text-sm"
                              style={{
                                background: `linear-gradient(135deg, ${member.color || "#1e40af"} 0%, ${member.color || "#1e40af"}cc 100%)`,
                              }}
                            >
                              {member.initials}
                            </div>
                            <h4 className="font-bold text-white text-xs">
                              {member.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {member.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : slide.layout === "video" || slide.video ? (
              // Video layout - split view: video left, key points right
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Video on the left */}
                <div className="flex flex-col">
                  {slide.video && (
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
                      <video
                        src={slide.video}
                        controls
                        autoPlay={slide.videoAutoplay}
                        muted={slide.videoAutoplay}
                        className="w-full h-full object-contain"
                        poster={slide.image}
                        aria-label={
                          slide.videoCaption || slide.title || "Video content"
                        }
                      >
                        {slide.videoCaptions && (
                          <track
                            kind="captions"
                            src={slide.videoCaptions}
                            srcLang={slide.videoCaptionsLang || "en"}
                            label={`Captions (${slide.videoCaptionsLang || "en"})`}
                            default
                          />
                        )}
                        Your browser does not support the video tag.
                      </video>
                      {/* Fullscreen button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          const video = e.currentTarget
                            .previousElementSibling as HTMLVideoElement;
                          if (video?.requestFullscreen) {
                            video.requestFullscreen();
                          }
                        }}
                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Fullscreen"
                      >
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                  {slide.videoCaption && (
                    <p className="text-sm text-gray-400 italic mt-2 text-center">
                      {slide.videoCaption}
                    </p>
                  )}
                </div>
                {/* Key points on the right */}
                <ul className="space-y-3">
                  {slide.keyPoints.map((point, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-3 text-lg transition-opacity duration-300 ${
                        animationMode && i >= revealedBullets
                          ? "opacity-0"
                          : "opacity-100"
                      }`}
                    >
                      <span className="text-blue-400 mt-1">{"\u25CF"}</span>
                      <span>{parseRichText(getKeyPointText(point))}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : slide.layout === "products" && slide.productCards ? (
              // Product cards grid layout
              <div className="grid grid-cols-3 gap-4">
                {slide.productCards.map((product, productIndex) => (
                  <div
                    key={productIndex}
                    className="rounded-lg p-4 flex flex-col"
                    style={{
                      background:
                        "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
                      border: `1px solid ${product.color || "#f97316"}50`,
                    }}
                  >
                    {/* Badges */}
                    {product.badges && product.badges.length > 0 && (
                      <div className="flex gap-2 mb-2">
                        {product.badges.map((badge, badgeIndex) => (
                          <span
                            key={badgeIndex}
                            className="text-xs px-2 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor:
                                badgeIndex === 0 ? "#22c55e" : "#f97316",
                              color: "#fff",
                            }}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Name */}
                    <h4 className="text-lg font-bold text-white mb-0.5">
                      {product.name}
                    </h4>
                    {/* Tagline */}
                    <p
                      className="text-sm font-medium mb-1"
                      style={{ color: product.color || "#f97316" }}
                    >
                      {product.tagline}
                    </p>
                    {/* Description */}
                    <p className="text-xs text-gray-400 mb-3 flex-grow">
                      {product.description}
                    </p>
                    {/* Specs */}
                    {product.specs && product.specs.length > 0 && (
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3 text-xs">
                        {product.specs.map((spec, specIndex) => (
                          <div key={specIndex}>
                            <span className="text-gray-500 uppercase text-xs">
                              {spec.label}
                            </span>
                            <div className="text-white font-medium">
                              {spec.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Price */}
                    <div className="mt-auto">
                      <p className="text-2xl font-bold text-white">
                        {product.price}
                      </p>
                      {product.delivery && (
                        <p className="text-xs text-gray-400">
                          {product.delivery}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Default layout
              <ul className="space-y-4">
                {slide.keyPoints.map((point, i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-3 text-xl transition-opacity duration-300 ${
                      animationMode && i >= revealedBullets
                        ? "opacity-0"
                        : "opacity-100"
                    }`}
                  >
                    <span className="text-blue-400 mt-1">{"\u25CF"}</span>
                    <span>{parseRichText(getKeyPointText(point))}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Slide Counter */}
          <div className="mt-6 text-gray-400">
            Slide {currentSlide + 1} of {totalSlides}
          </div>
        </div>

        {/* Speaker Notes Panel */}
        {showNotes && slide.script && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Speaker Notes
            </h3>
            <p className="text-gray-300 leading-relaxed">{slide.script}</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          {audience && <span>{audience}</span>}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentSlide(0);
              if (animationMode) setRevealedBullets(0);
            }}
            className="p-2 rounded hover:bg-gray-700"
            title="First Slide (Home)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => {
              if (currentSlide > 0) {
                setCurrentSlide((prev) => prev - 1);
                if (animationMode) setRevealedBullets(999);
              }
            }}
            disabled={currentSlide === 0}
            className="p-2 rounded hover:bg-gray-700 disabled:opacity-50"
            title="Previous Slide (Left Arrow)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="px-4 text-lg font-mono">
            {currentSlide + 1} / {totalSlides}
          </span>
          <button
            onClick={() => {
              if (
                animationMode &&
                revealedBullets < getCurrentSlideKeyPointsCount()
              ) {
                setRevealedBullets((prev) => prev + 1);
              } else if (currentSlide < totalSlides - 1) {
                setCurrentSlide((prev) => prev + 1);
                if (animationMode) setRevealedBullets(0);
              }
            }}
            disabled={
              currentSlide === totalSlides - 1 &&
              (!animationMode ||
                revealedBullets >= getCurrentSlideKeyPointsCount())
            }
            className="p-2 rounded hover:bg-gray-700 disabled:opacity-50"
            title="Next Slide (Right Arrow / Space)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <button
            onClick={() => setCurrentSlide(totalSlides - 1)}
            className="p-2 rounded hover:bg-gray-700"
            title="Last Slide (End)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="text-xs text-gray-500">
          <span className="bg-gray-700 px-1.5 py-0.5 rounded mr-1">←→</span>{" "}
          Navigate
          <span className="bg-gray-700 px-1.5 py-0.5 rounded mx-1 ml-3">
            N
          </span>{" "}
          Notes
          <span className="bg-gray-700 px-1.5 py-0.5 rounded mx-1 ml-3">
            T
          </span>{" "}
          Thumbnails
          <span className="bg-gray-700 px-1.5 py-0.5 rounded mx-1 ml-3">
            A
          </span>{" "}
          Animate
          <span className="bg-gray-700 px-1.5 py-0.5 rounded mx-1 ml-3">
            S
          </span>{" "}
          Timer
        </div>
      </div>
    </div>
  );
}
