/**
 * Integration tests for the SSH signing action
 */
import * as exec from "@actions/exec";
import { jest } from "@jest/globals";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import * as core from "../__fixtures__/core.js";
import { TEST_ED25519_PRIVATE_KEY } from "../__fixtures__/ssh-keys.js";

// Mock only @actions/core since we want to test the actual exec functionality
jest.unstable_mockModule("@actions/core", () => ({
  ...core,
  getBooleanInput: jest.fn<(name: string) => boolean>(),
  getInput: jest.fn<(name: string, options?: unknown) => string>(),
  setOutput: jest.fn<(name: string, value: unknown) => void>(),
  setFailed: jest.fn<(message: string | Error) => void>(),
  startGroup: jest.fn<(name: string) => void>(),
  endGroup: jest.fn<() => void>(),
  info: jest.fn<(message: string) => void>(),
  debug: jest.fn<(message: string) => void>(),
  warning: jest.fn<(message: string | Error) => void>(),
  getState: jest.fn<(name: string) => string>(),
  saveState: jest.fn<(name: string, value: unknown) => void>(),
}));

// Dynamic imports after mocking
const { run: runSetup } = await import("../src/ssh-setup.js");
const { run: runCleanup } = await import("../src/ssh-cleanup.js");
const coreModule = await import("@actions/core");

