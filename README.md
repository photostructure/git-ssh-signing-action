# Git SSH Signing Action

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Git%20SSH%20Signing%20Action-blue?logo=github)](https://github.com/marketplace/actions/git-ssh-signing-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/photostructure/git-ssh-signing-action/actions/workflows/ci.yml/badge.svg)](https://github.com/photostructure/git-ssh-signing-action/actions/workflows/ci.yml)
[![Check dist/](https://github.com/photostructure/git-ssh-signing-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/photostructure/git-ssh-signing-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/photostructure/git-ssh-signing-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/photostructure/git-ssh-signing-action/actions/workflows/codeql-analysis.yml)

A GitHub Action for setting up SSH commit and tag signing in CI/CD workflows.
This action provides a simple, secure way to configure SSH-based Git signing for
automated commits and releases.

## ✨ Features

- **🔐 Secure SSH Key Management**: Safely installs and configures SSH signing keys
- **🎯 Complete Git Configuration**: Sets up user identity, signing format, and verification
- **🧹 Automatic Cleanup**: Removes keys and configuration after workflow completion
- **🛡️ Security Best Practices**: Proper file permissions and secure key handling
- **📦 Zero Dependencies**: No external tools required beyond standard Git and SSH
- **🔄 Automatic Cleanup**: Post-action credentials cleanup runs automatically

## 📋 Requirements

- **Platform**: Linux or macOS runners only (`ubuntu-latest`, `macos-latest`)
- **Git**: Version 2.34.0 or later (for SSH signing support)
- **OpenSSH**: Standard installation with `ssh-keygen` and `ssh-agent`

> **⚠️ Windows Not Supported**: This action requires POSIX file permissions and SSH agent functionality that are not available on Windows runners. Use `ubuntu-latest` or `macos-latest` for your workflows.

## 🚀 Quick Start

### Basic Usage

```yaml
name: Release with SSH Signing

on:
  push:
    tags: ["v*"]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      # Setup SSH signing
      - uses: photostructure/git-ssh-signing-action@v1
        with:
          ssh-signing-key: ${{ secrets.SSH_SIGNING_KEY }}
          git-user-name: ${{ secrets.GIT_USER_NAME }}
          git-user-email: ${{ secrets.GIT_USER_EMAIL }}

      # Your build and release steps here
      - run: npm ci
      - run: npm version patch
      - run: git push origin main --follow-tags

      # Cleanup runs automatically - no need for explicit cleanup step!
```

### Advanced Usage with Custom Key Path

```yaml
- uses: photostructure/git-ssh-signing-action@v1
  with:
    ssh-signing-key: ${{ secrets.SSH_SIGNING_KEY }}
    git-user-name: "Release Bot"
    git-user-email: "bot@example.com"
    ssh-key-path: "/tmp/my-signing-key"
# No cleanup step needed - it runs automatically!
```

## 📋 Inputs

| Input                    | Description                                            | Required | Default              |
| ------------------------ | ------------------------------------------------------ | -------- | -------------------- |
| `ssh-signing-key`        | SSH private key for signing commits and tags           | ✅ Yes   | -                    |
| `git-user-name`          | Git user.name for commits                              | ✅ Yes   | -                    |
| `git-user-email`         | Git user.email for commits                             | ✅ Yes   | -                    |
| `ssh-key-path`           | Custom path for SSH signing key                        | ❌ No    | `~/.ssh/signing_key` |
| `git-commit-gpgsign`     | Sign all commits                                       | ❌ No    | `true`               |
| `git-tag-gpgsign`        | Sign all tags                                          | ❌ No    | `true`               |
| `git-push-gpgsign`       | Sign pushes (`if-asked`, `true`, or `false`)           | ❌ No    | `if-asked`           |
| `create-allowed-signers` | Create allowed signers file for signature verification | ❌ No    | `true`               |

## 📤 Outputs

| Output            | Description                           |
| ----------------- | ------------------------------------- |
| `ssh-key-path`    | Path to the installed SSH signing key |
| `public-key`      | The SSH public key content            |
| `key-fingerprint` | The SSH key fingerprint (SHA256)      |

## 🔧 Setup Guide

### 1. Create Bot Account (Recommended)

For professional projects, create a dedicated bot account rather than using your personal account:

#### Create the Bot Account

1. Sign out of your personal GitHub account
2. Go to https://github.com/join
3. Create account with username like `yourproject-bot`
4. Use a real email address that can receive the invitation (e.g., `yourproject-bot@yourdomain.com`)
5. Verify the email address
6. **Enable 2FA** (required by many organizations and strongly recommended):
   - Go to Settings → Password and authentication
   - Set up two-factor authentication
   - Save backup codes securely

#### Add Bot as Repository Collaborator

1. Go to your repository settings
2. Click **Collaborators** in the left sidebar
3. Click **Add people**
4. Search for your bot account username
5. Select **Write** permission level (needed for pushes and releases)
6. Send invitation

#### Bot Accepts Invitation

1. Sign in as the bot account
2. Check notifications or email for repository invitation
3. Accept the invitation

### 2. Generate SSH Signing Key

Generate an Ed25519 SSH key specifically for commit signing:

```bash
# Generate the key pair
ssh-keygen -t ed25519 -f ~/.ssh/yourproject-bot-signing -N "" -C "yourproject-bot"

# Display the public key (you'll need this for GitHub)
cat ~/.ssh/yourproject-bot-signing.pub
```

### 3. Add SSH Key to GitHub Bot Account

**Important**: Add the key to the **bot account**, not your personal account.

1. Sign in as your bot account
2. Go to Settings → SSH and GPG keys
3. Click **New SSH key**
4. **Critical**: For "Key type", select **"Signing Key"** (not "Authentication Key")
5. Title: `Repository Release Signing Key`
6. Key: Paste the contents of `~/.ssh/yourproject-bot-signing.pub`
7. Click **Add SSH key**

### 4. Configure Repository Secrets

#### Copy the Private Key

```bash
# Copy private key to clipboard (macOS)
cat ~/.ssh/yourproject-bot-signing | pbcopy

# Copy private key to clipboard (Linux with xclip)
cat ~/.ssh/yourproject-bot-signing | xclip -selection clipboard

# Copy private key to clipboard (Windows with clip)
cat ~/.ssh/yourproject-bot-signing | clip
```

#### Add Repository Secrets

1. Go to your repository settings
2. Navigate to Settings → Secrets and variables → Actions
3. Add these secrets:

| Secret Name       | Value                         | Example                                  |
| ----------------- | ----------------------------- | ---------------------------------------- |
| `SSH_SIGNING_KEY` | Paste the private key content | `-----BEGIN OPENSSH PRIVATE KEY-----`... |
| `GIT_USER_NAME`   | Bot account username          | `yourproject-bot`                        |
| `GIT_USER_EMAIL`  | Bot email address             | `bot@yourdomain.com`                     |
| `NPM_TOKEN`       | Your npm authentication token | (if publishing to npm)                   |

### 5. Secure Your Local Keys

After setting up, securely remove local key copies:

```bash
# Remove the local key files
rm ~/.ssh/yourproject-bot-signing
rm ~/.ssh/yourproject-bot-signing.pub

# Or move to secure backup location
mv ~/.ssh/yourproject-bot-signing* ~/secure-backup/
```

### 6. Test Your Setup

Create a test workflow to verify everything works:

```yaml
name: Test SSH Signing

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: write # Required for pushing
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ github.token }}

      - uses: photostructure/git-ssh-signing-action@v1
        with:
          ssh-signing-key: ${{ secrets.SSH_SIGNING_KEY }}
          git-user-name: ${{ secrets.GIT_USER_NAME }}
          git-user-email: ${{ secrets.GIT_USER_EMAIL }}

      - name: Test signed commit and push
        run: |
          # Create a test file
          echo "SSH signing test - $(date)" > test-ssh-signing.txt
          git add test-ssh-signing.txt

          # Make a signed commit
          git commit -m "test: SSH signing verification"

          # Show the signature locally
          git log --show-signature -1

          # Push to verify on GitHub
          git push origin main
```

**Important**: After running this test:

1. Check the commit on GitHub - it should show a "Verified" badge
2. **Delete the test file** to clean up:
   ```bash
   git rm test-ssh-signing.txt
   git commit -m "chore: remove SSH signing test file"
   git push origin main
   ```
3. **Delete the test workflow** to prevent accidental re-runs:
   ```bash
   git rm .github/workflows/test-ssh-signing.yml
   git commit -m "chore: remove SSH signing test workflow"
   git push origin main
   ```

### 7. Pre-Release Checklist

Before triggering a release:

- [ ] **SSH_SIGNING_KEY** secret is configured in repository
- [ ] **GIT_USER_NAME** and **GIT_USER_EMAIL** secrets are set
- [ ] **NPM_TOKEN** is valid with publish permissions (if using npm)
- [ ] SSH public key is added to bot's GitHub account as **Signing Key**
- [ ] Bot account has **write access** to the repository
- [ ] Test workflow passes successfully
- [ ] You're on the main branch with latest changes

## 🔐 Security Best Practices

### SSH Key Management

- **Use Ed25519 keys** for better security and performance
- **Generate dedicated signing keys** - don't reuse authentication keys
- **Use bot accounts** for automation rather than personal accounts
- **Rotate keys periodically** (recommended every 2-3 years)
- **Never commit private keys** to repositories

### Repository Configuration

- **Store keys in GitHub Secrets** with appropriate access controls
- **Use environment protection rules** for production deployments
- **Enable branch protection** for main/release branches
- **Require signed commits** in branch protection rules

### Bot Account Setup

- **Create dedicated bot accounts** for automation
- **Use minimal permissions** (only what's needed for releases)
- **Use repository-specific keys** when possible
- **Monitor bot account activity** regularly

## 🆚 SSH vs GPG Signing

| Feature                 | SSH Signing            | GPG Signing        |
| ----------------------- | ---------------------- | ------------------ |
| **Setup Complexity**    | ✅ Simple              | ❌ Complex         |
| **Key Generation**      | ✅ One command         | ❌ Multiple steps  |
| **Passphrase Handling** | ✅ Not required        | ❌ Required in CI  |
| **Wrapper Scripts**     | ✅ Not needed          | ❌ Often required  |
| **GitHub Verification** | ✅ Full support        | ✅ Full support    |
| **Maintenance**         | ✅ Minimal             | ❌ Higher overhead |
| **Algorithm Support**   | ✅ Ed25519, RSA, ECDSA | ✅ RSA, ECC, EdDSA |

## 🛠️ Troubleshooting

### Commits Show as "Unverified"

- Ensure SSH key is added as **Signing Key** (not Authentication Key)
- Verify email in Git config matches GitHub account email
- Confirm bot account owns the SSH key
- Check that commit signing is enabled (`git config --get commit.gpgsign`)

### "Load key failed" Error

- Verify `SSH_SIGNING_KEY` secret contains complete private key
- Check for extra newlines or spaces in the secret
- Ensure private key format is correct (starts with
  `-----BEGIN OPENSSH PRIVATE KEY-----`)

### Permission Denied on Push

- Confirm bot account has write access to repository
- Verify repository permissions and branch protection rules
- Check if 2FA is properly configured for bot account

### Action Fails During Setup

- Enable debug logging: Set `ACTIONS_STEP_DEBUG` secret to `true`
- Check workflow logs for detailed error messages
- Verify all required inputs are provided
- Test SSH key locally before using in CI

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md)
for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/photostructure/git-ssh-signing-action.git
cd git-ssh-signing-action

# Install dependencies
npm install

# Run tests
npm test

# Build the action
npm run bundle

# Run all checks
npm run all
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🙏 Acknowledgments

- Built with the [GitHub Actions Toolkit](https://github.com/actions/toolkit)
- Based on the official
  [TypeScript Action Template](https://github.com/actions/typescript-action)

## 📚 Related Links

- [GitHub SSH Commit Verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#ssh-commit-signature-verification)
- [Git SSH Signing Documentation](https://git-scm.com/docs/git-config#Documentation/git-config.txt-gpgformat)
- [GitHub Actions Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
