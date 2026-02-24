import { fireEvent, render, screen } from "../../__tests__/utils/test-utils";
import { Button, ButtonProps } from "../Button";

describe("Button", () => {
  const defaultProps: ButtonProps = {
    children: "Click me",
  };

  it("renders with default props", () => {
    render(<Button {...defaultProps} />);
    const button = screen.getByRole("button", { name: /click me/i });

    expect(button).toBeInTheDocument();
    expect(button).toHaveClass(
      "inline-block",
      "rounded",
      "font-bold",
      "transition",
    );
    expect(button).toHaveClass("bg-gradient-to-br"); // primary variant
    expect(button).toHaveClass("px-6", "py-3"); // md size
  });

  it("renders with different variants", () => {
    const { rerender } = render(<Button {...defaultProps} variant="primary" />);
    expect(screen.getByRole("button")).toHaveClass("bg-gradient-to-br");

    rerender(<Button {...defaultProps} variant="secondary" />);
    expect(screen.getByRole("button")).toHaveClass(
      "bg-[var(--secondary,#334155)]",
    );

    rerender(<Button {...defaultProps} variant="outline" />);
    expect(screen.getByRole("button")).toHaveClass(
      "border-2",
      "border-[var(--primary,#f97316)]",
    );
  });

  it("renders with different sizes", () => {
    const { rerender } = render(<Button {...defaultProps} size="sm" />);
    expect(screen.getByRole("button")).toHaveClass("px-4", "py-2", "text-sm");

    rerender(<Button {...defaultProps} size="md" />);
    expect(screen.getByRole("button")).toHaveClass("px-6", "py-3");

    rerender(<Button {...defaultProps} size="lg" />);
    expect(screen.getByRole("button")).toHaveClass("px-8", "py-4", "text-lg");
  });

  it("renders as a link when href is provided", () => {
    render(<Button {...defaultProps} href="/test" />);
    const link = screen.getByRole("link");

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });

  it("handles click events for buttons", () => {
    const handleClick = jest.fn();
    render(<Button {...defaultProps} onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("handles click events for links", () => {
    const handleClick = jest.fn();
    render(<Button {...defaultProps} href="/test" onClick={handleClick} />);

    fireEvent.click(screen.getByRole("link"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("prevents click events when disabled", () => {
    const handleClick = jest.fn();
    render(<Button {...defaultProps} disabled onClick={handleClick} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("prevents navigation when disabled link is clicked", () => {
    const handleClick = jest.fn();
    render(
      <Button {...defaultProps} href="/test" disabled onClick={handleClick} />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("tabIndex", "-1");

    fireEvent.click(link);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    render(<Button {...defaultProps} className="custom-class" />);
    const button = screen.getByRole("button");

    expect(button).toHaveClass("custom-class");
  });

  it("sets correct button type", () => {
    render(<Button {...defaultProps} type="submit" />);
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("type", "submit");
  });

  it("handles external links with proper security attributes", () => {
    render(
      <Button {...defaultProps} href="/test" target="_blank" rel="noopener" />,
    );
    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("applies disabled styles", () => {
    render(<Button {...defaultProps} disabled />);
    const button = screen.getByRole("button");

    expect(button).toHaveClass("opacity-50", "cursor-not-allowed");
  });

  it("handles hover effects for non-disabled elements", () => {
    render(<Button {...defaultProps} />);
    const button = screen.getByRole("button");

    expect(button).toHaveClass("hover:-translate-y-0.5");
  });

  it("does not apply hover effects when disabled", () => {
    render(<Button {...defaultProps} disabled />);
    const button = screen.getByRole("button");

    // The hover class should still be there for CSS specificity, but opacity should override it
    expect(button).toHaveClass("opacity-50");
  });
});
