# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### [1.2.0] - 2025-12-10

- ✨ Windows support with proper SSH key permission handling via `icacls`
- 📦 Clarified `README.md`: you don't need `--gpg-sign` (for `git commit`) or `--sign` (for `git tag`) arguments, as we set both `commit.gpgSign` and `tag.gpgSign` git config flags to true
- 📦 Updated devDependencies


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
