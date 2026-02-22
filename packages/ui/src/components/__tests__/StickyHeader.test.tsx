import React from "react";

import { render, screen } from "../../__tests__/utils/test-utils";
import { StickyHeader } from "../StickyHeader";

// Mock createPortal for testing
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (element: React.ReactElement, target: HTMLElement) => element,
}));

describe("StickyHeader", () => {
  beforeEach(() => {
    // Mock document.body for portal testing
    document.body.innerHTML = "";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing initially (before mount)", () => {
    // Mock useState to return false for mounted
    jest.spyOn(React, "useState").mockReturnValueOnce([false, jest.fn()]);

    render(<StickyHeader isVisible={true} />);

    expect(screen.queryByText("Phoenix Rooivalk")).not.toBeInTheDocument();
  });

  it("renders header content when mounted", () => {
    render(<StickyHeader isVisible={true} />);

    expect(screen.getByText("Phoenix Rooivalk")).toBeInTheDocument();
    expect(screen.getByText(/Counter-UAS Defense System/)).toBeInTheDocument();
    expect(screen.getByText("Schedule Demo")).toBeInTheDocument();
  });

  it("applies visible classes when isVisible is true", () => {
    render(<StickyHeader isVisible={true} />);

    const header = screen.getByText("Phoenix Rooivalk").closest(".fixed");
    expect(header).toHaveClass("translate-y-0");
    expect(header).not.toHaveClass("-translate-y-full");
  });

  it("applies hidden classes when isVisible is false", () => {
    render(<StickyHeader isVisible={false} />);

    const header = screen.getByText("Phoenix Rooivalk").closest(".fixed");
    expect(header).toHaveClass("-translate-y-full");
    expect(header).not.toHaveClass("translate-y-0");
  });

  it("renders Schedule Demo link with correct href", () => {
    render(<StickyHeader isVisible={true} />);

    const demoLink = screen.getByRole("link", { name: /schedule demo/i });
    expect(demoLink).toBeInTheDocument();
    expect(demoLink).toHaveAttribute("href", "#contact");
  });

  it("applies correct styling classes", () => {
    render(<StickyHeader isVisible={true} />);

    const header = screen.getByText("Phoenix Rooivalk").closest(".fixed");
    expect(header).toHaveClass(
      "fixed",
      "top-0",
      "left-0",
      "right-0",
      "z-50",
      "bg-[rgba(10,14,26,0.98)]",
      "backdrop-blur-md",
      "border-b",
      "border-[rgba(0,255,136,0.2)]",
      "shadow-lg",
      "transform",
      "transition-all",
      "duration-300",
    );
  });

  it("applies correct inner container classes", () => {
    render(<StickyHeader isVisible={true} />);

    const innerContainer = screen
      .getByText("Phoenix Rooivalk")
      .closest(".max-w-\\[1400px\\]");
    expect(innerContainer).toHaveClass(
      "max-w-[1400px]",
      "mx-auto",
      "px-6",
      "py-4",
      "flex",
      "items-center",
      "justify-between",
    );
  });

  it("renders branding text correctly", () => {
    render(<StickyHeader isVisible={true} />);

    const brandText = screen.getByText("Phoenix Rooivalk");
    expect(brandText).toHaveClass(
      "text-[var(--primary)]",
      "font-bold",
      "text-base",
    );

    // The description might be hidden on small screens
    const descriptionText = screen.getByText(/Counter-UAS Defense System/);
    expect(descriptionText).toBeInTheDocument();
  });

  it("renders CTA button with correct styling", () => {
    render(<StickyHeader isVisible={true} />);

    const ctaButton = screen.getByRole("link", { name: /schedule demo/i });
    expect(ctaButton).toHaveClass(
      "bg-gradient-to-br",
      "from-[var(--primary)]",
      "to-[var(--secondary)]",
      "text-[var(--dark)]",
      "px-5",
      "py-2.5",
      "rounded-md",
      "font-bold",
      "text-sm",
      "hover:-translate-y-0.5",
      "transition-all",
      "duration-200",
    );
  });

  it("handles transition states correctly", () => {
    const { rerender } = render(<StickyHeader isVisible={false} />);

    let header = screen.getByText("Phoenix Rooivalk").closest(".fixed");
    expect(header).toHaveClass("-translate-y-full");

    rerender(<StickyHeader isVisible={true} />);

    header = screen.getByText("Phoenix Rooivalk").closest(".fixed");
    expect(header).toHaveClass("translate-y-0");
  });

  it("maintains layout structure", () => {
    render(<StickyHeader isVisible={true} />);

    // Check that the layout has the expected structure
    const brandSection = screen.getByText("Phoenix Rooivalk").parentElement;
    const ctaSection = screen.getByText("Schedule Demo").parentElement;

    expect(brandSection).toBeInTheDocument();
    expect(ctaSection).toBeInTheDocument();

    // They should be siblings in the flex container
    const flexContainer = brandSection?.parentElement;
    expect(flexContainer).toHaveClass(
      "flex",
      "items-center",
      "justify-between",
    );
  });

  it("renders only when mounted (SSR safety)", () => {
    // Mock useState to return false for mounted initially
    jest.spyOn(React, "useState").mockReturnValueOnce([false, jest.fn()]);

    render(<StickyHeader isVisible={true} />);

    expect(screen.queryByText("Phoenix Rooivalk")).not.toBeInTheDocument();

    // Simulate component mounting
    jest.spyOn(React, "useState").mockReturnValueOnce([true, jest.fn()]);

    render(<StickyHeader isVisible={true} />);

    expect(screen.getByText("Phoenix Rooivalk")).toBeInTheDocument();
  });

  it("applies backdrop blur effect", () => {
    render(<StickyHeader isVisible={true} />);

    const header = screen.getByText("Phoenix Rooivalk").closest(".fixed");
    expect(header).toHaveClass("backdrop-blur-md");
  });

  it("has correct z-index for sticky positioning", () => {
    render(<StickyHeader isVisible={true} />);

    const header = screen.getByText("Phoenix Rooivalk").closest(".fixed");
    expect(header).toHaveClass("z-50");
  });

  it("maintains responsive design classes", () => {
    render(<StickyHeader isVisible={true} />);

    const innerContainer = screen
      .getByText("Phoenix Rooivalk")
      .closest(".max-w-\\[1400px\\]");
    expect(innerContainer).toHaveClass("max-w-[1400px]");
  });

  it("handles missing document.body gracefully in tests", () => {
    // This test ensures the component doesn't crash when document.body isn't available
    const originalBody = document.body;
    delete (document as any).body;

    expect(() => {
      render(<StickyHeader isVisible={true} />);
    }).not.toThrow();

    // Restore document.body
    document.body = originalBody;
  });
});
