import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "../../__tests__/utils/test-utils";
import { QuickActionsWidget } from "../QuickActionsWidget";

const mockActions = [
  {
    icon: "📋",
    label: "Copy Code",
    action: jest.fn(),
  },
  {
    icon: "🔗",
    label: "Share Link",
    action: jest.fn(),
  },
  {
    icon: "⚙️",
    label: "Settings",
    action: jest.fn(),
  },
];

describe("QuickActionsWidget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the widget title", () => {
    render(<QuickActionsWidget actions={mockActions} />);

    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
  });

  it("renders all provided actions", () => {
    render(<QuickActionsWidget actions={mockActions} />);

    expect(screen.getByText("Copy Code")).toBeInTheDocument();
    expect(screen.getByText("Share Link")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders action icons", () => {
    render(<QuickActionsWidget actions={mockActions} />);

    expect(screen.getByText("📋")).toBeInTheDocument();
    expect(screen.getByText("🔗")).toBeInTheDocument();
    expect(screen.getByText("⚙️")).toBeInTheDocument();
  });

  it("calls action function when button is clicked", () => {
    render(<QuickActionsWidget actions={mockActions} />);

    const copyButton = screen.getByText("Copy Code").closest("button");
    fireEvent.click(copyButton!);

    expect(mockActions[0].action).toHaveBeenCalledTimes(1);
  });

  it("calls correct action for each button", () => {
    render(<QuickActionsWidget actions={mockActions} />);

    const shareButton = screen.getByText("Share Link").closest("button");
    const settingsButton = screen.getByText("Settings").closest("button");

    fireEvent.click(shareButton!);
    fireEvent.click(settingsButton!);

    expect(mockActions[1].action).toHaveBeenCalledTimes(1);
    expect(mockActions[2].action).toHaveBeenCalledTimes(1);
    expect(mockActions[0].action).not.toHaveBeenCalled();
  });

  it("applies correct styling classes", () => {
    render(<QuickActionsWidget actions={mockActions} />);

    const container = screen.getByText("Quick Actions").closest(".fixed");
    expect(container).toHaveClass("fixed", "bottom-6", "right-6", "z-50");
  });

  it("renders empty when no actions provided", () => {
    render(<QuickActionsWidget actions={[]} />);

    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("handles async actions", async () => {
    const asyncAction = jest.fn().mockResolvedValue(undefined);
    const actionsWithAsync = [
      ...mockActions,
      { icon: "⏳", label: "Async Action", action: asyncAction },
    ];

    render(<QuickActionsWidget actions={actionsWithAsync} />);

    const asyncButton = screen.getByText("Async Action").closest("button");
    fireEvent.click(asyncButton!);

    await waitFor(() => {
      expect(asyncAction).toHaveBeenCalledTimes(1);
    });
  });

  it("maintains button accessibility", () => {
    render(<QuickActionsWidget actions={mockActions} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);

    buttons.forEach((button: HTMLElement) => {
      expect(button).toHaveAttribute("type", "button");
    });
  });
});
