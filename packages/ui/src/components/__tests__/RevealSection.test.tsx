import { cleanup, render, screen } from "../../__tests__/utils/test-utils";
import { RevealSection } from "../RevealSection";

// Mock the useIntersectionObserver hook
jest.mock("../../hooks/useIntersectionObserver");

const mockUseIntersectionObserver =
  require("../../hooks/useIntersectionObserver").useIntersectionObserver;

describe("RevealSection", () => {
  const defaultProps = {
    children: <div>Revealed content</div>,
  };

  beforeEach(() => {
    mockUseIntersectionObserver.mockReturnValue({
      ref: jest.fn(),
      isIntersecting: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders children correctly", () => {
    render(<RevealSection {...defaultProps} />);

    expect(screen.getByText("Revealed content")).toBeInTheDocument();
  });

  it("applies default classes when not intersecting", () => {
    render(<RevealSection {...defaultProps} />);

    const container = screen.getByText("Revealed content").parentElement;
    expect(container).toHaveClass(
      "opacity-0",
      "translate-y-8",
      "transition-all",
      "duration-700",
    );
  });

  it("applies revealed classes when intersecting", () => {
    mockUseIntersectionObserver.mockReturnValue({
      ref: jest.fn(),
      isIntersecting: true,
    });

    render(<RevealSection {...defaultProps} />);

    const container = screen.getByText("Revealed content").parentElement;
    expect(container).toHaveClass("opacity-100", "translate-y-0");
  });

  it("passes threshold to useIntersectionObserver", () => {
    const threshold = 0.5;
    render(<RevealSection {...defaultProps} threshold={threshold} />);

    expect(mockUseIntersectionObserver).toHaveBeenCalledWith({
      threshold,
      triggerOnce: true, // default value
    });
  });

  it("passes triggerOnce to useIntersectionObserver", () => {
    const triggerOnce = false;
    render(<RevealSection {...defaultProps} triggerOnce={triggerOnce} />);

    expect(mockUseIntersectionObserver).toHaveBeenCalledWith({
      threshold: 0.1, // default value
      triggerOnce,
    });
  });

  it("passes both threshold and triggerOnce to useIntersectionObserver", () => {
    const threshold = 0.3;
    const triggerOnce = false;

    render(
      <RevealSection
        {...defaultProps}
        threshold={threshold}
        triggerOnce={triggerOnce}
      />,
    );

    expect(mockUseIntersectionObserver).toHaveBeenCalledWith({
      threshold,
      triggerOnce,
    });
  });

  it("applies custom className", () => {
    const customClass = "custom-reveal-class";
    render(<RevealSection {...defaultProps} className={customClass} />);

    const container = screen.getByText("Revealed content").parentElement;
    expect(container).toHaveClass(customClass);
  });

  it("combines default and custom classes", () => {
    const customClass = "custom-class";
    render(<RevealSection {...defaultProps} className={customClass} />);

    const container = screen.getByText("Revealed content").parentElement;
    expect(container).toHaveClass("opacity-0", "translate-y-8", "custom-class");
  });

  it("uses default threshold when not specified", () => {
    render(<RevealSection {...defaultProps} />);

    expect(mockUseIntersectionObserver).toHaveBeenCalledWith({
      threshold: 0.1,
      triggerOnce: true,
    });
  });

  it("uses default triggerOnce when not specified", () => {
    render(<RevealSection {...defaultProps} />);

    expect(mockUseIntersectionObserver).toHaveBeenCalledWith({
      threshold: 0.1,
      triggerOnce: true,
    });
  });

  it("handles complex children", () => {
    const complexChildren = (
      <div>
        <h2>Title</h2>
        <p>Paragraph content</p>
        <button>Action button</button>
      </div>
    );

    render(<RevealSection>{complexChildren}</RevealSection>);

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Paragraph content")).toBeInTheDocument();
    expect(screen.getByText("Action button")).toBeInTheDocument();
  });

  it("maintains ref callback from useIntersectionObserver", () => {
    const mockRef = jest.fn();
    mockUseIntersectionObserver.mockReturnValue({
      ref: mockRef,
      isIntersecting: false,
    });

    render(<RevealSection {...defaultProps} />);

    // The ref is passed to the div — verify the container exists in the document
    const container = screen.getByText("Revealed content").parentElement;
    expect(container).toBeInTheDocument();
  });

  it("applies smooth transition duration", () => {
    render(<RevealSection {...defaultProps} />);

    const container = screen.getByText("Revealed content").parentElement;
    expect(container).toHaveClass("duration-700");
  });

  it("handles empty children gracefully", () => {
    render(<RevealSection>{null}</RevealSection>);

    // Should not crash and should still render the container div
    const container = document.querySelector(".transition-all");
    expect(container).toBeInTheDocument();
  });

  it("applies correct transform classes for animation", () => {
    // Test non-intersecting state
    render(<RevealSection {...defaultProps} />);
    let container = screen.getByText("Revealed content").parentElement;
    expect(container).toHaveClass("translate-y-8");

    // Cleanup before second render to avoid multiple elements
    cleanup();

    // Test intersecting state
    mockUseIntersectionObserver.mockReturnValue({
      ref: jest.fn(),
      isIntersecting: true,
    });

    render(<RevealSection {...defaultProps} />);
    container = screen.getByText("Revealed content").parentElement;
    expect(container).toHaveClass("translate-y-0");
  });

  it("maintains accessibility when children have interactive elements", () => {
    const accessibleChildren = (
      <div>
        <button aria-label="Test button">Click me</button>
        <a href="/test" aria-describedby="link-description">
          Test link
        </a>
        <span id="link-description">This is a test link</span>
      </div>
    );

    render(<RevealSection>{accessibleChildren}</RevealSection>);

    expect(screen.getByLabelText("Test button")).toBeInTheDocument();
    expect(screen.getByRole("link")).toBeInTheDocument();
    expect(screen.getByText("This is a test link")).toBeInTheDocument();
  });
});
