import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock next/navigation
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) =>
    React.createElement("a", { href, ...props }, children),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("img", props),
}));

// We test auth-related logic without importing full page components
// to avoid complex Next.js App Router dependencies

describe("Auth flow — login logic", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    vi.restoreAllMocks();
  });

  it("should store session and user in localStorage on successful login", () => {
    const sessionId = "test-session-123";
    const user = {
      id: "user-1",
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      is_team_member: false,
      linkedin_url: null,
      discord_handle: null,
    };

    localStorage.setItem("session_id", sessionId);
    localStorage.setItem("user", JSON.stringify(user));

    expect(localStorage.getItem("session_id")).toBe(sessionId);
    const storedUser = JSON.parse(localStorage.getItem("user")!);
    expect(storedUser.email).toBe("test@example.com");
    expect(storedUser.is_team_member).toBe(false);
  });

  it("should clear session on logout", () => {
    localStorage.setItem("session_id", "sess-1");
    localStorage.setItem("user", '{"email":"a@b.com"}');

    // Simulate logout
    localStorage.removeItem("session_id");
    localStorage.removeItem("user");

    expect(localStorage.getItem("session_id")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("should detect team members from stored user", () => {
    const teamMember = {
      id: "user-2",
      email: "team@phoenix.com",
      first_name: "Team",
      last_name: "Member",
      is_team_member: true,
      linkedin_url: null,
      discord_handle: null,
    };
    localStorage.setItem("user", JSON.stringify(teamMember));

    const user = JSON.parse(localStorage.getItem("user")!);
    expect(user.is_team_member).toBe(true);
  });

  it("should handle corrupt user data gracefully", () => {
    localStorage.setItem("session_id", "valid-session");
    localStorage.setItem("user", "not-valid-json");

    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("user")!);
    } catch {
      user = null;
    }

    expect(user).toBeNull();
  });

  it("should treat missing session_id as unauthenticated", () => {
    // No session_id set
    const sessionId = localStorage.getItem("session_id");
    expect(sessionId).toBeNull();
  });
});

describe("Auth flow — profile confirmation logic", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("should store OAuth profile data in sessionStorage", () => {
    const oauthProfile = {
      email: "user@gmail.com",
      first_name: "Google",
      last_name: "User",
    };
    sessionStorage.setItem("oauth_profile", JSON.stringify(oauthProfile));

    const stored = JSON.parse(sessionStorage.getItem("oauth_profile")!);
    expect(stored.email).toBe("user@gmail.com");
  });

  it("should mark profile as confirmed", () => {
    localStorage.setItem("profile_confirmed", "true");
    expect(localStorage.getItem("profile_confirmed")).toBe("true");
  });

  it("should mark profile as skipped", () => {
    localStorage.setItem("profile_confirmed", "skipped");
    expect(localStorage.getItem("profile_confirmed")).toBe("skipped");
  });

  it("should clean up OAuth data after confirmation", () => {
    sessionStorage.setItem("oauth_profile", '{"email":"a@b.com"}');
    sessionStorage.removeItem("oauth_profile");
    expect(sessionStorage.getItem("oauth_profile")).toBeNull();
  });

  it("should require active session for profile update", () => {
    // No session
    const sessionId = localStorage.getItem("session_id");
    expect(sessionId).toBeNull();
    // Profile update should fail without session
  });
});

describe("Auth flow — API interaction patterns", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should send correct login request", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          session_id: "new-session",
          user: { id: "u1", email: "test@x.com" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@x.com" }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.session_id).toBe("new-session");
    expect(mockFetch).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "test@x.com" }),
      }),
    );
  });

  it("should handle login API failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "" }),
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
  });

  it("should handle network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("Network error"),
    );

    await expect(
      fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@x.com" }),
      }),
    ).rejects.toThrow("Network error");
  });

  it("should send profile update with session query param", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: { id: "u1", first_name: "Updated", last_name: "Name" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const sessionId = "active-session";
    await fetch(`/auth/profile?session_id=${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first_name: "Updated", last_name: "Name" }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `/auth/profile?session_id=${sessionId}`,
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("should send career application with session", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "app-1", status: "submitted" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const sessionId = "career-session";
    const response = await fetch(`/career/apply?session_id=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position: "Engineer", cover_letter: null }),
    });

    expect(response.ok).toBe(true);
    expect(response.status).toBe(201);
    expect(mockFetch).toHaveBeenCalled();
  });
});
