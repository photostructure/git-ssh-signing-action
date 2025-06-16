import * as core from "@actions/core";
import * as os from "node:os";
import * as path from "node:path";

export interface Context {
  // Required inputs
  sshSigningKey: string;
  gitUserName: string;
  gitUserEmail: string;

  // Optional inputs with defaults
  sshKeyPath: string;
  gitCommitGpgSign: boolean;
  gitTagGpgSign: boolean;
  gitPushGpgSign: string; // "if-asked" | "true" | "false"
  createAllowedSigners: boolean;

  // Computed values
  resolvedKeyPath: string;
  publicKeyPath: string;
}

/**
 * Get and validate action inputs
 */
export function getContext(): Context {
  // Required inputs
  const sshSigningKey = core.getInput("ssh-signing-key", { required: true });
  const gitUserName = core.getInput("git-user-name", { required: true });
  const gitUserEmail = core.getInput("git-user-email", { required: true });

  // Optional inputs
  const sshKeyPath = core.getInput("ssh-key-path") || "~/.ssh/signing_key";
  const gitCommitGpgSign = core.getBooleanInput("git-commit-gpgsign") ?? true;
  const gitTagGpgSign = core.getBooleanInput("git-tag-gpgsign") ?? true;
  const gitPushGpgSign = core.getInput("git-push-gpgsign") || "if-asked";
  const createAllowedSigners =
    core.getBooleanInput("create-allowed-signers") ?? true;

  // Validate git-push-gpgsign value
  if (!["if-asked", "true", "false"].includes(gitPushGpgSign)) {
    throw new Error(
      `Invalid git-push-gpgsign value: ${gitPushGpgSign}. Must be "if-asked", "true", or "false"`,
    );
  }

  // Resolve SSH key path (expand ~)
  const resolvedKeyPath = resolvePath(sshKeyPath);
  const publicKeyPath = `${resolvedKeyPath}.pub`;

  // Validate inputs
  if (!sshSigningKey.trim()) {
    throw new Error("ssh-signing-key cannot be empty");
  }

  if (!gitUserName.trim()) {
    throw new Error("git-user-name cannot be empty");
  }

  if (!gitUserEmail.trim()) {
    throw new Error("git-user-email cannot be empty");
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(gitUserEmail)) {
    core.warning(`git-user-email appears to be invalid: ${gitUserEmail}`);
  }

  return {
    sshSigningKey,
    gitUserName,
    gitUserEmail,
    sshKeyPath,
    gitCommitGpgSign,
    gitTagGpgSign,
    gitPushGpgSign,
    createAllowedSigners,
    resolvedKeyPath,
    publicKeyPath,
  };
}

/**
 * Resolve path with ~ expansion
 */
function resolvePath(inputPath: string): string {
  if (inputPath.startsWith("~")) {
    return path.join(os.homedir(), inputPath.slice(1));
  }
  return path.resolve(inputPath);
}
