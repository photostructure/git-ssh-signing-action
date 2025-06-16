import * as core from "@actions/core";
import { strEnum, StrEnumKeys } from "./str-enum.js";

export const StateKeys = strEnum(
  "sshKeyPath",
  "gitUserName",
  "gitUserEmail",
  "gitSigningKey",
  "gitGpgFormat",
  "gitCommitGpgSign",
  "gitTagGpgSign",
  "gitPushGpgSign",
  "gitAllowedSignersFile",
);
export type StateKey = StrEnumKeys<typeof StateKeys>;

/**
 * Save state for use in cleanup phase
 */
export function saveState(key: StateKey, value: string): void {
  core.saveState(key, value);
}

/**
 * Get state saved during setup phase
 */
export function getState(key: StateKey): string {
  return core.getState(key);
}

/**
 * Check if state exists
 */
export function hasState(key: StateKey): boolean {
  return getState(key) !== "";
}

/**
 * Save original git configuration for restoration
 */
export interface OriginalGitConfig {
  userSigningKey?: string;
  gpgFormat?: string;
  commitGpgSign?: string;
  tagGpgSign?: string;
  pushGpgSign?: string;
  allowedSignersFile?: string;
  userName?: string;
  userEmail?: string;
}

/**
 * Save original git configuration to state
 */
export function saveOriginalGitConfig(config: OriginalGitConfig): void {
  if (config.userSigningKey !== undefined) {
    saveState(StateKeys.gitSigningKey, config.userSigningKey);
  }
  if (config.gpgFormat !== undefined) {
    saveState(StateKeys.gitGpgFormat, config.gpgFormat);
  }
  if (config.commitGpgSign !== undefined) {
    saveState(StateKeys.gitCommitGpgSign, config.commitGpgSign);
  }
  if (config.tagGpgSign !== undefined) {
    saveState(StateKeys.gitTagGpgSign, config.tagGpgSign);
  }
  if (config.pushGpgSign !== undefined) {
    saveState(StateKeys.gitPushGpgSign, config.pushGpgSign);
  }
  if (config.allowedSignersFile !== undefined) {
    saveState(StateKeys.gitAllowedSignersFile, config.allowedSignersFile);
  }
  if (config.userName !== undefined) {
    saveState(StateKeys.gitUserName, config.userName);
  }
  if (config.userEmail !== undefined) {
    saveState(StateKeys.gitUserEmail, config.userEmail);
  }
}

/**
 * Get original git configuration from state
 */
export function getOriginalGitConfig(): OriginalGitConfig {
  const config: OriginalGitConfig = {};

  if (hasState(StateKeys.gitSigningKey)) {
    config.userSigningKey = getState(StateKeys.gitSigningKey);
  }
  if (hasState(StateKeys.gitGpgFormat)) {
    config.gpgFormat = getState(StateKeys.gitGpgFormat);
  }
  if (hasState(StateKeys.gitCommitGpgSign)) {
    config.commitGpgSign = getState(StateKeys.gitCommitGpgSign);
  }
  if (hasState(StateKeys.gitTagGpgSign)) {
    config.tagGpgSign = getState(StateKeys.gitTagGpgSign);
  }
  if (hasState(StateKeys.gitPushGpgSign)) {
    config.pushGpgSign = getState(StateKeys.gitPushGpgSign);
  }
  if (hasState(StateKeys.gitAllowedSignersFile)) {
    config.allowedSignersFile = getState(StateKeys.gitAllowedSignersFile);
  }
  if (hasState(StateKeys.gitUserName)) {
    config.userName = getState(StateKeys.gitUserName);
  }
  if (hasState(StateKeys.gitUserEmail)) {
    config.userEmail = getState(StateKeys.gitUserEmail);
  }

  return config;
}
