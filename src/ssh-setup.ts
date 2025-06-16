import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { Context, getContext } from "./context.js";
import * as git from "./git.js";
import * as ssh from "./ssh.js";
import * as state from "./state-helper.js";

export async function run(): Promise<void> {
  try {
    const context = getContext();

    core.startGroup("🔐 Setting up SSH signing");

    // Save current git configuration for restoration
    await saveOriginalConfiguration();

    // Install SSH key
    const publicKey = await ssh.installSSHKey(context);

    // Get key information for logging
    const keyInfo = await ssh.getSSHKeyInfo(context.resolvedKeyPath);
    core.info(
      `✓ SSH key installed (${keyInfo.type} ${keyInfo.bits}-bit, ${keyInfo.fingerprint})`,
    );

    // Save key path for cleanup
    state.saveState(state.StateKeys.sshKeyPath, context.resolvedKeyPath);

    // Add to SSH agent if available
    await ssh.addKeyToAgent(context.resolvedKeyPath);

    // Configure git
    await configureGit(context);

    // Create allowed signers file if requested
    if (context.createAllowedSigners) {
      const allowedSignersPath = await ssh.createAllowedSignersFile(
        context.gitUserEmail,
        publicKey,
        context.resolvedKeyPath,
      );
      await git.setConfig("gpg.ssh.allowedSignersFile", allowedSignersPath);
      core.info("✓ Allowed signers file created");
    }

    // Display final configuration
    await git.displayConfig([
      "user.name",
      "user.email",
      "gpg.format",
      "user.signingkey",
      "commit.gpgsign",
      "tag.gpgsign",
      "push.gpgsign",
      "gpg.ssh.allowedSignersFile",
    ]);

    // Set outputs for other workflow steps to use
    core.setOutput("ssh-key-path", context.resolvedKeyPath);
    core.setOutput("public-key", publicKey);
    core.setOutput("key-fingerprint", keyInfo.fingerprint);

    core.endGroup();
    core.info("✅ SSH signing configuration complete");
  } catch (error) {
    core.setFailed(
      `Setup failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function saveOriginalConfiguration(): Promise<void> {
  core.debug("Saving original git configuration");

  const config: state.OriginalGitConfig = {
    userName: await git.getConfig("user.name"),
    userEmail: await git.getConfig("user.email"),
    userSigningKey: await git.getConfig("user.signingkey"),
    gpgFormat: await git.getConfig("gpg.format"),
    commitGpgSign: await git.getConfig("commit.gpgsign"),
    tagGpgSign: await git.getConfig("tag.gpgsign"),
    pushGpgSign: await git.getConfig("push.gpgsign"),
    allowedSignersFile: await git.getConfig("gpg.ssh.allowedSignersFile"),
  };

  state.saveOriginalGitConfig(config);
}

async function configureGit(context: Context): Promise<void> {
  core.info("Configuring Git for SSH signing...");

  // Set user information
  await git.setConfig("user.name", context.gitUserName);
  await git.setConfig("user.email", context.gitUserEmail);

  // Configure SSH signing
  await git.setConfig("gpg.format", "ssh");
  await git.setConfig("user.signingkey", context.publicKeyPath);

  // Configure signing behavior
  if (context.gitCommitGpgSign) {
    await git.setConfig("commit.gpgsign", "true");
  }

  if (context.gitTagGpgSign) {
    await git.setConfig("tag.gpgsign", "true");
  }

  if (context.gitPushGpgSign !== "if-asked") {
    await git.setConfig("push.gpgsign", context.gitPushGpgSign);
  }

  // Configure npm if available
  try {
    await exec.exec("npm", ["--version"], {
      ignoreReturnCode: true,
      silent: true,
    });
    await exec.exec("npm", ["config", "set", "sign-git-tag", "true"], {
      ignoreReturnCode: true,
      silent: true,
    });
    core.debug("npm configured for git tag signing");
  } catch {
    core.debug("npm not available, skipping npm configuration");
  }

  core.info("✓ Git configured for SSH signing");
}
