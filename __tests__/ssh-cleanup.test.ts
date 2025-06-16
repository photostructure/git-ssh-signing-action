/**
 * Unit tests for SSH cleanup functionality
 */
import { jest } from "@jest/globals";
import * as core from "../__fixtures__/core.js";

// Mock modules
jest.unstable_mockModule("@actions/core", () => ({
  ...core,
  warning: jest.fn<(message: string | Error) => void>(),
  startGroup: jest.fn<(name: string) => void>(),
  endGroup: jest.fn<() => void>(),
  info: jest.fn<(message: string) => void>(),
  debug: jest.fn<(message: string) => void>(),
}));

const mockExec =
  jest.fn<
    (cmd: string, args?: string[], options?: unknown) => Promise<number>
  >();
jest.unstable_mockModule("@actions/exec", () => ({
  exec: mockExec,
}));

const mockFs = {
  access: jest.fn<(path: string) => Promise<void>>(),
  unlink: jest.fn<(path: string) => Promise<void>>(),
};
jest.unstable_mockModule("node:fs/promises", () => mockFs);

// Mock git module
const mockGit = {
  setConfig:
    jest.fn<(key: string, value: string, global?: boolean) => Promise<void>>(),
  unsetConfig: jest.fn<(key: string, global?: boolean) => Promise<boolean>>(),
};
jest.unstable_mockModule("../src/git.js", () => mockGit);

// Mock ssh module
const mockSSH = {
  removeKeyFromAgent: jest.fn<(keyPath: string) => Promise<void>>(),
};
jest.unstable_mockModule("../src/ssh.js", () => mockSSH);

// Mock state-helper module
const mockStateHelper = {
  StateKeys: {
    sshKeyPath: "sshKeyPath",
    gitUserName: "gitUserName",
    gitUserEmail: "gitUserEmail",
    gitSigningKey: "gitSigningKey",
    gitGpgFormat: "gitGpgFormat",
    gitCommitGpgsign: "gitCommitGpgsign",
    gitTagGpgsign: "gitTagGpgsign",
    gitPushGpgsign: "gitPushGpgsign",
    gitAllowedSignersFile: "gitAllowedSignersFile",
  },
  getState: jest.fn<(key: string) => string>(),
  getOriginalGitConfig: jest.fn<() => Record<string, string | undefined>>(),
};
jest.unstable_mockModule("../src/state-helper.js", () => mockStateHelper);

// Import the module being tested
const { run } = await import("../src/ssh-cleanup.js");
const coreModule = await import("@actions/core");

