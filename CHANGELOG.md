# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## [2.0.1] - 2026-07-13

### Fixed

- 🐛 When an SSH key fails validation, the underlying `ssh-keygen` error is now attached as the error `cause` instead of being discarded. Previously a bare `Invalid SSH key` hid the actual reason the key was rejected, which made CI failures difficult to diagnose.

### Changed

- 📦 Updated GitHub Actions: `checkout`, `setup-node`, and CodeQL
- 📦 Updated devDependencies, notably eslint 10 and TypeScript 6. eslint 10 has no compatible `eslint-plugin-import` release, so that plugin was dropped — it was registered but contributed no active rules.
- 📦 Removed the Dependabot configuration in favor of `npm run update`
- 🔧 `rollup.config.ts` is now actually transpiled during `npm run package`. The config plugin had been pointed at a `tsconfig.json` that excluded it, so Rollup was parsing raw TypeScript — which happened to work only because the config contained no TypeScript-specific syntax.
- 🔧 `npm run all` now gates on `tsc` typechecking. Nothing had been running the compiler: `ts-jest` is transpile-only under `isolatedModules`, so type errors in the test suite went undetected.

[2.0.1]: https://github.com/photostructure/git-ssh-signing-action/compare/v2.0.0...v2.0.1

## [2.0.0] - 2026-03-22

### Breaking

- ⚠️ Minimum Node.js version is now 24 (previously 20). GitHub Actions runners will [enforce Node.js 24 starting June 2nd, 2026](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/).

[2.0.0]: https://github.com/photostructure/git-ssh-signing-action/compare/v1.2.0...v2.0.0

## [1.2.0] - 2025-12-10

- ✨ Windows support with proper SSH key permission handling via `icacls`
- 📦 Clarified `README.md`: you don't need `--gpg-sign` (for `git commit`) or `--sign` (for `git tag`) arguments, as we set both `commit.gpgSign` and `tag.gpgSign` git config flags to true
- 📦 Updated devDependencies

[1.2.0]: https://github.com/photostructure/git-ssh-signing-action/compare/v1.1.0...v1.2.0

## [1.1.0] - 2025-08-21

### Changed

- 📦 Updated GitHub Actions workflow versions
- 📦 Updated package.json: updated dev dependencies, added automated GHA updates, and fixed metadata fields

[1.1.0]: https://github.com/photostructure/git-ssh-signing-action/compare/v1.0.0...v1.1.0

## [1.0.0] - 2025-06-18

Promote v0.3.0 to v1.0.0.

[1.0.0]: https://github.com/photostructure/git-ssh-signing-action/compare/v0.3.0...v1.0.0

## [0.3.0] - 2025-01-18

### Added

- GitHub Actions workflow for automated tag updates on release to support `v0` or `v0.1` "floating" versions (#d36120a) -- and use ourself to sign the tags
- Release documentation with detailed release process instructions

### Changed

- Updated markdown-lint configuration

[0.3.0]: https://github.com/photostructure/git-ssh-signing-action/compare/v0.2.0...v0.3.0

## [0.2.0] - 2025-01-17

### Added

- Configurable Git config scope with local as default (#f88be7e)

### Changed

- Improved documentation and clarified machine user setup (#93912a1, #9369bd0)
- Streamlined README for clarity and conciseness (#9369bd0)
- Enhanced test suite by consolidating to favor integration tests over heavy mocking (#f3e2e71)

[0.2.0]: https://github.com/photostructure/git-ssh-signing-action/compare/v0.1.0...v0.2.0

## [0.1.0] - 2025-01-16

### Added

- Initial release of Git SSH Signing Action
- Support for SSH commit signing with Ed25519, RSA, and ECDSA keys
- Automatic SSH key installation and Git configuration
- Post-action cleanup to remove keys and restore original Git config
- SSH agent integration for key management
- Support for creating allowed signers file for signature verification
- Configurable Git signing options (commit, tag, push)
- Output values for key path, public key, and fingerprint
- Comprehensive test suite with >90% coverage
- GitHub Actions workflows for CI/CD, CodeQL analysis, and dependency updates
- Security policy and contribution guidelines
- TypeScript implementation for better type safety and maintainability

### Security

- Secure file permissions (0600) for private SSH keys
- No logging of sensitive information
- Automatic cleanup of credentials after use
- Integration with GitHub security features (Dependabot, CodeQL)

[0.1.0]: https://github.com/photostructure/git-ssh-signing-action/releases/tag/v0.1.0
