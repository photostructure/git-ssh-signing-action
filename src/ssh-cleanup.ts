import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as git from "./git.js";
import * as ssh from "./ssh.js";
import * as state from "./state-helper.js";

export async function run(): Promise<void> {
  try {
    core.startGroup("🧹 Cleaning up SSH signing configuration");

    // Get saved state
    const keyPath = state.getState(state.StateKeys.sshKeyPath);

    if (keyPath) {
      // Remove from SSH agent
      await ssh.removeKeyFromAgent(keyPath);

      // Remove SSH keys
      await removeSSHFiles(keyPath);
    }

    // Restore original git configuration
    await restoreGitConfiguration();

    // Clear npm configuration
    await clearNpmConfiguration();

    core.endGroup();
    core.info("✅ SSH signing cleanup complete");
  } catch (error) {
    // Cleanup errors should not fail the workflow
    core.warning(
      `Cleanup encountered errors: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function removeSSHFiles(keyPath: string): Promise<void> {
  core.info("Removing SSH keys and related files...");

  // Files to remove
  const filesToRemove = [
    keyPath, // Private key
    `${keyPath}.pub`, // Public key
    path.join(path.dirname(keyPath), "allowed_signers"), // Allowed signers
  ];

  for (const file of filesToRemove) {
    await safeRemoveFile(file);
  }
}

async function safeRemoveFile(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    core.debug(`Removed file: ${filePath}`);
  } catch (error) {
    core.debug(
      `File removal skipped (${filePath}): ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function restoreGitConfiguration(): Promise<void> {
  core.info("Restoring git configuration...");

  const originalConfig = state.getOriginalGitConfig();
  const storedScope = state.getState(state.StateKeys.gitConfigScope);
  const configScope = storedScope as "local" | "global" | undefined;

  if (!configScope) {
    core.warning(
      "Git config scope not found in state, falling back to 'local'. This may indicate the action was not properly initialized.",
    );
  }

  const scope = configScope ?? "local";

  // Restore or unset each configuration
  const configRestoreMap: Array<[string, string | undefined]> = [
    ["user.name", originalConfig.userName],
    ["user.email", originalConfig.userEmail],
    ["user.signingkey", originalConfig.userSigningKey],
    ["gpg.format", originalConfig.gpgFormat],
    ["commit.gpgsign", originalConfig.commitGpgSign],
    ["tag.gpgsign", originalConfig.tagGpgSign],
    ["push.gpgsign", originalConfig.pushGpgSign],
    ["gpg.ssh.allowedSignersFile", originalConfig.allowedSignersFile],
  ];

  for (const [key, originalValue] of configRestoreMap) {
    if (originalValue !== undefined) {
      // Restore original value
      try {
        await git.setConfig({ key, value: originalValue, scope });
        core.debug(`Restored ${key} to original value`);
      } catch (error) {
        core.debug(
          `Failed to restore ${key}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } else {
      // Unset if it didn't exist before
      const unset = await git.unsetConfig({ key, scope });
      if (unset) {
        core.debug(`Unset ${key} (was not previously set)`);
      }
    }
  }
}

async function clearNpmConfiguration(): Promise<void> {
  try {
    await exec.exec("npm", ["config", "delete", "sign-git-tag"], {
      ignoreReturnCode: true,
      silent: true,
    });
    core.debug("Cleared npm signing configuration");
  } catch {
    core.debug("npm configuration cleanup skipped");
  }
}
