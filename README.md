# Git SSH Signing Action

<img src="doc/unverified-to-verified.svg" alt="Verified" height="40">

**Easy verified commits in GitHub Actions with no GPG hassles**

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-install-blue?logo=github&style=for-the-badge)](https://github.com/marketplace/actions/git-ssh-signing-action)
[![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github&style=for-the-badge)](https://github.com/photostructure/git-ssh-signing-action)

## Why?

Unsigned commits look suspicious. GitHub shows "Verified" badges on signed commits, proving they're authentic. Signing commits with GPG within CI is tricky. Signing commits with SSH is much simpler.

This action makes it trivial.

## Usage

Add this to your workflow (e.g., `.github/workflows/release.yml`):

```yaml
steps:
  - uses: actions/checkout@v4 # Must come first!

  - uses: photostructure/git-ssh-signing-action@v1
    with:
      ssh-signing-key: ${{ secrets.SSH_SIGNING_KEY }}
      git-user-name: ${{ secrets.GIT_USER_NAME }}
      git-user-email: ${{ secrets.GIT_USER_EMAIL }}
```

**Important**: This action must be placed **after** `actions/checkout` because it configures git locally by default.

### Configuration Options

| Input                | Required | Default              | Description                            |
| -------------------- | -------- | -------------------- | -------------------------------------- |
| `ssh-signing-key`    | ✅       | -                    | SSH private key for signing            |
| `git-user-name`      | ✅       | -                    | Git user name                          |
| `git-user-email`     | ✅       | -                    | Git user email                         |
| `ssh-key-path`       |          | `~/.ssh/signing_key` | Where to store the key                 |
| `git-commit-gpgsign` |          | `true`               | Sign all commits                       |
| `git-tag-gpgsign`    |          | `true`               | Sign all tags                          |
| `git-push-gpgsign`   |          | `if-asked`           | Sign pushes                            |
| `git-config-scope`   |          | `local`              | Use `global` to configure git globally |

### Using Global Configuration

If you need the action to work before checkout or across multiple repositories:

```yaml
steps:
  - uses: photostructure/git-ssh-signing-action@v1
    with:
      ssh-signing-key: ${{ secrets.SSH_SIGNING_KEY }}
      git-user-name: ${{ secrets.GIT_USER_NAME }}
      git-user-email: ${{ secrets.GIT_USER_EMAIL }}
      git-config-scope: global # Works anywhere in workflow
```

## Setup (5 Minutes)

### 1. Generate SSH Key

```bash
# Generate Ed25519 key (recommended)
# -N "" creates a passwordless key (required for CI)
# -C must match the GitHub username that will own this key
ssh-keygen -t ed25519 -f ~/.ssh/signing-key -N "" -C "yourproject-bot"

# Copy public key for next step
cat ~/.ssh/signing-key.pub
```

### 2. Add to GitHub

1. Sign in as your machine user account (if using one)
2. Go to **Settings → SSH and GPG keys**
3. Click **New SSH key**
4. **Critical**: For "Key type", select **"Signing Key"** (⚠️ NOT "Authentication Key")
5. Title: `Repository Release Signing Key`
6. Key: Paste the contents from `cat ~/.ssh/signing-key.pub`
7. Click **Add SSH key**

### 3. Create Repository Secrets

```bash
# Copy private key to clipboard (macOS)
cat ~/.ssh/signing-key | pbcopy

# Copy private key to clipboard (Linux)
cat ~/.ssh/signing-key | xclip -selection clipboard
```

Repository → Settings → Secrets → Actions:

- `SSH_SIGNING_KEY` = private key (paste from clipboard)
- `GIT_USER_NAME` = machine user's GitHub username (e.g., `yourproject-bot`)
- `GIT_USER_EMAIL` = machine user's email

### 4. Clean Up Local Keys

```bash
rm ~/.ssh/signing-key ~/.ssh/signing-key.pub
```

Done! Your commits will now be verified.

## Platform Support

This action supports GitHub Actions runners on all major platforms:

| Platform    | Status             | Notes                                  |
| ----------- | ------------------ | -------------------------------------- |
| **Ubuntu**  | ✅ Fully Supported | Primary development platform           |
| **Windows** | ✅ Fully Supported | Uses Windows ACLs for file permissions |
| **macOS**   | ✅ Fully Supported | Standard Unix permissions              |

### Windows-Specific Considerations

On Windows runners, the action automatically handles platform differences:

- **File Permissions**: Uses Windows ACLs (`icacls`) instead of Unix permissions for SSH key security
- **SSH Agent**: Handles Git for Windows SSH implementation gracefully with enhanced error messages
- **Path Handling**: Uses platform-appropriate path resolution

No additional configuration is needed for Windows compatibility.

## Pro Tips

**Use a [machine user](https://docs.github.com/en/get-started/learning-about-github/types-of-github-accounts#personal-accounts) account** (commonly called a "bot account") for production.

> **Why not use your personal account?**
>
> - **Security**: If CI credentials leak, only the machine user is compromised, not your personal account
> - **Persistence**: When team members leave, automation continues working
> - **Audit trail**: Clear distinction between human and automated commits
> - **Access control**: Machine user permissions can be limited to specific repositories

Steps to set up a machine user:

1. **Create Machine User Account**
   - Sign up at github.com/join as `yourproject-bot`
   - Use a real email (needed for collaborator invite)
   - Enable 2FA (required by many orgs)

2. **Add Machine User as Collaborator**
   - Repository Settings → Collaborators → Add people
   - Grant write access (needed for pushes)
   - Machine user must accept invite via email

3. **Generate Machine User's Key**

   ```bash
   # IMPORTANT: -C must match your machine user's GitHub username exactly
   ssh-keygen -t ed25519 -f ~/.ssh/machine-user-signing -N "" -C "yourproject-bot"

   # Display the public key (you'll need this for GitHub)
   cat ~/.ssh/machine-user-signing.pub
   ```

   Use this key in your secrets instead.

## Troubleshooting

| Problem                   | Solution                                                |
| ------------------------- | ------------------------------------------------------- |
| Commits show "Unverified" | Add key as "Signing Key" not "Authentication Key"       |
| Permission denied         | Give bot write access to repository                     |
| Key load failed           | Check secret has complete private key                   |
| Windows permission errors | Action handles ACLs automatically - check debug logs    |
| SSH agent warnings        | Normal on Windows due to SSH implementation differences |

## Requirements

- **Runners**: `ubuntu-latest`, `windows-2025`, or `macos-latest`
- **Git**: 2.34+ (for SSH signing)

## License

MIT © [PhotoStructure](https://photostructure.com/)

---

[Issues](https://github.com/photostructure/git-ssh-signing-action/issues) • [Contributing](CONTRIBUTING.md)
