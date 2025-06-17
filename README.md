# Git SSH Signing Action

<img src="doc/unverified-to-verified.svg" alt="Verified" height="40">

**Get verified commits in GitHub Actions. No GPG hassle. Just works.** ✅

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Install-blue?logo=github&style=for-the-badge)](https://github.com/marketplace/actions/git-ssh-signing-action)

## Why?

Unsigned commits look suspicious. GitHub shows "Verified" badges on signed commits, proving they're authentic. GPG signing in CI is complex. SSH signing is simple. This action makes it trivial.

## Usage

```yaml
- uses: photostructure/git-ssh-signing-action@v1
  with:
    ssh-signing-key: ${{ secrets.SSH_SIGNING_KEY }}
    git-user-name: ${{ secrets.GIT_USER_NAME }}
    git-user-email: ${{ secrets.GIT_USER_EMAIL }}
```

That's it. Your commits are now signed and verified.

## Complete Example

```yaml
name: Release
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

      - uses: photostructure/git-ssh-signing-action@v1
        with:
          ssh-signing-key: ${{ secrets.SSH_SIGNING_KEY }}
          git-user-name: "Release Bot"
          git-user-email: "bot@example.com"

      - run: npm version patch
      - run: git push --follow-tags
```

## Setup (5 Minutes)

### 1. Generate SSH Key

```bash
# Generate Ed25519 key (recommended)
ssh-keygen -t ed25519 -f ~/.ssh/signing-key -N "" -C "yourproject-bot"

# Copy public key for next step
cat ~/.ssh/signing-key.pub
```

### 2. Add to GitHub

1. Go to **Settings → SSH and GPG keys**
2. Click **New SSH key**
3. Select **"Signing Key"** (⚠️ NOT "Authentication Key")
4. Paste the public key

### 3. Create Repository Secrets

```bash
# Copy private key to clipboard (macOS)
cat ~/.ssh/signing-key | pbcopy

# Copy private key to clipboard (Linux)
cat ~/.ssh/signing-key | xclip -selection clipboard
```

Repository → Settings → Secrets → Actions:

- `SSH_SIGNING_KEY` = private key (paste from clipboard)
- `GIT_USER_NAME` = bot username
- `GIT_USER_EMAIL` = bot email (must match key)

### 4. Clean Up Local Keys

```bash
rm ~/.ssh/signing-key ~/.ssh/signing-key.pub
```

Done! Your commits will now be verified.

## Pro Tips

**Use a bot account** for production:

1. **Create Bot Account**

   - Sign up at github.com/join as `yourproject-bot`
   - Use a real email (needed for collaborator invite)
   - Enable 2FA (required by many orgs)

2. **Add the bot as a Collaborator**

   - Repository Settings → Collaborators → Add people
   - Grant write access (needed for pushes)
   - Bot must accept invite via email

3. **Generate Bot's Key**

   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/bot-signing -N "" -C "yourproject-bot"
   ```

   Use this key in your secrets instead

**Why?** Isolation, audit trail, least privilege.

## Troubleshooting

| Problem                   | Solution                                          |
| ------------------------- | ------------------------------------------------- |
| Commits show "Unverified" | Add key as "Signing Key" not "Authentication Key" |
| Permission denied         | Give bot write access to repository               |
| Key load failed           | Check secret has complete private key             |

## Requirements

- **Runners**: `ubuntu-latest` or `macos-latest` (Windows runners not supported)
- **Git**: 2.34+ (for SSH signing)
- **Note**: Your dev machine can be Windows, but the workflow must run on Linux/macOS

## License

MIT © [PhotoStructure](https://photostructure.com/)

---

[Documentation](doc/SETUP.md) • [Issues](https://github.com/photostructure/git-ssh-signing-action/issues) • [Contributing](CONTRIBUTING.md)
