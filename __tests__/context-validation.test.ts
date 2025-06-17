/**
 * Tests for context input validation
 */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

// Create mock functions
const mockGetInput =
  jest.fn<(name: string, options?: { required?: boolean }) => string>();
const mockGetBooleanInput = jest.fn<(name: string) => boolean>();

// Mock @actions/core
jest.unstable_mockModule("@actions/core", () => ({
  getInput: mockGetInput,
  getBooleanInput: mockGetBooleanInput,
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  startGroup: jest.fn(),
  endGroup: jest.fn(),
}));

describe("Context Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default valid inputs
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "ssh-signing-key": "test-key",
        "git-user-name": "Test User",
        "git-user-email": "test@example.com",
        "ssh-key-path": "~/.ssh/signing_key",
        "git-commit-gpgsign": "true",
        "git-tag-gpgsign": "true",
        "git-push-gpgsign": "if-asked",
        "git-config-scope": "local",
      };
      return inputs[name] || "";
    });

    mockGetBooleanInput.mockImplementation((name: string) => {
      return name === "create-allowed-signers" ? true : false;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("git-config-scope validation", () => {
    it("should accept 'local' scope", async () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === "git-config-scope") return "local";
        if (name === "ssh-signing-key") return "test-key";
        if (name === "git-user-name") return "Test User";
        if (name === "git-user-email") return "test@example.com";
        return "";
      });

      const { getContext } = await import("../src/context.js");
      const context = getContext();
      expect(context.gitConfigScope).toBe("local");
    });

    it("should accept 'global' scope", async () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === "git-config-scope") return "global";
        if (name === "ssh-signing-key") return "test-key";
        if (name === "git-user-name") return "Test User";
        if (name === "git-user-email") return "test@example.com";
        return "";
      });

      const { getContext } = await import("../src/context.js");
      const context = getContext();
      expect(context.gitConfigScope).toBe("global");
    });

    it("should default to 'local' when not specified", async () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === "git-config-scope") return "";
        if (name === "ssh-signing-key") return "test-key";
        if (name === "git-user-name") return "Test User";
        if (name === "git-user-email") return "test@example.com";
        return "";
      });

      const { getContext } = await import("../src/context.js");
      const context = getContext();
      expect(context.gitConfigScope).toBe("local");
    });

    it("should reject invalid scope values", async () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === "git-config-scope") return "invalid";
        if (name === "ssh-signing-key") return "test-key";
        if (name === "git-user-name") return "Test User";
        if (name === "git-user-email") return "test@example.com";
        return "";
      });

      const { getContext } = await import("../src/context.js");
      expect(() => getContext()).toThrow(
        'Invalid git-config-scope value: invalid. Must be "local" or "global"',
      );
    });

    it("should use default for empty string after trimming", async () => {
      // When getInput returns empty string (after trimming), it should use default
      mockGetInput.mockImplementation((name: string) => {
        if (name === "git-config-scope") return ""; // Empty after trim
        if (name === "ssh-signing-key") return "test-key";
        if (name === "git-user-name") return "Test User";
        if (name === "git-user-email") return "test@example.com";
        return "";
      });

      const { getContext } = await import("../src/context.js");
      const context = getContext();
      expect(context.gitConfigScope).toBe("local"); // Should use default
    });
  });

  describe("git-push-gpgsign validation", () => {
    it("should accept valid values", async () => {
      const validValues = ["if-asked", "true", "false"];

      for (const value of validValues) {
        mockGetInput.mockImplementation((name: string) => {
          if (name === "git-push-gpgsign") return value;
          if (name === "ssh-signing-key") return "test-key";
          if (name === "git-user-name") return "Test User";
          if (name === "git-user-email") return "test@example.com";
          return "";
        });

        const { getContext } = await import("../src/context.js");
        const context = getContext();
        expect(context.gitPushGpgSign).toBe(value);
      }
    });

    it("should reject invalid values", async () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === "git-push-gpgsign") return "invalid";
        if (name === "ssh-signing-key") return "test-key";
        if (name === "git-user-name") return "Test User";
        if (name === "git-user-email") return "test@example.com";
        return "";
      });

      const { getContext } = await import("../src/context.js");
      expect(() => getContext()).toThrow(
        "Invalid git-push-gpgsign value: invalid",
      );
    });
  });
});
