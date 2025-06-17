/**
 * Simple integration test for the action
 * Tests the basic functionality without complex mocking
 */
import { exec } from "@actions/exec";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

describe("Action Integration", () => {
  let testDir: string;
  let repoDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();

    // Create test directory and repo
    testDir = await fs.mkdtemp(path.join(tmpdir(), "action-test-"));
    repoDir = path.join(testDir, "repo");

    await fs.mkdir(repoDir);
    await exec("git", ["init"], { cwd: repoDir, silent: true });

    // Set up a basic git identity to avoid warnings
    await exec("git", ["config", "user.name", "Test Runner"], {
      cwd: repoDir,
      silent: true,
    });
    await exec("git", ["config", "user.email", "test@runner.local"], {
      cwd: repoDir,
      silent: true,
    });

    process.chdir(repoDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("should configure git for SSH signing", async () => {
    // Generate a test SSH key
    const keyPath = path.join(testDir, "test_key");
    await exec(
      "ssh-keygen",
      ["-t", "ed25519", "-f", keyPath, "-N", "", "-C", "test@example.com"],
      { silent: true },
    );

    const privateKey = await fs.readFile(keyPath, "utf8");

    // Set environment variables as the action would receive them
    process.env.INPUT_SSH_SIGNING_KEY = privateKey;
    process.env.INPUT_GIT_USER_NAME = "Action Test User";
    process.env.INPUT_GIT_USER_EMAIL = "action@test.com";
    process.env.INPUT_SSH_KEY_PATH = path.join(testDir, "signing_key");
    process.env.INPUT_GIT_CONFIG_SCOPE = "local";
    process.env.INPUT_CREATE_ALLOWED_SIGNERS = "true";

    // This would normally be done by the action runner
    process.env.GITHUB_ACTIONS = "true";

    // In a real test environment, we'd run the action directly
    // For now, we'll just verify our git configuration works
    const { setConfig, getConfig } = await import("../src/git.js");

    // Test setting config
    await setConfig({
      key: "user.name",
      value: "Action Test User",
      scope: "local",
    });
    await setConfig({ key: "gpg.format", value: "ssh", scope: "local" });

    // Verify config was set
    const name = await getConfig({ key: "user.name", scope: "local" });
    const format = await getConfig({ key: "gpg.format", scope: "local" });

    expect(name).toBe("Action Test User");
    expect(format).toBe("ssh");

    // Test that we can create a signed commit
    await fs.writeFile(path.join(repoDir, "test.txt"), "test content");
    await exec("git", ["add", "test.txt"], { cwd: repoDir, silent: true });

    // Set up the actual signing key
    await fs.writeFile(path.join(testDir, "signing_key"), privateKey, {
      mode: 0o600,
    });
    await fs.writeFile(
      path.join(testDir, "signing_key.pub"),
      await fs.readFile(`${keyPath}.pub`, "utf8"),
    );

    // Configure git to use the signing key
    await setConfig({
      key: "user.signingkey",
      value: path.join(testDir, "signing_key.pub"),
      scope: "local",
    });
    await setConfig({ key: "commit.gpgsign", value: "true", scope: "local" });

    // Create allowed signers file
    const allowedSigners = `action@test.com ${await fs.readFile(`${keyPath}.pub`, "utf8")}`;
    const allowedSignersPath = path.join(testDir, "allowed_signers");
    await fs.writeFile(allowedSignersPath, allowedSigners);
    await setConfig({
      key: "gpg.ssh.allowedSignersFile",
      value: allowedSignersPath,
      scope: "local",
    });

    // Make a signed commit
    await exec("git", ["commit", "-m", "Test signed commit"], {
      cwd: repoDir,
      silent: true,
    });

    // Verify the commit is signed
    let logOutput = "";
    await exec("git", ["log", "--show-signature", "-1"], {
      cwd: repoDir,
      silent: true,
      listeners: {
        stdout: (data: Buffer) => {
          logOutput += data.toString();
        },
      },
    });

    // Check that the commit is signed (SSH signature format)
    expect(logOutput).toContain('Good "git" signature for action@test.com');
    expect(logOutput).toContain("Test signed commit");

    // Test signed tags as well
    await setConfig({ key: "tag.gpgsign", value: "true", scope: "local" });
    await exec("git", ["tag", "-m", "Test signed tag", "v1.0.0"], {
      cwd: repoDir,
      silent: true,
    });

    // Verify the tag is signed
    let tagOutput = "";
    await exec("git", ["tag", "-v", "v1.0.0"], {
      cwd: repoDir,
      silent: true,
      listeners: {
        stderr: (data: Buffer) => {
          // git tag -v outputs to stderr
          tagOutput += data.toString();
        },
      },
    });

    expect(tagOutput).toContain('Good "git" signature for action@test.com');
  });

  it("should work with global config scope", async () => {
    // Move out of the repo
    process.chdir(testDir);

    const { setConfig, getConfig } = await import("../src/git.js");

    // Should be able to set global config outside a repo
    await setConfig({
      key: "test.action.global",
      value: "test-value",
      scope: "global",
    });

    // Verify it's set globally
    const value = await getConfig({
      key: "test.action.global",
      scope: "global",
    });
    expect(value).toBe("test-value");

    // Clean up
    const { unsetConfig } = await import("../src/git.js");
    await unsetConfig({ key: "test.action.global", scope: "global" });
  });

  it("should handle config with special characters", async () => {
    const { setConfig, getConfig } = await import("../src/git.js");

    const specialValue = `Test "quoted" and 'single' = special!`;
    await setConfig({
      key: "test.special",
      value: specialValue,
      scope: "local",
    });

    const retrieved = await getConfig({ key: "test.special", scope: "local" });
    expect(retrieved).toBe(specialValue);
  });
});
