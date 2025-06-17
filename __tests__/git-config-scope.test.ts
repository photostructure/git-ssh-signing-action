/**
 * Integration tests for git-config-scope functionality
 * Tests the git configuration behavior in isolation
 */
import { exec } from "@actions/exec";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import * as git from "../src/git.js";

describe("Git Config Scope", () => {
  let testDir: string;
  let repo1Dir: string;
  let repo2Dir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();

    // Create test directory with two repos
    testDir = await fs.mkdtemp(path.join(tmpdir(), "git-scope-test-"));
    repo1Dir = path.join(testDir, "repo1");
    repo2Dir = path.join(testDir, "repo2");

    await fs.mkdir(repo1Dir);
    await fs.mkdir(repo2Dir);

    // Initialize both repos
    await exec("git", ["init"], { cwd: repo1Dir, silent: true });
    await exec("git", ["init"], { cwd: repo2Dir, silent: true });
  });

  afterEach(async () => {
    // Restore directory
    process.chdir(originalCwd);

    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe("Local scope", () => {
    it("should only affect the current repository", async () => {
      // Set config in repo1 with local scope
      process.chdir(repo1Dir);
      await git.setConfig({
        key: "user.name",
        value: "Repo1 User",
        scope: "local",
      });
      await git.setConfig({
        key: "user.email",
        value: "repo1@test.com",
        scope: "local",
      });

      // Verify repo1 has the config
      const name1 = await git.getConfig({ key: "user.name", scope: "local" });
      const email1 = await git.getConfig({ key: "user.email", scope: "local" });
      expect(name1).toBe("Repo1 User");
      expect(email1).toBe("repo1@test.com");

      // Verify repo2 doesn't have the config locally (may have global)
      process.chdir(repo2Dir);
      const name2 = await git.getConfig({ key: "user.name", scope: "local" });
      const email2 = await git.getConfig({ key: "user.email", scope: "local" });

      // These should be undefined in local scope, or at least different from repo1
      // If they have values (from global config), they shouldn't match repo1's local values
      expect(name2 === undefined || name2 !== "Repo1 User").toBe(true);
      expect(email2 === undefined || email2 !== "repo1@test.com").toBe(true);
    });

    it("should allow different configs in different repos", async () => {
      // Set different configs in each repo
      process.chdir(repo1Dir);
      await git.setConfig({
        key: "commit.gpgsign",
        value: "true",
        scope: "local",
      });

      process.chdir(repo2Dir);
      await git.setConfig({
        key: "commit.gpgsign",
        value: "false",
        scope: "local",
      });

      // Verify each repo has its own config
      process.chdir(repo1Dir);
      const sign1 = await git.getConfig({
        key: "commit.gpgsign",
        scope: "local",
      });
      expect(sign1).toBe("true");

      process.chdir(repo2Dir);
      const sign2 = await git.getConfig({
        key: "commit.gpgsign",
        scope: "local",
      });
      expect(sign2).toBe("false");
    });

    it("should unset config only in current repo", async () => {
      // Set config in both repos
      process.chdir(repo1Dir);
      await git.setConfig({
        key: "tag.gpgsign",
        value: "true",
        scope: "local",
      });

      process.chdir(repo2Dir);
      await git.setConfig({
        key: "tag.gpgsign",
        value: "true",
        scope: "local",
      });

      // Unset in repo1
      process.chdir(repo1Dir);
      await git.unsetConfig({ key: "tag.gpgsign", scope: "local" });

      // Verify it's gone from repo1 but still in repo2
      const tag1 = await git.getConfig({ key: "tag.gpgsign", scope: "local" });
      expect(tag1).toBeUndefined();

      process.chdir(repo2Dir);
      const tag2 = await git.getConfig({ key: "tag.gpgsign", scope: "local" });
      expect(tag2).toBe("true");
    });
  });

  describe("Global scope", () => {
    // Store original global config to restore later
    const globalConfigBackup: Record<string, string | undefined> = {};
    const testKeys = ["test.scope.name", "test.scope.email", "test.scope.sign"];

    beforeEach(async () => {
      // Backup any existing global config for our test keys
      for (const key of testKeys) {
        globalConfigBackup[key] = await git.getConfig({ key, scope: "global" });
      }
    });

    afterEach(async () => {
      // Restore original global config
      for (const [key, value] of Object.entries(globalConfigBackup)) {
        if (value !== undefined) {
          await git.setConfig({ key, value, scope: "global" });
        } else {
          await git.unsetConfig({ key, scope: "global" });
        }
      }
    });

    it("should affect all repositories", async () => {
      // Set global config (can be done from anywhere)
      await git.setConfig({
        key: "test.scope.name",
        value: "Global User",
        scope: "global",
      });
      await git.setConfig({
        key: "test.scope.email",
        value: "global@test.com",
        scope: "global",
      });

      // Verify both repos see the global config
      process.chdir(repo1Dir);
      const name1 = await git.getConfig({
        key: "test.scope.name",
        scope: "global",
      });
      const email1 = await git.getConfig({
        key: "test.scope.email",
        scope: "global",
      });
      expect(name1).toBe("Global User");
      expect(email1).toBe("global@test.com");

      process.chdir(repo2Dir);
      const name2 = await git.getConfig({
        key: "test.scope.name",
        scope: "global",
      });
      const email2 = await git.getConfig({
        key: "test.scope.email",
        scope: "global",
      });
      expect(name2).toBe("Global User");
      expect(email2).toBe("global@test.com");
    });

    it("should work outside of any repository", async () => {
      // Change to non-repo directory
      process.chdir(testDir);

      // Should still be able to set/get global config
      await git.setConfig({
        key: "test.scope.sign",
        value: "true",
        scope: "global",
      });
      const sign = await git.getConfig({
        key: "test.scope.sign",
        scope: "global",
      });
      expect(sign).toBe("true");
    });

    it("should be overridden by local config", async () => {
      // Set global config
      await git.setConfig({
        key: "test.scope.name",
        value: "Global User",
        scope: "global",
      });

      // Override in repo1
      process.chdir(repo1Dir);
      await git.setConfig({
        key: "test.scope.name",
        value: "Local Override",
        scope: "local",
      });

      // Local should take precedence when querying without scope
      let output = "";
      await exec("git", ["config", "test.scope.name"], {
        cwd: repo1Dir,
        silent: true,
        listeners: {
          stdout: (data: Buffer) => {
            output += data.toString();
          },
        },
      });
      expect(output.trim()).toBe("Local Override");

      // But we can still query specifically
      const localValue = await git.getConfig({
        key: "test.scope.name",
        scope: "local",
      });
      const globalValue = await git.getConfig({
        key: "test.scope.name",
        scope: "global",
      });
      expect(localValue).toBe("Local Override");
      expect(globalValue).toBe("Global User");
    });
  });

  describe("Git config validation", () => {
    it("should handle special characters in config values", async () => {
      process.chdir(repo1Dir);

      const specialValue = "Test \"quoted\" and 'single' = special!";
      await git.setConfig({
        key: "test.special",
        value: specialValue,
        scope: "local",
      });

      const retrieved = await git.getConfig({
        key: "test.special",
        scope: "local",
      });
      expect(retrieved).toBe(specialValue);
    });

    it("should handle multi-line config values", async () => {
      process.chdir(repo1Dir);

      const multiLine = "Line 1\nLine 2\nLine 3";
      await git.setConfig({
        key: "test.multiline",
        value: multiLine,
        scope: "local",
      });

      const retrieved = await git.getConfig({
        key: "test.multiline",
        scope: "local",
      });
      expect(retrieved).toBe(multiLine);
    });

    it("should return undefined for non-existent keys", async () => {
      process.chdir(repo1Dir);

      const value = await git.getConfig({
        key: "does.not.exist",
        scope: "local",
      });
      expect(value).toBeUndefined();
    });

    it("should successfully unset non-existent keys", async () => {
      process.chdir(repo1Dir);

      // Should not throw
      const result = await git.unsetConfig({
        key: "does.not.exist",
        scope: "local",
      });
      expect(result).toBe(false); // git returns false when key doesn't exist
    });
  });
});
