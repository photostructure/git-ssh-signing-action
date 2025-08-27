import * as core from "@actions/core";
import * as exec from "@actions/exec";

/**
 * Check if running on Windows platform
 */
export function isWindows(): boolean {
  return process.platform === "win32";
}

/**
 * Conditionally apply options only on Unix-like systems
 * On Windows, returns empty object to avoid unsupported fs options
 */
export function unixOnly<T>(options: T): T | Record<string, never> {
  return isWindows() ? {} : options;
}

/**
 * Set secure file permissions using platform-appropriate methods
 */
export async function setSecurePermissions(
  filePath: string,
  isDirectory = false,
): Promise<void> {
  if (isWindows()) {
    await setWindowsPermissions(filePath, isDirectory);
  } else {
    // Unix permissions are handled via fs.writeFile/mkdir mode parameter
    // This function is primarily for post-creation permission fixes on Windows
    core.debug(
      `Unix permissions handled via fs options for ${isDirectory ? "directory" : "file"}: ${filePath}`,
    );
  }
}

/**
 * Set Windows file permissions using icacls to restrict access to current user only
 * Equivalent to chmod 600 (files) or 700 (directories) on Unix
 */
async function setWindowsPermissions(
  filePath: string,
  isDirectory: boolean,
): Promise<void> {
  try {
    core.debug(
      `Setting Windows permissions for ${isDirectory ? "directory" : "file"}: ${filePath}`,
    );

    // Remove inheritance and all existing permissions
    const inheritanceResult = await exec.exec(
      "icacls",
      [filePath, "/inheritance:r"],
      {
        ignoreReturnCode: true,
        silent: true,
      },
    );

    if (inheritanceResult !== 0) {
      core.warning(`Failed to remove inheritance for ${filePath}`);
      return;
    }

    // Grant appropriate permissions to current user only
    // For directories: Full control (equivalent to 700)
    // For files: Read/Write (equivalent to 600)
    const permission = isDirectory ? "(F)" : "(R,W)";
    const currentUser = process.env.USERNAME ?? process.env.USER ?? "Unknown";
    const permissionResult = await exec.exec(
      "icacls",
      [filePath, "/grant:r", `${currentUser}:${permission}`],
      {
        ignoreReturnCode: true,
        silent: true,
      },
    );

    if (permissionResult !== 0) {
      core.warning(`Failed to set permissions for ${filePath}`);
      return;
    }

    core.debug(`✓ Windows permissions set for ${filePath} (${permission})`);
  } catch (error) {
    core.warning(
      `Windows permission setting failed for ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
