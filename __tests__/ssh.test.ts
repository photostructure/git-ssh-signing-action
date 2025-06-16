/**
 * Unit tests for SSH utility functions
 */
import { jest } from "@jest/globals";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import * as core from "../__fixtures__/core.js";
import {
  INVALID_PRIVATE_KEY,
  TEST_ED25519_FINGERPRINT,
  TEST_ED25519_KEY_INFO_OUTPUT,
  TEST_ED25519_PRIVATE_KEY,
} from "../__fixtures__/ssh-keys.js";

// Mock @actions/core
jest.unstable_mockModule("@actions/core", () => ({
  ...core,
  debug: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
}));

// Import after mocking
const {
  parseSSHKeyInfoOutput,
  getSSHKeyInfo,
  generatePublicKey,
  installSSHKey,
} = await import("../src/ssh.js");

describe("ssh.ts", () => {
  describe("parseSSHKeyInfoOutput", () => {
    it("should parse valid ED25519 key info", () => {
      const result = parseSSHKeyInfoOutput(TEST_ED25519_KEY_INFO_OUTPUT);
      expect(result).toEqual({
        bits: 256,
        fingerprint: TEST_ED25519_FINGERPRINT,
        comment: "test@example.com",
        type: "ED25519",
      });
    });

    it("should parse key info with no comment", () => {
      const output = "256 SHA256:abcd1234 no comment (ED25519)";
      const result = parseSSHKeyInfoOutput(output);
      expect(result).toEqual({
        bits: 256,
        fingerprint: "SHA256:abcd1234",
        comment: "no comment",
        type: "ED25519",
      });
    });

    it("should parse RSA key info", () => {
      const output = "2048 SHA256:xyz789 user@host (RSA)";
      const result = parseSSHKeyInfoOutput(output);
      expect(result).toEqual({
        bits: 2048,
        fingerprint: "SHA256:xyz789",
        comment: "user@host",
        type: "RSA",
      });
    });

    it("should throw on invalid output", () => {
      expect(() => parseSSHKeyInfoOutput("invalid output")).toThrow(
        "Failed to parse SSH key info",
      );
    });
  });

  describe("getSSHKeyInfo", () => {
    let tempDir: string;
    let keyPath: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(tmpdir(), "ssh-test-"));
      keyPath = path.join(tempDir, "test_key");
    });

    afterEach(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore error
      }
    });

    it("should get SSH key info for valid key", async () => {
      // Write key with proper permissions, ensuring proper formatting
      const formattedKey = TEST_ED25519_PRIVATE_KEY.trim() + "\n";
      await fs.writeFile(keyPath, formattedKey, { mode: 0o600 });

      // Debug: check if key was written correctly
      const stats = await fs.stat(keyPath);
      expect(stats.mode & 0o777).toBe(0o600);
      expect(stats.size).toBeGreaterThan(0);

      // Verify key content
      const content = await fs.readFile(keyPath, "utf8");
      expect(content).toMatch(/^-----BEGIN OPENSSH PRIVATE KEY-----/);
      expect(content).toMatch(/-----END OPENSSH PRIVATE KEY-----\n$/);

      const info = await getSSHKeyInfo(keyPath);
      expect(info.fingerprint).toBe(TEST_ED25519_FINGERPRINT);
      expect(info.type).toBe("ED25519");
      expect(info.bits).toBe(256);
    });

    it("should throw for non-existent key", async () => {
      await expect(getSSHKeyInfo(keyPath)).rejects.toThrow(
        "Failed to get SSH key fingerprint",
      );
    });

    it("should throw for invalid key file", async () => {
      await fs.writeFile(keyPath, "not a key", { mode: 0o600 });
      await expect(getSSHKeyInfo(keyPath)).rejects.toThrow(
        "Failed to get SSH key fingerprint",
      );
    });
  });

  describe("generatePublicKey", () => {
    let tempDir: string;
    let keyPath: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(tmpdir(), "ssh-test-"));
      keyPath = path.join(tempDir, "test_key");
    });

    afterEach(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore error
      }
    });

    it("should generate public key from private key", async () => {
      // Write key with proper permissions, ensuring proper formatting
      const formattedKey = TEST_ED25519_PRIVATE_KEY.trim() + "\n";
      await fs.writeFile(keyPath, formattedKey, { mode: 0o600 });

      const publicKey = await generatePublicKey(keyPath);
      expect(publicKey).toContain("ssh-ed25519");
      expect(publicKey).toContain(
        "AAAAC3NzaC1lZDI1NTE5AAAAIIz+hYAHzzpULN8JOs78FkgCQEfnZ3xu+gFNf72Ezsq9",
      );
    });

    it("should throw for invalid private key", async () => {
      await fs.writeFile(keyPath, "invalid key", { mode: 0o600 });
      await expect(generatePublicKey(keyPath)).rejects.toThrow(
        "Failed to generate public key from private key",
      );
    });
  });

  describe("installSSHKey", () => {
    let tempDir: string;
    let keyPath: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(tmpdir(), "ssh-test-"));
      keyPath = path.join(tempDir, "keys", "test_key");
    });

    afterEach(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore error
      }
    });

    it("should install SSH key with proper permissions", async () => {
      const context = {
        sshSigningKey: TEST_ED25519_PRIVATE_KEY,
        resolvedKeyPath: keyPath,
        publicKeyPath: `${keyPath}.pub`,
        gitUserName: "Test User",
        gitUserEmail: "test@example.com",
        sshKeyPath: keyPath,
        gitCommitGpgSign: true,
        gitTagGpgSign: true,
        gitPushGpgSign: "if-asked",
        createAllowedSigners: false,
      };

      const publicKey = await installSSHKey(context);

      // Check private key
      const stats = await fs.stat(keyPath);
      expect(stats.mode & 0o777).toBe(0o600);

      // Check public key
      const pubStats = await fs.stat(`${keyPath}.pub`);
      expect(pubStats.mode & 0o777).toBe(0o644);

      // Check public key content
      expect(publicKey).toContain("ssh-ed25519");
    });

    it("should clean up invalid key on failure", async () => {
      const context = {
        sshSigningKey: INVALID_PRIVATE_KEY,
        resolvedKeyPath: keyPath,
        publicKeyPath: `${keyPath}.pub`,
        gitUserName: "Test User",
        gitUserEmail: "test@example.com",
        sshKeyPath: keyPath,
        gitCommitGpgSign: true,
        gitTagGpgSign: true,
        gitPushGpgSign: "if-asked",
        createAllowedSigners: false,
      };

      await expect(installSSHKey(context)).rejects.toThrow("Invalid SSH key");

      // Key should be cleaned up
      await expect(fs.access(keyPath)).rejects.toThrow();
    });
  });
});
