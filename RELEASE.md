# Release Process

This document describes the release process for git-ssh-signing-action.

## Prerequisites

Before creating a release, ensure the following repository secrets are configured:

- `SSH_SIGNING_KEY` - SSH private key for signing git tags
- `GIT_USER_NAME` - Name for git commits (e.g., "Your Name")
- `GIT_USER_EMAIL` - Email for git commits (e.g., "your-email@example.com")

## Release Steps

1. **Prepare the release**
   1. Update `CHANGELOG.md`. Based on the changes since the last release, decide if we need to increment the patch, minor, or major semantic version number.

   2. Ensure all tests pass and dist/ is up-to-date:

      ```sh
      npm run all
      ```

   3. Commit and push changes

2. **Create a GitHub Release**
   - Go to https://github.com/photostructure/git-ssh-signing-action/releases/new
   - Click "Choose a tag" → "Create new tag"
   - Enter the new version tag (e.g., `v1.2.3`)
   - Set the target to `main` branch
   - Fill in the release title (e.g., "v1.2.3")
   - Add release notes describing changes from `CHANGELOG.md`
   - Click "Publish release"

3. **Automated tag updates**

   When you publish the release, the `.github/workflows/release.yml` workflow automatically:
   - Creates/updates floating major version tag (e.g., `v1` for `v1.2.3`)
   - Creates/updates floating minor version tag (e.g., `v1.2` for `v1.2.3`)
   - Signs all tags using the configured SSH key **yay us**

## Version Strategy

This action follows semantic versioning and maintains floating tags:

- `v1.2.3` - Specific version (immutable)
- `v1.2` - Latest patch version in 1.2.x series (moves with patch releases)
- `v1` - Latest version in 1.x.x series (moves with minor/patch releases)

Users can reference the action using any of these tags:

```yaml
# Specific version (recommended for production)
- uses: photostructure/git-ssh-signing-action@v1.2.3

# Auto-update patch versions
- uses: photostructure/git-ssh-signing-action@v1.2

# Auto-update minor versions
- uses: photostructure/git-ssh-signing-action@v1
```

## Versioning Guidelines

- **Major version (0.x.x → 1.0.0)**: Breaking changes
- **Minor version (0.1.x → 1.1.0)**: New features, backwards compatible
- **Patch version (1.1.0 → 0.2.1)**: Bug fixes, backwards compatible

## Post-Release

After releasing:

1. Verify the release workflow completed successfully
2. Check that floating tags were updated: `git fetch --tags && git tag -l`
3. Test the new version in a workflow
