import * as core from "@actions/core";
import * as exec from "@actions/exec";

export interface GitCommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * Execute a git command with proper error handling
 */
export async function execGit(args: string[]): Promise<GitCommandResult> {
  let stdout = "";
  let stderr = "";

  const exitCode = await exec.exec("git", args, {
    ignoreReturnCode: true,
    silent: true,
    listeners: {
      stdout: (data: Buffer) => {
        stdout += data.toString();
      },
      stderr: (data: Buffer) => {
        stderr += data.toString();
      },
    },
  });

  return { exitCode, stdout: stdout.trim(), stderr: stderr.trim() };
}

/**
 * Set a git configuration value
 */
export async function setConfig({
  key,
  value,
  scope = "local",
}: {
  key: string;
  value: string;
  scope?: "local" | "global";
}): Promise<void> {
  const args = ["config"];
  if (scope === "global") {
    args.push("--global");
  } else {
    args.push("--local");
  }
  args.push(key, value);

  const result = await execGit(args);
  if (result.exitCode !== 0) {
    throw new Error(`Failed to set git config ${key}: ${result.stderr}`);
  }
}

/**
 * Get a git configuration value
 */
export async function getConfig({
  key,
  scope = "local",
}: {
  key: string;
  scope?: "local" | "global";
}): Promise<string | undefined> {
  const args = ["config"];
  if (scope === "global") {
    args.push("--global");
  } else {
    args.push("--local");
  }
  args.push("--get", key);

  const result = await execGit(args);
  if (result.exitCode === 0) {
    return result.stdout;
  }
  return undefined;
}

/**
 * Unset a git configuration value
 */
export async function unsetConfig({
  key,
  scope = "local",
}: {
  key: string;
  scope?: "local" | "global";
}): Promise<boolean> {
  const args = ["config"];
  if (scope === "global") {
    args.push("--global");
  } else {
    args.push("--local");
  }
  args.push("--unset-all", key);

  const result = await execGit(args);
  return result.exitCode === 0;
}

/**
 * Check if a git configuration exists
 */
export async function configExists({
  key,
  scope = "local",
}: {
  key: string;
  scope?: "local" | "global";
}): Promise<boolean> {
  const value = await getConfig({ key, scope });
  return value !== undefined;
}

/**
 * Display current git configuration for debugging
 */
export async function displayConfig({
  keys,
  scope = "local",
}: {
  keys: string[];
  scope?: "local" | "global";
}): Promise<void> {
  core.startGroup("Git signing configuration");
  for (const key of keys) {
    const value = await getConfig({ key, scope });
    if (value !== undefined) {
      // Mask paths for security
      const displayValue =
        key.includes("key") && value.includes("/")
          ? value.replace(/\/[^/]+$/, "/***")
          : value;
      core.info(`${key} = ${displayValue}`);
    }
  }
  core.endGroup();
}