describe("Integration Tests", () => {
  let tempDir: string;
  let sshKeyPath: string;
  let originalCwd: string;
  const originalGitConfig: Record<string, string | undefined> = {};

  // Override process.env to ensure git uses local config only
  const originalHome = process.env.HOME;
  const originalGitConfigNosystem = process.env.GIT_CONFIG_NOSYSTEM;

  // Helper to get git config value
  async function getGitConfig(key: string): Promise<string | undefined> {
    // Safety check - ensure we're in the temp directory
    if (!process.cwd().includes("ssh-action-test-")) {
      throw new Error("Test is not running in temp directory!");
    }

    try {
      let output = "";
      await exec.exec("git", ["config", "--local", "--get", key], {
        silent: true,
        ignoreReturnCode: true,
        listeners: {
          stdout: (data: Buffer) => {
            output += data.toString();
          },
        },
      });
      return output.trim() || undefined;
    } catch {
      return undefined;
    }
  }

  // Helper to save current git config
  async function saveGitConfig(keys: string[]): Promise<void> {
    for (const key of keys) {
      originalGitConfig[key] = await getGitConfig(key);
    }
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    // Save original directory FIRST
    originalCwd = process.cwd();

    // Create temporary directory for tests
    tempDir = await fs.mkdtemp(path.join(tmpdir(), "ssh-action-test-"));
    sshKeyPath = path.join(tempDir, "test_key");

    // Set environment to prevent git from using global config
    process.env.HOME = tempDir;
    process.env.GIT_CONFIG_NOSYSTEM = "1";

    // Change to temp directory and initialize git repository
    process.chdir(tempDir);
    await exec.exec("git", ["init"], { silent: true });

    // Set a dummy git identity to avoid polluting global config
    await exec.exec("git", ["config", "user.name", "Test User"], {
      silent: true,
    });
    await exec.exec("git", ["config", "user.email", "test@example.com"], {
      silent: true,
    });

    // Save current git config IN THE TEMP REPO
    await saveGitConfig([
      "user.name",
      "user.email",
      "user.signingkey",
      "gpg.format",
      "commit.gpgsign",
      "tag.gpgsign",
      "push.gpgsign",
      "gpg.ssh.allowedSignersFile",
    ]);

    // Set up default mocks
    (coreModule.getInput as jest.Mock<unknown[], string>).mockImplementation(
      (name: string) => {
        switch (name) {
          case "ssh-signing-key":
            return TEST_ED25519_PRIVATE_KEY;
          case "git-user-name":
            return "Integration Test";
          case "git-user-email":
            return "test@example.com";
          case "ssh-key-path":
            return sshKeyPath;
          case "git-push-gpgsign":
            return "if-asked";
          default:
            return "";
        }
      },
    );
    (
      coreModule.getBooleanInput as jest.Mock<unknown[], boolean>
    ).mockReturnValue(true);
    (coreModule.getState as jest.Mock<unknown[], string>).mockReturnValue("");
    (coreModule.saveState as jest.Mock<unknown[], void>).mockImplementation(
      () => {},
    );
    (coreModule.setOutput as jest.Mock<unknown[], void>).mockImplementation(
      () => {},
    );
    (coreModule.setFailed as jest.Mock<unknown[], void>).mockImplementation(
      () => {},
    );
    (coreModule.startGroup as jest.Mock<unknown[], void>).mockImplementation(
      () => {},
    );
    (coreModule.endGroup as jest.Mock<unknown[], void>).mockImplementation(
      () => {},
    );
    (coreModule.info as jest.Mock<unknown[], void>).mockImplementation(
      () => {},
    );
    (coreModule.debug as jest.Mock<unknown[], void>).mockImplementation(
      () => {},
    );
    (coreModule.warning as jest.Mock<unknown[], void>).mockImplementation(
      () => {},
    );
  });

  afterEach(async () => {
    // Always restore the original directory first
    try {
      process.chdir(originalCwd);
    } catch (error) {
      console.error("Failed to restore directory:", error);
    }

    // Restore environment variables
    if (originalHome !== undefined) {
      process.env.HOME = originalHome;
    } else {
      delete process.env.HOME;
    }

    if (originalGitConfigNosystem !== undefined) {
      process.env.GIT_CONFIG_NOSYSTEM = originalGitConfigNosystem;
    } else {
      delete process.env.GIT_CONFIG_NOSYSTEM;
    }

    // Clean up mocks
    jest.restoreAllMocks();

    // Clean up temp directory if it exists
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error("Failed to clean up temp directory:", error);
      }
    }
  });

  describe("Full workflow", () => {
    it("should complete setup and cleanup cycle successfully", async () => {
      // Setup phase
      (coreModule.getState as jest.Mock).mockReturnValue(""); // Not in post phase

      // Run setup
      await runSetup();

      // Verify setup completed
      expect(coreModule.setFailed).not.toHaveBeenCalled();
      // No longer using isPost state with separate entry points
      expect(coreModule.setOutput).toHaveBeenCalledWith(
        "ssh-key-path",
        sshKeyPath,
      );
      expect(coreModule.setOutput).toHaveBeenCalledWith(
        "public-key",
        expect.stringContaining("ssh-ed25519"),
      );

      // Verify files were created
      await expect(fs.access(sshKeyPath)).resolves.not.toThrow();
      await expect(fs.access(`${sshKeyPath}.pub`)).resolves.not.toThrow();

      // Verify git was configured
      expect(await getGitConfig("user.name")).toBe("Integration Test");
      expect(await getGitConfig("user.email")).toBe("test@example.com");
      expect(await getGitConfig("gpg.format")).toBe("ssh");
      expect(await getGitConfig("commit.gpgsign")).toBe("true");
      expect(await getGitConfig("tag.gpgsign")).toBe("true");

      // No need to simulate post-action phase with separate entry points

      // Mock the saved state values
      (coreModule.getState as jest.Mock<unknown[], string>).mockImplementation(
        (name: string) => {
          if (name === "isPost") return "true";
          if (name === "sshKeyPath") return sshKeyPath;
          if (name === "gitConfigScope") return "local";
          return "";
        },
      );

      jest.clearAllMocks();

      // Run cleanup
      await runCleanup();

      // Verify cleanup completed
      expect(coreModule.setFailed).not.toHaveBeenCalled();

      // Verify files were removed
      await expect(fs.access(sshKeyPath)).rejects.toThrow();
      await expect(fs.access(`${sshKeyPath}.pub`)).rejects.toThrow();
    });
  });

  describe("Error scenarios", () => {
    it("should handle invalid SSH key format", async () => {
      (coreModule.getInput as jest.Mock<unknown[], string>).mockImplementation(
        (name: string) => {
          switch (name) {
            case "ssh-signing-key":
              return "not-a-valid-ssh-key";
            case "git-user-name":
              return "Test User";
            case "git-user-email":
              return "test@example.com";
            case "ssh-key-path":
              return sshKeyPath;
            default:
              return "";
          }
        },
      );

      await runSetup();

      expect(coreModule.setFailed).toHaveBeenCalledWith(
        expect.stringContaining("Setup failed"),
      );
    });

    it("should handle permission errors gracefully", async () => {
      // Create a directory where we can't write
      const restrictedPath = path.join(tempDir, "restricted", "key");
      await fs.mkdir(path.dirname(restrictedPath), { mode: 0o555 });

      (coreModule.getInput as jest.Mock<unknown[], string>).mockImplementation(
        (name: string) => {
          switch (name) {
            case "ssh-signing-key":
              return TEST_ED25519_PRIVATE_KEY;
            case "git-user-name":
              return "Test User";
            case "git-user-email":
              return "test@example.com";
            case "ssh-key-path":
              return restrictedPath;
            default:
              return "";
          }
        },
      );

      await runSetup();

      expect(coreModule.setFailed).toHaveBeenCalledWith(
        expect.stringContaining("Setup failed"),
      );

      // Restore permissions for cleanup
      await fs.chmod(path.dirname(restrictedPath), 0o755);
    });
  });

  describe("Git configuration", () => {
    it("should configure git correctly for SSH signing", async () => {
      await runSetup();

      // Verify git was configured correctly using actual git commands
      expect(await getGitConfig("user.name")).toBe("Integration Test");
      expect(await getGitConfig("user.email")).toBe("test@example.com");
      expect(await getGitConfig("gpg.format")).toBe("ssh");
      expect(await getGitConfig("user.signingkey")).toBe(`${sshKeyPath}.pub`);
      expect(await getGitConfig("commit.gpgsign")).toBe("true");
      expect(await getGitConfig("tag.gpgsign")).toBe("true");
    });
  });

  describe("Path handling", () => {
    it("should handle absolute paths correctly", async () => {
      await runSetup();

      expect(coreModule.setOutput).toHaveBeenCalledWith(
        "ssh-key-path",
        sshKeyPath,
      );
      expect(coreModule.setFailed).not.toHaveBeenCalled();
    });

    it("should create parent directories if needed", async () => {
      const nestedPath = path.join(tempDir, "deep", "nested", "dir", "key");
      (coreModule.getInput as jest.Mock<unknown[], string>).mockImplementation(
        (name: string) => {
          switch (name) {
            case "ssh-signing-key":
              return TEST_ED25519_PRIVATE_KEY;
            case "git-user-name":
              return "Test User";
            case "git-user-email":
              return "test@example.com";
            case "ssh-key-path":
              return nestedPath;
            default:
              return "";
          }
        },
      );

      await runSetup();

      expect(coreModule.setFailed).not.toHaveBeenCalled();
      await expect(fs.access(nestedPath)).resolves.not.toThrow();
      await expect(fs.access(`${nestedPath}.pub`)).resolves.not.toThrow();
    });
  });

  describe("SSH key handling", () => {
    it("should extract correct SSH key information", async () => {
      await runSetup();

      const publicKeyCall = (coreModule.setOutput as jest.Mock).mock.calls.find(
        (call) => call[0] === "public-key",
      );
      expect(publicKeyCall).toBeDefined();
      expect(publicKeyCall?.[1]).toMatch(/^ssh-ed25519 AAAAC3NzaC1lZDI1NTE5/);
      expect(publicKeyCall?.[1]).toContain("test@example.com");
    });

    it("should create files with correct permissions", async () => {
      await runSetup();

      const stats = await fs.stat(sshKeyPath);
      // Check that file is readable only by owner (0o600)
      expect(stats.mode & 0o777).toBe(0o600);
    });
  });
});
