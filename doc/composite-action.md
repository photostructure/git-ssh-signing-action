# Original Composite Action Reference

This document shows the original composite action from @photostructure/fs-metadata that inspired this TypeScript action.

**Note**: The current implementation is a full JavaScript action (not a composite action) with additional features including:

- Automatic post-action cleanup
- SSH agent integration
- Configurable Git signing options
- Output values (key path, public key, fingerprint)
- Better error handling and state management

The composite action below shows the core logic that was reimplemented:

```yml
name: "Setup SSH Bot"
description: "Configure SSH signing for automated commits in CI."
inputs:
  ssh-signing-key:
    description: "SSH private key for signing"
    required: true
  git-user-name:
    description: "Git user.name for commits"
    required: true
  git-user-email:
    description: "Git user.email for commits"
    required: true
runs:
  using: "composite"
  steps:
    - name: Install SSH signing key
      shell: bash
      env:
        SSH_SIGNING_KEY: ${{ inputs.ssh-signing-key }}
      run: |
        set -x
        # Create SSH directory with proper permissions
        mkdir -p ~/.ssh
        chmod 700 ~/.ssh

        # Install the private key
        echo "$SSH_SIGNING_KEY" > ~/.ssh/signing_key
        chmod 600 ~/.ssh/signing_key

        # Generate public key from private key
        ssh-keygen -y -f ~/.ssh/signing_key > ~/.ssh/signing_key.pub
        chmod 644 ~/.ssh/signing_key.pub

        # Store key path for cleanup
        echo "SSH_SIGNING_KEY_PATH=$HOME/.ssh/signing_key" >> $GITHUB_ENV

        echo "✓ SSH signing key installed"

    - name: Configure Git for SSH signing
      shell: bash
      env:
        GIT_USER_NAME: ${{ inputs.git-user-name }}
        GIT_USER_EMAIL: ${{ inputs.git-user-email }}
      run: |
        set -x
        # Verify key exists
        if [ ! -f ~/.ssh/signing_key ]; then
          echo "ERROR: SSH signing key not found"
          exit 1
        fi

        # Configure git user
        git config --global user.name "$GIT_USER_NAME"
        git config --global user.email "$GIT_USER_EMAIL"

        # Configure SSH signing
        git config --global gpg.format ssh
        git config --global user.signingkey ~/.ssh/signing_key.pub
        git config --global commit.gpgsign true
        git config --global tag.gpgsign true

        # Setup allowed signers for verification
        echo "$GIT_USER_EMAIL $(cat ~/.ssh/signing_key.pub)" > ~/.ssh/allowed_signers
        git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers

        # npm also respects git signing configuration
        npm config set sign-git-tag true

        echo "✓ Git configured for SSH signing"

        # Display configuration (without exposing private key)
        echo "=== Git signing configuration ==="
        git config --get user.name
        git config --get user.email
        git config --get gpg.format
        git config --get user.signingkey
        git config --get commit.gpgsign
        git config --get tag.gpgsign
```
