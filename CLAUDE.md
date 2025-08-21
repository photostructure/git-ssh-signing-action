# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# SSH Signing Action - Project Context for Claude

## Project Overview

This is a GitHub Action that sets up SSH commit and tag signing for CI/CD workflows. It's a TypeScript-based JavaScript action (not a composite action) that wraps Git and SSH tools to provide secure, automated signing capabilities. The action is based on the composite action documented in `doc/composite-action.md` but has been rewritten as a proper JavaScript action with enhanced features.

## Common Development Commands

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Run a single test file
NODE_OPTIONS=--experimental-vm-modules NODE_NO_WARNINGS=1 npx jest __tests__/specific.test.ts

# Run tests in watch mode
NODE_OPTIONS=--experimental-vm-modules NODE_NO_WARNINGS=1 npx jest --watch

# Lint code
npm run lint

# Format code
npm run fmt

# Build/package the action
npm run package

# Run all checks (format, lint, test, coverage, package)
npm run all

# Test action locally
npm run local-action
```

## Architecture Overview

The action operates in two phases:

1. **Setup Phase** (main entry):
   - `src/main.ts` → `src/ssh-setup.ts`: Installs SSH keys and configures Git
   - `src/context.ts`: Validates inputs and manages configuration
   - `src/ssh.ts`: Handles SSH key operations (install, permissions, agent)
   - `src/git.ts`: Configures Git for SSH signing

2. **Cleanup Phase** (post action):
   - `src/main.ts` → `src/ssh-cleanup.ts`: Removes keys and restores original Git config
   - `src/state-helper.ts`: Manages state between setup and cleanup phases

Key architectural decisions:

- Uses GitHub Actions toolkit for core functionality
- Implements automatic cleanup via post-action hooks
- Stores original Git config in action state for restoration
- Supports multiple SSH key types (Ed25519, RSA, ECDSA)

## Testing Philosophy

This project is a thin wrapper around Git and SSH tools. As such:

- **Avoid unit tests that mock everything** - they provide little value and are brittle
- **Prefer integration tests** that actually call the real tools (git, ssh-keygen, etc.)
- **Test the actual behavior** not the implementation details
- **It's OK to have most coverage through integration tests** rather than unit tests
- When you need to test error cases that are hard to trigger with real tools, minimal mocking is acceptable
- Focus on testing the integration points and real-world usage patterns

## Key Implementation Details

- SSH signing uses the **public key path** for `user.signingkey`, not the private key
- The action is proven to work in production - trust the existing implementation
- File permissions (0600 for private keys) are critical for SSH operations
- Always trim whitespace from SSH keys before writing them to disk
- The action automatically generates the public key from the private key if not provided
- Supports creating an allowed signers file for verification
- Automatically configures npm for signed tags by setting `sign-git-tag`
- Includes SSH agent integration (adds key to agent if available)
- Automatic post-action cleanup removes keys and restores original Git config

## Build System

- Uses Rollup to bundle the TypeScript code into a single `dist/index.js`
- ESM modules throughout (note the `"type": "module"` in package.json)
- TypeScript with strict configuration
- Jest with experimental VM modules for ESM support
- The `dist/` directory must be committed for GitHub Actions to work

## Error Handling Patterns

- Always provide clear error messages that help users diagnose issues
- Check for required tools (git, ssh-keygen) before attempting operations
- Validate SSH key format and permissions
- Ensure cleanup runs even if setup fails
- Log operations at appropriate verbosity levels using `@actions/core`

## Additional Features Not in Documentation

The action includes several features beyond what's shown in the composite action example:

- **Configurable Git signing options**: `git-commit-gpgsign`, `git-tag-gpgsign`, `git-push-gpgsign`
- **SSH Agent integration**: Automatically adds/removes keys from SSH agent
- **Output values**: Provides `ssh-key-path`, `public-key`, and `key-fingerprint` outputs
- **State management**: Uses GitHub Actions state for cleanup coordination
- **Better error handling**: More robust validation and error messages
