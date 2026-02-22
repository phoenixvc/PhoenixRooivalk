import { test, expect } from "@playwright/test";

const API_URL = process.env.API_URL || "http://localhost:8080";

test.describe("API health checks", () => {
  test("GET /health returns 200", async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok()).toBeTruthy();
  });

  test("GET /evidence returns 200 with list", async ({ request }) => {
    const response = await request.get(`${API_URL}/evidence`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty("items");
  });

  test("GET /countermeasures returns 200 with list", async ({ request }) => {
    const response = await request.get(`${API_URL}/countermeasures`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty("items");
  });

  test("POST /auth/login with valid email returns session", async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { email: "e2e-test@example.com" },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty("session_id");
  });

  test("GET /api/v1/x402/status returns protocol status", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/v1/x402/status`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty("enabled");
  });
});
