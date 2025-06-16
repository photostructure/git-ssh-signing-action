/**
 * Unit tests for SSH setup functionality
 */
import { jest } from "@jest/globals";
import * as core from "../__fixtures__/core.js";

// Mock modules
jest.unstable_mockModule("@actions/core", () => ({
  ...core,
  getBooleanInput: jest.fn<(name: string) => boolean>(),
  getInput: jest.fn<(name: string, options?: unknown) => string>(),
  setOutput: jest.fn<(name: string, value: string) => void>(),
  setFailed: jest.fn<(message: string | Error) => void>(),
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

// Mock context module
const mockGetContext = jest.fn();
jest.unstable_mockModule("../src/context.js", () => ({
  getContext: mockGetContext,
}));

// Mock git module
const mockGit = {
  setConfig:
    jest.fn<(key: string, value: string, global?: boolean) => Promise<void>>(),
  getConfig:
    jest.fn<(key: string, global?: boolean) => Promise<string | undefined>>(),
  displayConfig: jest.fn<(keys: string[]) => Promise<void>>(),
};
jest.unstable_mockModule("../src/git.js", () => mockGit);

// Mock ssh module
const mockSSH = {
  installSSHKey: jest.fn<(context: unknown) => Promise<string>>(),
  getSSHKeyInfo: jest.fn<(keyPath: string) => Promise<unknown>>(),
  addKeyToAgent: jest.fn<(keyPath: string) => Promise<boolean>>(),
  createAllowedSignersFile:
    jest.fn<
      (email: string, publicKey: string, keyPath: string) => Promise<string>
    >(),
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
  saveState: jest.fn<(key: string, value: string) => void>(),
  saveOriginalGitConfig:
    jest.fn<(config: Record<string, string | undefined>) => void>(),
};
jest.unstable_mockModule("../src/state-helper.js", () => mockStateHelper);

// Import the module being tested
const { run } = await import("../src/ssh-setup.js");
const coreModule = await import("@actions/core");

describe("ssh-setup.ts", () => {
  const mockPrivateKey = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBPnY3pvKUbLm5qr9yI5JadeR3UCtl/C0YJ2Ka1IhKqVQAAAJCyOPAHsjjw
BwAAAAtzc2gtZWQyNTUxOQAAACBPnY3pvKUbLm5qr9yI5JadeR3UCtl/C0YJ2Ka1IhKqVQ
AAAEDcGSzzU9D7mJXPGkYLen6DZsddVxpkIS7J4ZDqcKqLKE+djem8pRsubmqv3Ijklp15
HdQK2X8LRgnYprUiEqpVAAAACXRlc3RAZXhhbXBsZQECAwQ=
-----END OPENSSH PRIVATE KEY-----`;

  const mockPublicKey =
    "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIE+djem8pRsubmqv3Ijklp15HdQK2X8LRgnYprUiEqpV test@example";

  const mockContext = {
    sshSigningKey: mockPrivateKey,
    gitUserName: "Test User",
    gitUserEmail: "test@example.com",
    sshKeyPath: "~/.ssh/signing_key",
    gitCommitGpgSign: true,
    gitTagGpgSign: true,
    gitPushGpgSign: "if-asked",
    createAllowedSigners: true,
    resolvedKeyPath: "/home/runner/.ssh/signing_key",
    publicKeyPath: "/home/runner/.ssh/signing_key.pub",
  };

  const mockKeyInfo = {
    fingerprint: "SHA256:abcd1234...",
    type: "ED25519",
    bits: 256,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mocks
    mockGetContext.mockReturnValue(mockContext);
    mockSSH.installSSHKey.mockResolvedValue(mockPublicKey);
    mockSSH.getSSHKeyInfo.mockResolvedValue(mockKeyInfo);
    mockSSH.addKeyToAgent.mockResolvedValue(true);
    mockSSH.createAllowedSignersFile.mockResolvedValue(
      "/home/runner/.ssh/allowed_signers",
    );

    mockGit.setConfig.mockResolvedValue(undefined);
    mockGit.getConfig.mockResolvedValue(undefined);
    mockGit.displayConfig.mockResolvedValue(undefined);

    mockStateHelper.saveState.mockImplementation(() => {});
    mockStateHelper.saveOriginalGitConfig.mockImplementation(() => {});

    mockExec.mockResolvedValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("run", () => {
    it("should set up SSH signing successfully", async () => {
      await run();

      // Verify context was retrieved
      expect(mockGetContext).toHaveBeenCalled();

      // Verify original configuration saved
      expect(mockGit.getConfig).toHaveBeenCalledWith("user.name");
      expect(mockGit.getConfig).toHaveBeenCalledWith("user.email");
      expect(mockGit.getConfig).toHaveBeenCalledWith("user.signingkey");
      expect(mockGit.getConfig).toHaveBeenCalledWith("gpg.format");
      expect(mockGit.getConfig).toHaveBeenCalledWith("commit.gpgsign");
      expect(mockGit.getConfig).toHaveBeenCalledWith("tag.gpgsign");
      expect(mockGit.getConfig).toHaveBeenCalledWith("push.gpgsign");
      expect(mockGit.getConfig).toHaveBeenCalledWith(
        "gpg.ssh.allowedSignersFile",
      );
      expect(mockStateHelper.saveOriginalGitConfig).toHaveBeenCalled();

      // Verify SSH key installation
      expect(mockSSH.installSSHKey).toHaveBeenCalledWith(mockContext);
      expect(mockSSH.getSSHKeyInfo).toHaveBeenCalledWith(
        mockContext.resolvedKeyPath,
      );

      // Verify state saved
      expect(mockStateHelper.saveState).toHaveBeenCalledWith(
        "sshKeyPath",
        mockContext.resolvedKeyPath,
      );

      // Verify SSH agent
      expect(mockSSH.addKeyToAgent).toHaveBeenCalledWith(
        mockContext.resolvedKeyPath,
      );

      // Verify Git configuration
      expect(mockGit.setConfig).toHaveBeenCalledWith("user.name", "Test User");
      expect(mockGit.setConfig).toHaveBeenCalledWith(
        "user.email",
        "test@example.com",
      );
      expect(mockGit.setConfig).toHaveBeenCalledWith("gpg.format", "ssh");
      expect(mockGit.setConfig).toHaveBeenCalledWith(
        "user.signingkey",
        mockContext.publicKeyPath,
      );
      expect(mockGit.setConfig).toHaveBeenCalledWith("commit.gpgsign", "true");
      expect(mockGit.setConfig).toHaveBeenCalledWith("tag.gpgsign", "true");

      // Verify allowed signers
      expect(mockSSH.createAllowedSignersFile).toHaveBeenCalledWith(
        "test@example.com",
        mockPublicKey,
        mockContext.resolvedKeyPath,
      );
      expect(mockGit.setConfig).toHaveBeenCalledWith(
        "gpg.ssh.allowedSignersFile",
        "/home/runner/.ssh/allowed_signers",
      );

      // Verify npm configuration
      expect(mockExec).toHaveBeenCalledWith(
        "npm",
        ["--version"],
        expect.any(Object),
      );
      expect(mockExec).toHaveBeenCalledWith(
        "npm",
        ["config", "set", "sign-git-tag", "true"],
        expect.any(Object),
      );

      // Verify outputs
      expect(coreModule.setOutput).toHaveBeenCalledWith(
        "ssh-key-path",
        mockContext.resolvedKeyPath,
      );
      expect(coreModule.setOutput).toHaveBeenCalledWith(
        "public-key",
        mockPublicKey,
      );
      expect(coreModule.setOutput).toHaveBeenCalledWith(
        "key-fingerprint",
        mockKeyInfo.fingerprint,
      );

      // Verify no errors
      expect(coreModule.setFailed).not.toHaveBeenCalled();
    });

    it("should handle context validation errors", async () => {
      mockGetContext.mockImplementation(() => {
        throw new Error("ssh-signing-key input is required");
      });

      await run();

      expect(coreModule.setFailed).toHaveBeenCalledWith(
        "Setup failed: ssh-signing-key input is required",
      );
    });

    it("should handle SSH key installation failure", async () => {
      mockSSH.installSSHKey.mockRejectedValue(new Error("Invalid SSH key"));

      await run();

      expect(coreModule.setFailed).toHaveBeenCalledWith(
        "Setup failed: Invalid SSH key",
      );
    });

    it("should skip npm configuration if npm not available", async () => {
      mockExec.mockImplementation((cmd: string) => {
        if (cmd === "npm") {
          throw new Error("npm not found");
        }
        return Promise.resolve(0);
      });

      await run();

      expect(coreModule.debug).toHaveBeenCalledWith(
        "npm not available, skipping npm configuration",
      );
      expect(coreModule.setFailed).not.toHaveBeenCalled();
    });

    it("should skip allowed signers if not requested", async () => {
      mockGetContext.mockReturnValue({
        ...mockContext,
        createAllowedSigners: false,
      });

      await run();

      expect(mockSSH.createAllowedSignersFile).not.toHaveBeenCalled();
      expect(mockGit.setConfig).not.toHaveBeenCalledWith(
        "gpg.ssh.allowedSignersFile",
        expect.any(String),
      );
    });

    it("should skip push.gpgsign config if set to if-asked", async () => {
      await run();

      expect(mockGit.setConfig).not.toHaveBeenCalledWith(
        "push.gpgsign",
        "if-asked",
      );
    });

    it("should set push.gpgsign if not if-asked", async () => {
      mockGetContext.mockReturnValue({
        ...mockContext,
        gitPushGpgSign: "true",
      });

      await run();

      expect(mockGit.setConfig).toHaveBeenCalledWith("push.gpgsign", "true");
    });

    it("should skip commit.gpgsign if disabled", async () => {
      mockGetContext.mockReturnValue({
        ...mockContext,
        gitCommitGpgSign: false,
      });

      await run();

      expect(mockGit.setConfig).not.toHaveBeenCalledWith(
        "commit.gpgsign",
        expect.any(String),
      );
    });

    it("should display configuration group", async () => {
      await run();

      expect(coreModule.startGroup).toHaveBeenCalledWith(
        "🔐 Setting up SSH signing",
      );
      expect(coreModule.endGroup).toHaveBeenCalled();
      expect(mockGit.displayConfig).toHaveBeenCalledWith([
        "user.name",
        "user.email",
        "gpg.format",
        "user.signingkey",
        "commit.gpgsign",
        "tag.gpgsign",
        "push.gpgsign",
        "gpg.ssh.allowedSignersFile",
      ]);
    });

    it("should handle non-Error exceptions", async () => {
      mockSSH.installSSHKey.mockRejectedValue("String error");

      await run();

      expect(coreModule.setFailed).toHaveBeenCalledWith(
        "Setup failed: String error",
      );
    });
  });
});