describe("ssh-cleanup.ts", () => {
  const mockKeyPath = "/home/runner/.ssh/signing_key";
  const mockOriginalConfig = {
    userName: "Original User",
    userEmail: "original@example.com",
    userSigningKey: "/original/key",
    gpgFormat: "openpgp",
    commitGpgSign: "false",
    tagGpgSign: "false",
    pushGpgSign: "false",
    allowedSignersFile: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mocks
    mockStateHelper.getState.mockImplementation((key: string) => {
      if (key === "sshKeyPath") return mockKeyPath;
      return "";
    });
    mockStateHelper.getOriginalGitConfig.mockReturnValue(mockOriginalConfig);

    mockFs.access.mockResolvedValue(undefined);
    mockFs.unlink.mockResolvedValue(undefined);

    mockGit.setConfig.mockResolvedValue(undefined);
    mockGit.unsetConfig.mockResolvedValue(true);

    mockSSH.removeKeyFromAgent.mockResolvedValue(undefined);

    mockExec.mockResolvedValue(0);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("run", () => {
    it("should clean up SSH signing successfully", async () => {
      await run();

      // Verify state was retrieved
      expect(mockStateHelper.getState).toHaveBeenCalledWith("sshKeyPath");

      // Verify SSH agent cleanup
      expect(mockSSH.removeKeyFromAgent).toHaveBeenCalledWith(mockKeyPath);

      // Verify git configuration restoration
      expect(mockGit.setConfig).toHaveBeenCalledWith(
        "user.name",
        "Original User",
      );
      expect(mockGit.setConfig).toHaveBeenCalledWith(
        "user.email",
        "original@example.com",
      );
      expect(mockGit.setConfig).toHaveBeenCalledWith(
        "user.signingkey",
        "/original/key",
      );
      expect(mockGit.setConfig).toHaveBeenCalledWith("gpg.format", "openpgp");
      expect(mockGit.setConfig).toHaveBeenCalledWith("commit.gpgsign", "false");
      expect(mockGit.setConfig).toHaveBeenCalledWith("tag.gpgsign", "false");
      expect(mockGit.setConfig).toHaveBeenCalledWith("push.gpgsign", "false");

      // Verify npm cleanup
      expect(mockExec).toHaveBeenCalledWith(
        "npm",
        ["config", "delete", "sign-git-tag"],
        expect.any(Object),
      );

      // Verify groups
      expect(coreModule.startGroup).toHaveBeenCalledWith(
        "🧹 Cleaning up SSH signing configuration",
      );
      expect(coreModule.endGroup).toHaveBeenCalled();
      expect(coreModule.info).toHaveBeenCalledWith(
        "✅ SSH signing cleanup complete",
      );

      // Verify no warnings
      expect(coreModule.warning).not.toHaveBeenCalled();
    });

    it("should skip cleanup if no key path saved", async () => {
      mockStateHelper.getState.mockReturnValue("");

      await run();

      expect(mockSSH.removeKeyFromAgent).not.toHaveBeenCalled();
      expect(mockFs.unlink).not.toHaveBeenCalled();
    });

    it("should handle missing files gracefully", async () => {
      mockFs.access.mockRejectedValue(new Error("ENOENT"));
      mockFs.unlink.mockRejectedValue(new Error("ENOENT"));

      await run();

      // Should not throw, just debug
      expect(coreModule.debug).toHaveBeenCalledWith(
        expect.stringContaining("File removal skipped"),
      );
      expect(coreModule.warning).not.toHaveBeenCalled();
    });

    it("should unset git config values that were not previously set", async () => {
      mockStateHelper.getOriginalGitConfig.mockReturnValue({
        userName: undefined,
        userEmail: undefined,
        userSigningKey: undefined,
        gpgFormat: undefined,
        commitGpgSign: undefined,
        tagGpgSign: undefined,
        pushGpgSign: undefined,
        allowedSignersFile: undefined,
      });

      await run();

      expect(mockGit.unsetConfig).toHaveBeenCalledWith("user.name");
      expect(mockGit.unsetConfig).toHaveBeenCalledWith("user.email");
      expect(mockGit.unsetConfig).toHaveBeenCalledWith("user.signingkey");
      expect(mockGit.unsetConfig).toHaveBeenCalledWith("gpg.format");
      expect(mockGit.unsetConfig).toHaveBeenCalledWith("commit.gpgsign");
      expect(mockGit.unsetConfig).toHaveBeenCalledWith("tag.gpgsign");
      expect(mockGit.unsetConfig).toHaveBeenCalledWith("push.gpgsign");
      expect(mockGit.unsetConfig).toHaveBeenCalledWith(
        "gpg.ssh.allowedSignersFile",
      );

      expect(mockGit.setConfig).not.toHaveBeenCalled();
    });

    it("should handle git config restoration errors gracefully", async () => {
      mockGit.setConfig.mockRejectedValue(new Error("Git config failed"));

      await run();

      expect(coreModule.debug).toHaveBeenCalledWith(
        expect.stringContaining("Failed to restore"),
      );
      expect(coreModule.warning).not.toHaveBeenCalled();
    });

    it("should handle npm cleanup errors gracefully", async () => {
      mockExec.mockRejectedValue(new Error("npm not found"));

      await run();

      expect(coreModule.debug).toHaveBeenCalledWith(
        "npm configuration cleanup skipped",
      );
      expect(coreModule.warning).not.toHaveBeenCalled();
    });

    it("should handle overall cleanup errors without failing workflow", async () => {
      mockSSH.removeKeyFromAgent.mockRejectedValue(new Error("Agent error"));

      await run();

      expect(coreModule.warning).toHaveBeenCalledWith(
        "Cleanup encountered errors: Agent error",
      );
    });

    it("should handle non-Error exceptions", async () => {
      mockSSH.removeKeyFromAgent.mockRejectedValue("String error");

      await run();

      expect(coreModule.warning).toHaveBeenCalledWith(
        "Cleanup encountered errors: String error",
      );
    });

    it("should restore allowed signers file if it was set", async () => {
      mockStateHelper.getOriginalGitConfig.mockReturnValue({
        ...mockOriginalConfig,
        allowedSignersFile: "/original/allowed_signers",
      });

      await run();

      expect(mockGit.setConfig).toHaveBeenCalledWith(
        "gpg.ssh.allowedSignersFile",
        "/original/allowed_signers",
      );
    });
  });
});
