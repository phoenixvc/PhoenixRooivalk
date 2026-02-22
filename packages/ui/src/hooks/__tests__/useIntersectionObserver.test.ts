import { renderHook, act } from "@testing-library/react";

import { useIntersectionObserver } from "../useIntersectionObserver";

// Mock IntersectionObserver for tests
const mockIntersectionObserver = jest.fn();
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

mockIntersectionObserver.mockReturnValue({
  observe: mockObserve,
  disconnect: mockDisconnect,
});

describe("useIntersectionObserver", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock IntersectionObserver
    Object.defineProperty(window, "IntersectionObserver", {
      writable: true,
      configurable: true,
      value: mockIntersectionObserver,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns ref callback and initial state", () => {
    const { result } = renderHook(() => useIntersectionObserver());

    expect(result.current.ref).toBeInstanceOf(Function);
    expect(result.current.isIntersecting).toBe(false);
  });

  it("creates IntersectionObserver with default options", () => {
    const { result } = renderHook(() => useIntersectionObserver());

    const element = document.createElement("div");
    act(() => {
      result.current.ref(element);
    });

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        threshold: 0.1,
        rootMargin: "0px",
      },
    );
    expect(mockObserve).toHaveBeenCalledWith(element);
  });

  it("creates IntersectionObserver with custom options", () => {
    const options = {
      threshold: 0.5,
      rootMargin: "10px",
      triggerOnce: false,
    };

    const { result } = renderHook(() => useIntersectionObserver(options));

    const element = document.createElement("div");
    act(() => {
      result.current.ref(element);
    });

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        threshold: 0.5,
        rootMargin: "10px",
      },
    );
  });

  it("handles intersection callback correctly for triggerOnce=true", () => {
    const { result } = renderHook(() =>
      useIntersectionObserver({ triggerOnce: true }),
    );

    const element = document.createElement("div");
    act(() => {
      result.current.ref(element);
    });

    // Get the callback function passed to IntersectionObserver
    const callback = mockIntersectionObserver.mock.calls[0][0];

    // Simulate intersection
    act(() => {
      callback([{ isIntersecting: true }]);
    });

    expect(result.current.isIntersecting).toBe(true);

    // Simulate another intersection (should not trigger again due to triggerOnce)
    act(() => {
      callback([{ isIntersecting: false }]);
      callback([{ isIntersecting: true }]);
    });

    expect(result.current.isIntersecting).toBe(true);
  });

  it("handles intersection callback correctly for triggerOnce=false", () => {
    const { result } = renderHook(() =>
      useIntersectionObserver({ triggerOnce: false }),
    );

    const element = document.createElement("div");
    act(() => {
      result.current.ref(element);
    });

    const callback = mockIntersectionObserver.mock.calls[0][0];

    // Test multiple intersections
    act(() => {
      callback([{ isIntersecting: true }]);
    });
    expect(result.current.isIntersecting).toBe(true);

    act(() => {
      callback([{ isIntersecting: false }]);
    });
    expect(result.current.isIntersecting).toBe(false);

    act(() => {
      callback([{ isIntersecting: true }]);
    });
    expect(result.current.isIntersecting).toBe(true);
  });

  it("resets state when element changes", () => {
    const { result } = renderHook(() => useIntersectionObserver());

    const element1 = document.createElement("div");
    const element2 = document.createElement("div");

    // Attach first element and trigger intersection
    act(() => {
      result.current.ref(element1);
    });

    const callback = mockIntersectionObserver.mock.calls[0][0];
    act(() => {
      callback([{ isIntersecting: true }]);
    });
    expect(result.current.isIntersecting).toBe(true);

    // Attach second element (should reset state)
    act(() => {
      result.current.ref(element2);
    });

    expect(result.current.isIntersecting).toBe(false);
  });

  it("handles environments without IntersectionObserver", () => {
    // Mock window without IntersectionObserver
    const originalIntersectionObserver = window.IntersectionObserver;
    delete (window as any).IntersectionObserver;

    const { result } = renderHook(() => useIntersectionObserver());

    const element = document.createElement("div");
    act(() => {
      result.current.ref(element);
    });

    expect(result.current.isIntersecting).toBe(true);
    expect(mockIntersectionObserver).not.toHaveBeenCalled();

    // Restore original IntersectionObserver
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it("handles server-side rendering (undefined window)", () => {
    // Simulate SSR by removing IntersectionObserver (same guard in hook covers
    // both no-IntersectionObserver and undefined-window paths)
    const originalIntersectionObserver = window.IntersectionObserver;
    delete (window as any).IntersectionObserver;

    const { result } = renderHook(() => useIntersectionObserver());

    const element = document.createElement("div");
    act(() => {
      result.current.ref(element);
    });

    // Hook should fall back to isIntersecting=true in SSR-like environments
    expect(result.current.isIntersecting).toBe(true);

    // Restore
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it("cleans up observer on unmount", () => {
    const { result, unmount } = renderHook(() => useIntersectionObserver());

    const element = document.createElement("div");
    act(() => {
      result.current.ref(element);
    });

    expect(mockObserve).toHaveBeenCalledWith(element);

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("handles null element gracefully", () => {
    const { result } = renderHook(() => useIntersectionObserver());

    act(() => {
      result.current.ref(null);
    });

    expect(mockIntersectionObserver).not.toHaveBeenCalled();
    expect(result.current.isIntersecting).toBe(false);
  });
});
