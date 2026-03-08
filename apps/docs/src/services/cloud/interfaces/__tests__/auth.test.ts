import { checkIsAdmin, DEFAULT_ADMIN_DOMAINS } from "../auth";
import { CloudUser } from "../types";

describe("checkIsAdmin", () => {
  const adminEmail = "admin@phoenixrooivalk.com";
  const nonAdminEmail = "user@example.com";

  it("should return false when user is null", () => {
    expect(checkIsAdmin(null)).toBe(false);
  });

  it("should return false when user has no email", () => {
    const user = { uid: "123", email: null } as CloudUser;
    expect(checkIsAdmin(user)).toBe(false);
  });

  it("should return false when user email is empty string", () => {
    const user = { uid: "123", email: "" } as CloudUser;
    expect(checkIsAdmin(user)).toBe(false);
  });

  it("should return true when user email domain is in DEFAULT_ADMIN_DOMAINS", () => {
    const user = { uid: "123", email: adminEmail } as CloudUser;
    expect(checkIsAdmin(user)).toBe(true);

    const ghostUser = { uid: "123", email: "test@justaghost.dev" } as CloudUser;
    expect(checkIsAdmin(ghostUser)).toBe(true);
  });

  it("should return false when user email domain is not in DEFAULT_ADMIN_DOMAINS", () => {
    const user = { uid: "123", email: nonAdminEmail } as CloudUser;
    expect(checkIsAdmin(user)).toBe(false);
  });

  it("should be case-insensitive for user email", () => {
    const user = { uid: "123", email: adminEmail.toUpperCase() } as CloudUser;
    expect(checkIsAdmin(user)).toBe(true);
  });

  it("should be case-insensitive for admin domains", () => {
    const customDomains = ["Example.Com", "TEST.org"];
    const user = { uid: "123", email: "user@example.com" } as CloudUser;
    expect(checkIsAdmin(user, customDomains)).toBe(true);

    const user2 = { uid: "123", email: "user@TEST.ORG" } as CloudUser;
    expect(checkIsAdmin(user2, customDomains)).toBe(true);
  });

  it("should return true when using custom admin domains", () => {
    const customDomains = ["custom.com"];
    const user = { uid: "123", email: "user@custom.com" } as CloudUser;
    expect(checkIsAdmin(user, customDomains)).toBe(true);
  });

  it("should handle email without @ symbol gracefully", () => {
    const user = { uid: "123", email: "notanemail" } as CloudUser;
    expect(checkIsAdmin(user)).toBe(false);
  });

  it("should handle email with multiple @ symbols gracefully", () => {
    // split("@")[1] will take the part after first @
    const user = { uid: "123", email: "admin@phoenixrooivalk.com@extra.com" } as CloudUser;
    // Current implementation: user.email.split("@")[1] -> "phoenixrooivalk.com"
    // Then it checks if "phoenixrooivalk.com" is in adminDomains.
    expect(checkIsAdmin(user)).toBe(true);
  });
});
