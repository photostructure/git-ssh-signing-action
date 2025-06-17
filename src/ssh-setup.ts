import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { Context, getContext } from "./context.js";
import * as git from "./git.js";
import * as ssh from "./ssh.js";
import * as state from "./state-helper.js";

export async function run(): Promise<void> {
  try {
    const context = getContext();

    // Check if we're in a git repository when using local config
    if (context.gitConfigScope === "local") {
      const gitCheck = await git.execGit(["rev-parse", "--git-dir"]);
      if (gitCheck.exitCode !== 0) {
        throw new Error(
          "Not in a git repository. When using local git config (default), this action must be placed after actions/checkout. Use git-config-scope: global if you need to run this action before checkout.",
        );
      }
    }

    core.startGroup("🔐 Setting up SSH signing");

    // Save current git configuration for restoration
    await saveOriginalConfiguration(context);

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
      await git.setConfig({
        key: "gpg.ssh.allowedSignersFile",
        value: allowedSignersPath,
        scope: context.gitConfigScope,
      });
      core.info("✓ Allowed signers file created");
    }

    // Display final configuration
    await git.displayConfig({
      keys: [
        "user.name",
        "user.email",
        "gpg.format",
        "user.signingkey",
        "commit.gpgsign",
        "tag.gpgsign",
        "push.gpgsign",
        "gpg.ssh.allowedSignersFile",
      ],
      scope: context.gitConfigScope,
    });

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

async function saveOriginalConfiguration(context: Context): Promise<void> {
  core.debug("Saving original git configuration");

  const config: state.OriginalGitConfig = {
    userName: await git.getConfig({
      key: "user.name",
      scope: context.gitConfigScope,
    }),
    userEmail: await git.getConfig({
      key: "user.email",
      scope: context.gitConfigScope,
    }),
    userSigningKey: await git.getConfig({
      key: "user.signingkey",
      scope: context.gitConfigScope,
    }),
    gpgFormat: await git.getConfig({
      key: "gpg.format",
      scope: context.gitConfigScope,
    }),
    commitGpgSign: await git.getConfig({
      key: "commit.gpgsign",
      scope: context.gitConfigScope,
    }),
    tagGpgSign: await git.getConfig({
      key: "tag.gpgsign",
      scope: context.gitConfigScope,
    }),
    pushGpgSign: await git.getConfig({
      key: "push.gpgsign",
      scope: context.gitConfigScope,
    }),
    allowedSignersFile: await git.getConfig({
      key: "gpg.ssh.allowedSignersFile",
      scope: context.gitConfigScope,
    }),
  };

  state.saveOriginalGitConfig(config);
  state.saveState(state.StateKeys.gitConfigScope, context.gitConfigScope);
}

async function configureGit(context: Context): Promise<void> {
  core.info("Configuring Git for SSH signing...");

  // Set user information
  await git.setConfig({
    key: "user.name",
    value: context.gitUserName,
    scope: context.gitConfigScope,
  });
  await git.setConfig({
    key: "user.email",
    value: context.gitUserEmail,
    scope: context.gitConfigScope,
  });

  // Configure SSH signing
  await git.setConfig({
    key: "gpg.format",
    value: "ssh",
    scope: context.gitConfigScope,
  });
  await git.setConfig({
    key: "user.signingkey",
    value: context.publicKeyPath,
    scope: context.gitConfigScope,
  });

  // Configure signing behavior
  if (context.gitCommitGpgSign) {
    await git.setConfig({
      key: "commit.gpgsign",
      value: "true",
      scope: context.gitConfigScope,
    });
  }

  if (context.gitTagGpgSign) {
    await git.setConfig({
      key: "tag.gpgsign",
      value: "true",
      scope: context.gitConfigScope,
    });
  }

  if (context.gitPushGpgSign !== "if-asked") {
    await git.setConfig({
      key: "push.gpgsign",
      value: context.gitPushGpgSign,
      scope: context.gitConfigScope,
    });
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
