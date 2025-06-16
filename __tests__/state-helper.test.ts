/**
 * Unit tests for state-helper functionality
 */
import { jest } from "@jest/globals";
import * as core from "../__fixtures__/core.js";

// Mock @actions/core
jest.unstable_mockModule("@actions/core", () => ({
  ...core,
  saveState: jest.fn<(name: string, value: string) => void>(),
  getState: jest.fn<(name: string) => string>(),
}));

// Import modules after mocking
const {
  saveState,
  getState,
  hasState,
  StateKeys,
  saveOriginalGitConfig,
  getOriginalGitConfig,
} = await import("../src/state-helper.js");
const coreModule = await import("@actions/core");

describe("state-helper.ts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (coreModule.getState as jest.Mock).mockReturnValue("");
    (coreModule.saveState as jest.Mock).mockImplementation(() => {});
  });

  describe("StateKeys", () => {
    it("should have all expected state keys", () => {
      expect(StateKeys.sshKeyPath).toBe("sshKeyPath");
      expect(StateKeys.gitUserName).toBe("gitUserName");
      expect(StateKeys.gitUserEmail).toBe("gitUserEmail");
      expect(StateKeys.gitSigningKey).toBe("gitSigningKey");
      expect(StateKeys.gitGpgFormat).toBe("gitGpgFormat");
      expect(StateKeys.gitCommitGpgSign).toBe("gitCommitGpgSign");
      expect(StateKeys.gitTagGpgSign).toBe("gitTagGpgSign");
      expect(StateKeys.gitPushGpgSign).toBe("gitPushGpgSign");
      expect(StateKeys.gitAllowedSignersFile).toBe("gitAllowedSignersFile");
    });
  });

  describe("saveState", () => {
    it("should save state with valid key", () => {
      saveState(StateKeys.sshKeyPath, "/path/to/key");

      expect(coreModule.saveState).toHaveBeenCalledWith(
        "sshKeyPath",
        "/path/to/key",
      );
    });
  });

  describe("getState", () => {
    it("should get state with valid key", () => {
      (coreModule.getState as jest.Mock).mockReturnValue("/saved/path");

      const result = getState(StateKeys.sshKeyPath);

      expect(coreModule.getState).toHaveBeenCalledWith("sshKeyPath");
      expect(result).toBe("/saved/path");
    });
  });

  describe("hasState", () => {
    it("should return true when state exists", () => {
      (coreModule.getState as jest.Mock).mockReturnValue("some-value");

      const result = hasState(StateKeys.sshKeyPath);

      expect(result).toBe(true);
    });

    it("should return false when state is empty", () => {
      (coreModule.getState as jest.Mock).mockReturnValue("");

      const result = hasState(StateKeys.sshKeyPath);

      expect(result).toBe(false);
    });
  });

  describe("saveOriginalGitConfig", () => {
    it("should save all defined config values", () => {
      const config = {
        userSigningKey: "/original/key",
        gpgFormat: "openpgp",
        commitGpgSign: "true",
        tagGpgSign: "false",
        pushGpgSign: "if-asked",
        allowedSignersFile: "/path/to/signers",
        userName: "Original User",
        userEmail: "original@example.com",
      };

      saveOriginalGitConfig(config);

      expect(coreModule.saveState).toHaveBeenCalledWith(
        "gitSigningKey",
        "/original/key",
      );
      expect(coreModule.saveState).toHaveBeenCalledWith(
        "gitGpgFormat",
        "openpgp",
      );
      expect(coreModule.saveState).toHaveBeenCalledWith(
        "gitCommitGpgSign",
        "true",
      );
      expect(coreModule.saveState).toHaveBeenCalledWith(
        "gitTagGpgSign",
        "false",
      );
      expect(coreModule.saveState).toHaveBeenCalledWith(
        "gitPushGpgSign",
        "if-asked",
      );
      expect(coreModule.saveState).toHaveBeenCalledWith(
        "gitAllowedSignersFile",
        "/path/to/signers",
      );
      expect(coreModule.saveState).toHaveBeenCalledWith(
        "gitUserName",
        "Original User",
      );
      expect(coreModule.saveState).toHaveBeenCalledWith(
        "gitUserEmail",
        "original@example.com",
      );
    });

    it("should skip undefined config values", () => {
      const config = {
        userSigningKey: "/original/key",
        gpgFormat: undefined,
        commitGpgSign: undefined,
        tagGpgSign: undefined,
        pushGpgSign: undefined,
        allowedSignersFile: undefined,
        userName: undefined,
        userEmail: undefined,
      };

      saveOriginalGitConfig(config);

      expect(coreModule.saveState).toHaveBeenCalledTimes(1);
      expect(coreModule.saveState).toHaveBeenCalledWith(
        "gitSigningKey",
        "/original/key",
      );
    });
  });

  describe("getOriginalGitConfig", () => {
    it("should retrieve all saved config values", () => {
      (coreModule.getState as jest.Mock).mockImplementation((key: unknown) => {
        const values: Record<string, string> = {
          gitSigningKey: "/saved/key",
          gitGpgFormat: "ssh",
          gitCommitGpgSign: "true",
          gitTagGpgSign: "true",
          gitPushGpgSign: "false",
          gitAllowedSignersFile: "/saved/signers",
          gitUserName: "Saved User",
          gitUserEmail: "saved@example.com",
        };
        return typeof key === "string" ? values[key] || "" : "";
      });

      const config = getOriginalGitConfig();

      expect(config).toEqual({
        userSigningKey: "/saved/key",
        gpgFormat: "ssh",
        commitGpgSign: "true",
        tagGpgSign: "true",
        pushGpgSign: "false",
        allowedSignersFile: "/saved/signers",
        userName: "Saved User",
        userEmail: "saved@example.com",
      });
    });

    it("should return undefined for unsaved values", () => {
      (coreModule.getState as jest.Mock).mockReturnValue("");

      const config = getOriginalGitConfig();

      expect(config).toEqual({
        userSigningKey: undefined,
        gpgFormat: undefined,
        commitGpgSign: undefined,
        tagGpgSign: undefined,
        pushGpgSign: undefined,
        allowedSignersFile: undefined,
        userName: undefined,
        userEmail: undefined,
      });
    });
  });
});
