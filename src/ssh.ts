import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Context } from "./context.js";
import { isWindows, setSecurePermissions, unixOnly } from "./platform.js";

export interface SSHKeyInfo {
  fingerprint: string;
  type: string;
  bits: number;
  comment?: string;
}

/**
 * Parse SSH key information output from ssh-keygen
 */
export function parseSSHKeyInfoOutput(output: string): SSHKeyInfo {
  // Parse output: "2048 SHA256:... comment (RSA)"
  const match = output.match(/^(\d+)\s+(SHA256:[^\s]+)\s+(.*?)\s+\(([^)]+)\)$/);
  if (!match) {
    throw new Error("Failed to parse SSH key info");
  }
  return {
    bits: parseInt(match[1], 10),
    fingerprint: match[2],
    comment: match[3] || undefined,
    type: match[4],
  };
}

/**
 * Extract SSH key information
 */
export async function getSSHKeyInfo(keyPath: string): Promise<SSHKeyInfo> {
  let output = "";
  let errorOutput = "";

  const result = await exec.exec("ssh-keygen", ["-l", "-f", keyPath], {
    ignoreReturnCode: true,
    silent: true,
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
      stderr: (data: Buffer) => {
        errorOutput += data.toString();
      },
    },
  });

  if (result !== 0) {
    const platformContext = isWindows()
      ? ` (Windows: ensure Git for Windows is available and key file is accessible)`
      : "";
    const errorDetails = errorOutput.trim()
      ? ` Error: ${errorOutput.trim()}`
      : "";
    throw new Error(
      `Failed to get SSH key fingerprint${platformContext}.${errorDetails}`,
    );
  }

  return parseSSHKeyInfoOutput(output.trim());
}

/**
 * Generate public key from private key
 */
export async function generatePublicKey(
  privateKeyPath: string,
): Promise<string> {
  let publicKey = "";

  const result = await exec.exec("ssh-keygen", ["-y", "-f", privateKeyPath], {
    ignoreReturnCode: true,
    silent: true,
    listeners: {
      stdout: (data: Buffer) => {
        publicKey += data.toString();
      },
    },
  });

  if (result !== 0) {
    throw new Error("Failed to generate public key from private key");
  }

  return publicKey.trim();
}

/**
 * Install SSH signing key with proper permissions
 */
export async function installSSHKey(context: Context): Promise<string> {
  const { sshSigningKey, resolvedKeyPath, publicKeyPath } = context;
  const sshDir = path.dirname(resolvedKeyPath);

  // Create SSH directory with secure permissions
  core.debug(`Creating SSH directory: ${sshDir}`);
  await fs.mkdir(sshDir, { recursive: true, ...unixOnly({ mode: 0o700 }) });

  // Set Windows permissions if needed
  await setSecurePermissions(sshDir, true);

  // Write private key with strict permissions
  core.debug(`Installing SSH signing key at: ${resolvedKeyPath}`);
  // Trim whitespace and ensure proper formatting
  const trimmedKey = sshSigningKey.trim();
  // Ensure the key ends with a newline
  const formattedKey = trimmedKey.endsWith("\n")
    ? trimmedKey
    : `${trimmedKey}\n`;
  await fs.writeFile(resolvedKeyPath, formattedKey, {
    ...unixOnly({ mode: 0o600 }),
  });

  // Set Windows permissions if needed
  await setSecurePermissions(resolvedKeyPath, false);

  // Verify key is valid before proceeding
  try {
    // On Windows, wait a moment for file system to be ready
    if (isWindows()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    await getSSHKeyInfo(resolvedKeyPath);
  } catch (error) {
    // Clean up invalid key
    await fs.unlink(resolvedKeyPath).catch(() => {});
    const platformHint = isWindows()
      ? " (Windows file system or SSH tool compatibility issue)"
      : "";
    throw new Error(
      `Invalid SSH key: ${error instanceof Error ? error.message : String(error)}${platformHint}`,
    );
  }

  // Generate and write public key
  core.debug("Generating public key from private key");
  const publicKey = await generatePublicKey(resolvedKeyPath);
  await fs.writeFile(publicKeyPath, publicKey, {
    ...unixOnly({ mode: 0o644 }),
  });

  return publicKey;
}

/**
 * Create allowed signers file for SSH signature verification
 */
export async function createAllowedSignersFile(
  email: string,
  publicKey: string,
  keyPath: string,
): Promise<string> {
  const allowedSignersPath = path.join(
    path.dirname(keyPath),
    "allowed_signers",
  );

  const allowedSignersContent = `${email} ${publicKey}`;
  await fs.writeFile(allowedSignersPath, allowedSignersContent, {
    ...unixOnly({ mode: 0o644 }),
  });

  return allowedSignersPath;
}

/**
 * Add SSH key to agent if available
 */
export async function addKeyToAgent(keyPath: string): Promise<boolean> {
  try {
    // Check if SSH agent is running
    if (!process.env.SSH_AUTH_SOCK) {
      const platformNote = isWindows()
        ? " (Windows SSH agent compatibility varies)"
        : "";
      core.debug(`SSH agent not available${platformNote}`);
      return false;
    }

    const result = await exec.exec("ssh-add", [keyPath], {
      ignoreReturnCode: true,
      silent: true,
    });

    if (result === 0) {
      core.info("✓ SSH key added to agent");
      return true;
    } else {
      const platformHint = isWindows()
        ? " (Note: Windows has known SSH agent compatibility issues between OpenSSH and Git for Windows)"
        : "";
      core.debug(`Failed to add key to SSH agent${platformHint}`);
      return false;
    }
  } catch (error) {
    const platformContext = isWindows()
      ? " This is common on Windows due to SSH implementation incompatibilities."
      : "";
    core.debug(
      `SSH agent operation failed: ${error instanceof Error ? error.message : String(error)}.${platformContext}`,
    );
    return false;
  }
}

/**
 * Remove SSH key from agent
 */
export async function removeKeyFromAgent(keyPath: string): Promise<void> {
  try {
    if (!process.env.SSH_AUTH_SOCK) {
      return;
    }

    await exec.exec("ssh-add", ["-d", keyPath], {
      ignoreReturnCode: true,
      silent: true,
    });
  } catch (error) {
    const platformContext = isWindows()
      ? " (Windows SSH agent cleanup - this is not critical)"
      : "";
    core.debug(
      `Failed to remove key from SSH agent: ${error instanceof Error ? error.message : String(error)}${platformContext}`,
    );
  }
}
