import React from "react";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "../../__tests__/utils/test-utils";
import { ExitIntentModal } from "../ExitIntentModal";

// Mock createPortal for testing
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (element: React.ReactElement, target: HTMLElement) => element,
}));

describe("ExitIntentModal", () => {
  const mockDocsUrl = "https://example.com/docs.pdf";

  beforeEach(() => {
    // Mock document.body for portal testing
    document.body.innerHTML = "";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing initially", () => {
    render(<ExitIntentModal docsUrl={mockDocsUrl} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows modal when mouse leaves the page", async () => {
    render(<ExitIntentModal docsUrl={mockDocsUrl} />);

    // Simulate mouse leaving the page
    fireEvent.mouseLeave(document.body, { clientY: -1 });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Wait! Get Our Technical Whitepaper"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Download our comprehensive technical documentation before you leave.",
      ),
    ).toBeInTheDocument();
  });

  it("does not show modal for mouse movements within the page", async () => {
    render(<ExitIntentModal docsUrl={mockDocsUrl} />);

    // Simulate mouse movement within the page (positive clientY)
    fireEvent.mouseLeave(document.body, { clientY: 100 });

    // Wait a bit to ensure modal doesn't appear
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders download link with correct URL", async () => {
    render(<ExitIntentModal docsUrl={mockDocsUrl} />);

    fireEvent.mouseLeave(document.body, { clientY: -1 });

    await waitFor(() => {
      const downloadLink = screen.getByRole("link", { name: /download now/i });
      expect(downloadLink).toBeInTheDocument();
      expect(downloadLink).toHaveAttribute("href", mockDocsUrl);
    });
  });

  it("closes modal when close button is clicked", async () => {
    render(<ExitIntentModal docsUrl={mockDocsUrl} />);

    // Open modal
    fireEvent.mouseLeave(document.body, { clientY: -1 });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Click close button
    const closeButton = screen.getByRole("button", { name: /maybe later/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes modal when escape key is pressed", async () => {
    render(<ExitIntentModal docsUrl={mockDocsUrl} />);

    // Open modal
    fireEvent.mouseLeave(document.body, { clientY: -1 });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Press escape key
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes modal when backdrop is clicked", async () => {
    render(<ExitIntentModal docsUrl={mockDocsUrl} />);

    // Open modal
    fireEvent.mouseLeave(document.body, { clientY: -1 });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Click backdrop (the overlay div)
    const backdrop = screen.getByRole("dialog").parentElement;
    fireEvent.click(backdrop!);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("does not close modal when modal content is clicked", async () => {
    render(<ExitIntentModal docsUrl={mockDocsUrl} />);

    // Open modal
    fireEvent.mouseLeave(document.body, { clientY: -1 });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Click modal content (should not close)
    const modalContent = screen
      .getByText("Wait! Get Our Technical Whitepaper")
      .closest("div");
    fireEvent.click(modalContent!);

    // Modal should still be visible
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("has proper accessibility attributes", async () => {
    render(<ExitIntentModal docsUrl={mockDocsUrl} />);

    fireEvent.mouseLeave(document.body, { clientY: -1 });

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "exit-intent-title");
      expect(dialog).toHaveAttribute(
        "aria-describedby",
        "exit-intent-description",
      );
    });
  });

  it("focuses close button when modal opens", async () => {
    render(<ExitIntentModal docsUrl={mockDocsUrl} />);

    // Set focus on a different element first
    const focusableElement = document.createElement("button");
    document.body.appendChild(focusableElement);
    focusableElement.focus();

    // Open modal
    fireEvent.mouseLeave(document.body, { clientY: -1 });

    await waitFor(() => {
      const closeButton = screen.getByRole("button", { name: /maybe later/i });
      expect(document.activeElement).toBe(closeButton);
    });
  });

  it("restores focus to previously focused element when closed", async () => {
    render(<ExitIntentModal docsUrl={mockDocsUrl} />);

    // Create and focus a button
    const originalButton = document.createElement("button");
    originalButton.textContent = "Original Focus";
    document.body.appendChild(originalButton);
    originalButton.focus();
    expect(document.activeElement).toBe(originalButton);

    // Open modal
    fireEvent.mouseLeave(document.body, { clientY: -1 });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByRole("button", { name: /maybe later/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(originalButton);
    });
  });

  it("implements focus trap correctly", async () => {
    render(<ExitIntentModal docsUrl={mockDocsUrl} />);

    fireEvent.mouseLeave(document.body, { clientY: -1 });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const downloadLink = screen.getByRole("link", { name: /download now/i });
    const closeButton = screen.getByRole("button", { name: /maybe later/i });

    // Focus should be on close button (first focusable element) initially
    expect(document.activeElement).toBe(closeButton);

    // Manually move focus to last element (download link), then Tab wraps to first
    downloadLink.focus();
    expect(document.activeElement).toBe(downloadLink);
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(closeButton);

    // Shift+Tab backward from first element should wrap to last (download link)
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(downloadLink);
  });

  it("only shows modal once per session", async () => {
    render(<ExitIntentModal docsUrl={mockDocsUrl} />);

    // First mouse leave should show modal
    fireEvent.mouseLeave(document.body, { clientY: -1 });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByRole("button", { name: /maybe later/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Second mouse leave should not show modal again
    fireEvent.mouseLeave(document.body, { clientY: -1 });

    // Wait a bit to ensure modal doesn't appear
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
